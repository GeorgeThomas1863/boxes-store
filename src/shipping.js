import dbModel from "../models/db-model.js";
import { sanitizeMongoValue, validatePositiveInt, validateZip } from "./sanitize.js";

// Fallback for products saved without shipping fields — a small box, so
// missing data never blocks checkout. Real dimensions still win when set.
const DEFAULT_PACKAGE = { weight: 1, length: 8, width: 6, height: 4 };

const ENVELOPE_PACKAGE_TYPES = new Set([
  "letter",
  "thick_envelope",
  "large_envelope_or_flat",
  "flat_rate_envelope",
  "flat_rate_padded_envelope",
  "flat_rate_legal_envelope",
]);

export const fetchShippingRates = async (req) => {
  if (!req || !req.body || !req.body.zip || !req.body.productArray) {
    return { success: false, message: "No input parameters" };
  }

  const zip = validateZip(req.body.zip);
  if (!zip) return { success: false, message: "Invalid ZIP code" };

  const packageData = await aggregatePackageDimensions(req.body.productArray);
  if (!packageData.totalWeight && !packageData.maxLength && !packageData.maxWidth && !packageData.maxHeight) {
    return { success: false, message: "No shippable items in cart" };
  }

  capPackageGirth(packageData);

  const uspsCarrierId = await getUSPS();
  if (!uspsCarrierId) return { success: false, message: "Failed to get USPS carrier data" };

  const rateArray = await estimateShippingRates(uspsCarrierId, zip, packageData);
  if (!rateArray) return { success: false, message: "Failed to calculate shipping rate" };

  applyShippingAdjustments(rateArray);
  const rateData = removeEnvelopeRates(rateArray);
  if (!rateData.length) return { success: false, message: "No shipping options available for this address" };

  assignRateIds(rateData);
  const selectedRate = selectCheapestRate(rateData);

  req.session.shipping = {
    zip,
    rateData,
    selectedRate,
    calculatedAt: new Date().toISOString(),
  };

  return { success: true, message: "Shipping rate calculated successfully", rateData };
};

const aggregatePackageDimensions = async (productArray) => {
  const packageData = { totalWeight: 0, maxLength: 0, maxWidth: 0, maxHeight: 0 };
  if (!Array.isArray(productArray)) return packageData;

  for (let i = 0; i < productArray.length; i++) {
    const safeProductId = sanitizeMongoValue(productArray[i]?.productId);
    const safeQuantity = validatePositiveInt(productArray[i]?.quantity);
    if (!safeProductId || !safeQuantity) continue;

    const productModel = new dbModel(
      { keyToLookup: "productId", itemValue: safeProductId },
      process.env.PRODUCTS_COLLECTION
    );
    const productData = await productModel.getUniqueItem();
    if (!productData) continue;

    packageData.totalWeight += (productData.weight || DEFAULT_PACKAGE.weight) * safeQuantity;
    packageData.maxLength = Math.max(packageData.maxLength, productData.length || DEFAULT_PACKAGE.length);
    packageData.maxWidth = Math.max(packageData.maxWidth, productData.width || DEFAULT_PACKAGE.width);
    packageData.maxHeight = Math.max(packageData.maxHeight, productData.height || DEFAULT_PACKAGE.height);
  }

  return packageData;
};

const capPackageGirth = (packageData) => {
  const girth = 2 * (packageData.maxWidth + packageData.maxHeight);
  if (girth <= 100) return;

  const scale = 100 / girth;
  packageData.maxWidth *= scale;
  packageData.maxHeight *= scale;
};

