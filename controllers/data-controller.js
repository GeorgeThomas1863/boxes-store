import { buildCart, getCartStats, addCartItem, updateCartItem, removeCartItem } from "../src/cart.js";
import { validatePositiveInt, validateEmail, validateZip, validateString } from "../src/sanitize.js";
import { placeNewOrder } from "../src/orders.js";
import { createPaymentIntent, refundPayment } from "../src/payments.js";
import { updateProduct } from "../src/products.js";

export const getCartDataControl = async (req, res) => {
  await buildCart(req);
  res.json({ cart: req.session.cart });
};

export const getCartStatsControl = async (req, res) => {
  if (!req || !req.session) return res.status(500).json({ error: "No session" });

  const data = await getCartStats(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to get cart stats" });

  res.json(data);
};

export const addToCartControl = async (req, res) => {
  if (!req || !req.body || !req.body.data) return res.status(500).json({ error: "No input parameters" });

  const { productId, quantity } = req.body.data;
  if (typeof productId === "object") return res.status(400).json({ error: "Invalid product ID" });
  if (!validatePositiveInt(quantity)) return res.status(400).json({ error: "Invalid quantity" });

  const data = await addCartItem(req);
  if (!data || !data.success) return res.status(500).json({ error: data?.message || "Failed to add item to cart" });

  res.json(data);
};

export const updateCartItemControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });

  const data = await updateCartItem(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to update cart item" });

  res.json(data);
};

export const removeFromCartControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });

  const data = await removeCartItem(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to remove item from cart" });

  res.json(data);
};

export const clearCartControl = async (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [] });
};

const markProductsSold = async (cartItems) => {
  if (!cartItems || !cartItems.length) return;
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    if (item.productId) {
      await updateProduct({ productId: item.productId, sold: true }).catch((e) =>
        console.error("MARK PRODUCT SOLD ERROR:", e)
      );
    }
  }
};

export const getStripeConfigControl = (req, res) => {
  return res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    taxRate: parseFloat(process.env.TAX_RATE) || 0,
  });
};

export const createPaymentIntentControl = async (req, res) => {
  if (!req || !req.session) return res.status(500).json({ error: "No session" });

  const cartStats = await getCartStats(req);
  if (!cartStats || !cartStats.success || cartStats.total <= 0) {
    return res.status(400).json({ error: "Cart is empty or invalid" });
  }

  const subtotal = Math.round(cartStats.total * 100) / 100;
  const taxRate = parseFloat(process.env.TAX_RATE) || 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const totalCost = Math.round((subtotal + tax) * 100) / 100;
  const totalInCents = Math.round(totalCost * 100);

  const result = await createPaymentIntent(totalInCents);
  if (!result || !result.success) {
    return res.status(500).json({ error: result?.message || "Failed to create payment intent" });
  }

  req.session.pendingPaymentIntentId = result.paymentIntentId;

  return res.json({ clientSecret: result.clientSecret });
};

export const placeOrderControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });
  if (!req.body.paymentIntentId) return res.status(400).json({ error: "No payment intent ID" });

  // Verify the paymentIntentId matches the one created for this session
  if (!req.session.pendingPaymentIntentId || req.body.paymentIntentId !== req.session.pendingPaymentIntentId) {
    return res.status(400).json({ error: "Invalid payment intent" });
  }

  const { firstName, lastName, email, phone, address, city, state, zip } = req.body;

  if (!validateString(firstName, 100) || !validateString(lastName, 100)) {
    return res.status(400).json({ error: "Invalid name" });
  }
  if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email" });
  if (!validateString(phone, 30)) return res.status(400).json({ error: "Invalid phone" });
  if (!validateString(address, 200)) return res.status(400).json({ error: "Invalid address" });
  if (!validateString(city, 100)) return res.status(400).json({ error: "Invalid city" });
  if (!validateString(state, 50)) return res.status(400).json({ error: "Invalid state" });
  if (!validateZip(zip)) return res.status(400).json({ error: "Invalid ZIP code" });

  // Clear pending intent from session before order attempt (prevents replay)
  req.session.pendingPaymentIntentId = null;

  const data = await placeNewOrder(req);

  if (!data.success) {
    // Payment was already captured — attempt a refund so customer is not charged
    console.error("ORDER PLACEMENT FAILED after payment captured — attempting refund. PaymentIntentId:", req.body.paymentIntentId);
    refundPayment(req.body.paymentIntentId).catch((e) => console.error("REFUND FAILED:", e));
    return res.status(500).json({ success: false, message: data.message || "Order failed. A refund has been initiated. Please contact support." });
  }

  if (data.data && data.data.cartData) {
    markProductsSold(data.data.cartData).catch((e) => console.error("MARK SOLD ERROR:", e));
  }

  return res.json(data);
};
