import { buildCart, getCartStats, addCartItem, updateCartItem, removeCartItem } from "../src/cart.js";
import { validatePositiveInt } from "../src/sanitize.js";

export const getCartDataControl = async (req, res) => {
  await buildCart(req);
  res.json({ cart: req.session.cart });
};

export const getCartStatsControl = async (req, res) => {
  if (!req || !req.session || !req.session.cart) return res.status(500).json({ error: "No cart data" });

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