export const getUSPS = async () => {
  try {
    const response = await fetch(`${process.env.SHIP_STATION_BASE_URL}/carriers`, {
      headers: { "API-Key": process.env.SHIP_STATION_API_KEY },
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !Array.isArray(data.carriers)) return null;

    for (let i = 0; i < data.carriers.length; i++) {
      if (data.carriers[i].friendly_name === "USPS") return data.carriers[i].carrier_id;
    }
    return null;
  } catch (e) {
    console.error("SHIPSTATION CARRIERS ERROR:", e);
    return null;
  }
};

const estimateShippingRates = async (uspsCarrierId, zip, packageData) => {
  const body = {
    carrier_ids: [uspsCarrierId],
    from_country_code: "US",
    from_postal_code: process.env.SHIPPING_ZIP,
    to_country_code: "US",
    to_postal_code: zip,
    weight: { value: packageData.totalWeight, unit: "pound" },
    dimensions: {
      unit: "inch",
      length: packageData.maxLength,
      width: packageData.maxWidth,
      height: packageData.maxHeight,
    },
    address_residential_indicator: "yes",
  };

  try {
    const response = await fetch(`${process.env.SHIP_STATION_BASE_URL}/rates/estimate`, {
      method: "POST",
      headers: {
        "API-Key": process.env.SHIP_STATION_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;

    const rateArray = await response.json();
    if (!Array.isArray(rateArray)) return null;
    return rateArray;
  } catch (e) {
    console.error("SHIPSTATION RATES ERROR:", e);
    return null;
  }
};

export const applyShippingAdjustments = (rateArray) => {
  if (!Array.isArray(rateArray)) return rateArray;

  for (let i = 0; i < rateArray.length; i++) {
    const rate = rateArray[i];
    if (rate.shipping_amount?.amount !== undefined) {
      rate.shipping_amount.amount = Number(rate.shipping_amount.amount) + 2;
    }
    if (rate.delivery_days !== undefined) rate.delivery_days = Number(rate.delivery_days) + 2;
    if (rate.estimated_delivery_date) {
      // API may return full ISO timestamps — keep only the calendar date
      const datePart = String(rate.estimated_delivery_date).slice(0, 10);
      const deliveryDate = new Date(`${datePart}T00:00:00.000Z`);
      if (Number.isNaN(deliveryDate.getTime())) {
        // Unparseable date: drop it so the UI falls back to delivery_days
        delete rate.estimated_delivery_date;
        continue;
      }
      deliveryDate.setUTCDate(deliveryDate.getUTCDate() + 2);
      rate.estimated_delivery_date = deliveryDate.toISOString().slice(0, 10);
    }
  }

  return rateArray;
};

const removeEnvelopeRates = (rateArray) => {
  const rateData = [];
  for (let i = 0; i < rateArray.length; i++) {
    const serviceType = String(rateArray[i].service_type || "").toLowerCase();
    if (ENVELOPE_PACKAGE_TYPES.has(rateArray[i].package_type)) continue;
    if (serviceType.includes("envelope") || serviceType.includes("media mail")) continue;
    rateData.push(rateArray[i]);
  }
  return rateData;
};

const assignRateIds = (rateData) => {
  for (let i = 0; i < rateData.length; i++) {
    rateData[i].rateId = i;
  }
};

const selectCheapestRate = (rateData) => {
  if (!rateData.length) return null;

  let selectedRate = rateData[0];
  for (let i = 1; i < rateData.length; i++) {
    if (Number(rateData[i].shipping_amount?.amount) < Number(selectedRate.shipping_amount?.amount)) {
      selectedRate = rateData[i];
    }
  }
  return selectedRate;
};

export const getShippingFromSession = (req) => {
  if (!req?.session?.shipping) return { success: false, message: "No shipping data in session" };
  return { success: true, shipping: req.session.shipping };
};

export const clearShippingFromSession = (req) => {
  req.session.shipping = null;
  return { success: true };
};

export const updateSelectedRate = (req) => {
  if (!req?.session?.shipping?.rateData) {
    return { success: false, message: "No shipping rates in session. Calculate shipping first." };
  }

  const rateId = req.body?.selectedRate?.rateId;
  if (typeof rateId !== "number" || !Number.isInteger(rateId) || rateId < 0 ||
      rateId >= req.session.shipping.rateData.length) {
    return { success: false, message: "Invalid rate selection" };
  }

  req.session.shipping.selectedRate = req.session.shipping.rateData[rateId];
  return { success: true, shipping: req.session.shipping };
};

export const getSelectedShippingCost = (req) => {
  const amount = req?.session?.shipping?.selectedRate?.shipping_amount?.amount;
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return null;
  return Math.round(Number(amount) * 100) / 100;
};
