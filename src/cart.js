import dbModel from "../models/db-model.js";
import { validatePositiveInt, sanitizeMongoValue } from "./sanitize.js";

const VALID_SPIN_OPTIONS = [
  { extraSpins: 0, spinCost: 0 },
  { extraSpins: 3, spinCost: 30 },
];
const isValidSpinOption = (extraSpins, spinCost) =>
  VALID_SPIN_OPTIONS.some(opt => opt.extraSpins === extraSpins && opt.spinCost === spinCost);

export const buildCart = async (req) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
};

export const addCartItem = async (req) => {
  await buildCart(req);

  const { productId, quantity } = req.body.data;

  const rawExtraSpins = req.body.data?.extraSpins;
  const rawSpinCost = req.body.data?.spinCost;
  const extraSpins = rawExtraSpins !== undefined ? Number(rawExtraSpins) : 0;
  const spinCost = rawSpinCost !== undefined ? Number(rawSpinCost) : 0;
  if (!isValidSpinOption(extraSpins, spinCost)) {
    return { success: false, message: "Invalid spin option" };
  }

  // Validate inputs
  const safeProductId = sanitizeMongoValue(productId);
  const safeQuantity = validatePositiveInt(quantity);
  if (!safeProductId || !safeQuantity) {
    return { success: false, message: "Invalid product ID or quantity" };
  }
  const cartItemId = `${safeProductId}_${extraSpins}`;

  // Look up the real product from DB to get trusted price
  const productModel = new dbModel({ keyToLookup: "productId", itemValue: safeProductId }, process.env.PRODUCTS_COLLECTION);
  const productData = await productModel.getUniqueItem();
  if (!productData) return { success: false, message: "Product not found" };

  const discount = productData.discount || 0;
  const rawPrice = productData.price;
  const effectivePrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100) * 100) / 100 : rawPrice;

  let existingItem = null;
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].cartItemId !== cartItemId) continue;

    existingItem = req.session.cart[i];
    break;
  }

  // Update quantity if already exists
  if (existingItem) {
    existingItem.quantity += safeQuantity;
    existingItem.price = effectivePrice; // Always use DB price (post-discount)
    existingItem.originalPrice = rawPrice;
    existingItem.discount = discount;
  } else {
    // Build cart item from DB data — never trust client-supplied price
    const cartItem = {
      ...productData,
      cartItemId,
      productId: safeProductId,
      quantity: safeQuantity,
      price: effectivePrice,
      originalPrice: rawPrice,
      discount,
      extraSpins,
      spinCost,
    };
    req.session.cart.push(cartItem);
  }

  let itemCount = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    itemCount += req.session.cart[i].quantity;
  }

  return { success: true, cart: req.session.cart, itemCount: itemCount };
};

export const getCartStats = async (req) => {
  await buildCart(req);

  let itemCount = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    itemCount += req.session.cart[i].quantity;
  }

  let total = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    total += (req.session.cart[i].price + (req.session.cart[i].spinCost || 0)) * req.session.cart[i].quantity;
  }

  let spinTotal = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    spinTotal += (req.session.cart[i].spinCost || 0) * req.session.cart[i].quantity;
  }

  return { itemCount, total, spinTotal, success: true };
};

export const updateCartItem = async (req) => {
  const { cartItemId } = req.body;
  const safeQuantity = validatePositiveInt(req.body.quantity);
  if (safeQuantity === null) {
    return { success: false, message: "Invalid quantity" };
  }
  await buildCart(req);

  let item = null;
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].cartItemId !== cartItemId) continue;

    item = req.session.cart[i];
    break;
  }

  if (!item) {
    return { success: false, message: "Item not in cart" };
  }

  if (safeQuantity <= 0) {
    // Remove item if quantity is 0 or less
    let newCart = [];
    for (let i = 0; i < req.session.cart.length; i++) {
      if (req.session.cart[i].cartItemId !== cartItemId) {
        newCart.push(req.session.cart[i]);
      }
    }
    req.session.cart = newCart;
  } else {
    item.quantity = safeQuantity;
  }

  return { success: true, cart: req.session.cart };
};

export const removeCartItem = async (req) => {
  const { cartItemId } = req.body;
  if (!cartItemId) return { success: false, error: "No cart item ID" };
  await buildCart(req);

  let newCart = [];
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].cartItemId !== cartItemId) {
      newCart.push(req.session.cart[i]);
    }
  }
  req.session.cart = newCart;

  return { success: true, cart: req.session.cart };
};

export const updateCartSpins = async (req) => {
  await buildCart(req);
  const { cartItemId, extraSpins: rawExtraSpins, spinCost: rawSpinCost } = req.body;
  const extraSpins = Number(rawExtraSpins);
  const spinCost = Number(rawSpinCost);
  if (!isValidSpinOption(extraSpins, spinCost)) {
    return { success: false, message: "Invalid spin option" };
  }
  let item = null;
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].cartItemId !== cartItemId) continue;
    item = req.session.cart[i];
    break;
  }
  if (!item) return { success: false, message: "Item not in cart" };
  const newCartItemId = `${item.productId}_${extraSpins}`;
  let mergeTarget = null;
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].cartItemId !== newCartItemId) continue;
    if (req.session.cart[i].cartItemId === cartItemId) continue;
    mergeTarget = req.session.cart[i];
    break;
  }
  if (mergeTarget) {
    mergeTarget.quantity += item.quantity;
    let newCart = [];
    for (let i = 0; i < req.session.cart.length; i++) {
      if (req.session.cart[i].cartItemId !== cartItemId) {
        newCart.push(req.session.cart[i]);
      }
    }
    req.session.cart = newCart;
  } else {
    item.extraSpins = extraSpins;
    item.spinCost = spinCost;
    item.cartItemId = newCartItemId;
  }
  return { success: true, cart: req.session.cart };
};
