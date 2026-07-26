import { sendToBack } from "../util/api-front.js";
import { showLoadStatus, hideLoadStatus } from "../util/loading.js";
import { displayPopup } from "../util/popup.js";
import { buildShippingOption } from "../forms/cart-form.js";
import { buildCheckoutShippingOption } from "../forms/checkout-form.js";
import { updateCartSummary } from "./cart-run.js";
import { updateCheckoutSummary } from "./checkout-run.js";

const sortRatesByPrice = (rateData) => {
  return [...rateData].sort(
    (a, b) => Number(a.shipping_amount.amount) - Number(b.shipping_amount.amount),
  );
};

// The browser checks a clicked radio before this app's delegated click handler
// runs, so the DOM cannot tell us what was selected beforehand. Mark the option
// the server has actually accepted, and roll back to that when a select fails.
const confirmRadioSelection = (radio) => {
  if (!radio) return;

  const radioArray = document.querySelectorAll(`input[name="${radio.name}"]`);
  for (let i = 0; i < radioArray.length; i++) {
    delete radioArray[i].dataset.confirmed;
  }
  radio.dataset.confirmed = "true";
};

const restoreConfirmedSelection = (radioName) => {
  const radioArray = document.querySelectorAll(`input[name="${radioName}"]`);
  for (let i = 0; i < radioArray.length; i++) {
    radioArray[i].checked = radioArray[i].dataset.confirmed === "true";
  }
};

const selectShippingRate = async (option, radioName, refreshSummary) => {
  const radio = option.querySelector(`input[name="${radioName}"]`);
  if (radio) radio.checked = true;

  const result = await sendToBack({
    route: "/shipping/select",
    selectedRate: { rateId: Number(option.dataset.rateId) },
  });

  if (!result?.success) {
    restoreConfirmedSelection(radioName);
    await displayPopup("Unable to select shipping method", "error");
    return null;
  }

  confirmRadioSelection(radio);
  await refreshSummary();
  return true;
};

const showShippingLoadStatus = async (message) => {
  await showLoadStatus();
  const loadingText = document.querySelector(".loading-text");
  if (loadingText) loadingText.textContent = message;
};

const renderCartShippingOptions = (rateData) => {
  const container = document.getElementById("shipping-calculator-result");
  if (!container || !Array.isArray(rateData) || rateData.length === 0) return false;
  container.replaceChildren();
  const heading = document.createElement("h3");
  heading.className = "shipping-options-title";
  heading.textContent = "Select Shipping Method:";
  container.append(heading);
  const sortedRates = sortRatesByPrice(rateData);
  for (let i = 0; i < sortedRates.length; i++) {
    container.append(buildShippingOption(sortedRates[i]));
  }
  container.classList.remove("hidden");
  const firstRadio = container.querySelector('input[name="shipping-option"]');
  if (firstRadio) {
    firstRadio.checked = true;
    confirmRadioSelection(firstRadio);
  }
  return true;
};

const renderCheckoutShippingOptions = (shipping) => {
  const container = document.getElementById("checkout-shipping-container");
  if (!container) return false;
  container.replaceChildren();
  if (!Array.isArray(shipping?.rateData) || shipping.rateData.length === 0) {
    const message = document.createElement("p");
    message.className = "checkout-no-shipping";
    message.textContent = "Enter your ZIP code to see shipping options";
    container.append(message);
    return true;
  }
  const sortedRates = sortRatesByPrice(shipping.rateData);
  for (let i = 0; i < sortedRates.length; i++) {
    const option = buildCheckoutShippingOption(sortedRates[i]);
    const radio = option.querySelector("input");
    if (radio && sortedRates[i].rateId === shipping.selectedRate?.rateId) {
      radio.checked = true;
      confirmRadioSelection(radio);
    }
    container.append(option);
  }
  return true;
};

export const runCalculateShipping = async () => {
  const input = document.getElementById("cart-shipping-zip-input");
  if (!input || !/^\d{5}$/.test(input.value.trim())) return null;
  await showShippingLoadStatus("Calculating shipping rates. This may take a few seconds...");
  try {
    const cartData = await sendToBack({ route: "/cart/data" }, "GET");
    if (!cartData?.cart) {
      await displayPopup("Unable to load your cart", "error");
      return null;
    }
    const result = await sendToBack({
      route: "/shipping/calculate",
      zip: input.value.trim(),
      productArray: cartData.cart,
    });
    if (!result?.success || !renderCartShippingOptions(result.rateData)) {
      await displayPopup(result?.message || "Unable to calculate shipping", "error");
      return null;
    }
    await updateCartSummary();
    return true;
  } finally {
    await hideLoadStatus();
  }
};

export const runShippingOptionSelect = async (clickElement) => {
  if (!clickElement) return null;

  const option = clickElement.closest(".shipping-option");
  if (!option) return null;

  return await selectShippingRate(option, "shipping-option", updateCartSummary);
};

export const runCalculateShippingCheckout = async () => {
  const input = document.getElementById("zip");
  if (!input || !/^\d{5}$/.test(input.value.trim())) return null;
  await showShippingLoadStatus("Calculating shipping rates. This may take a few seconds...");
  try {
    const cartData = await sendToBack({ route: "/cart/data" }, "GET");
    if (!cartData?.cart) {
      await displayPopup("Unable to load your cart", "error");
      return null;
    }
    const result = await sendToBack({
      route: "/shipping/calculate",
      zip: input.value.trim(),
      productArray: cartData.cart,
    });
    if (!result?.success) {
      await displayPopup(result?.message || "Unable to calculate shipping", "error");
      return null;
    }
    await loadCheckoutShippingOptions();
    await updateCheckoutSummary();
    return true;
  } finally {
    await hideLoadStatus();
  }
};

export const runCheckoutShippingOptionSelect = async (clickElement) => {
  if (!clickElement) return null;

  const option = clickElement.closest(".checkout-shipping-option");
  if (!option) return null;

  return await selectShippingRate(option, "checkout-shipping-option", updateCheckoutSummary);
};

export const loadCheckoutShippingOptions = async () => {
  const result = await sendToBack({ route: "/shipping/data" }, "GET");
  renderCheckoutShippingOptions(result?.shipping);
  return result?.shipping || null;
};
