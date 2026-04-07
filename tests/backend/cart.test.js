import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/db-model.js", () => {
  const MockDbModel = vi.fn();
  return { default: MockDbModel };
});

import dbModel from "../../models/db-model.js";
import { buildCart, addCartItem, getCartStats, updateCartItem, removeCartItem } from "../../src/cart.js";

process.env.PRODUCTS_COLLECTION = "products";

function mockReq(cartItems = [], bodyOverride = {}) {
  return {
    session: { cart: cartItems.length ? [...cartItems] : undefined },
    body: bodyOverride,
  };
}

function makeItem(productId, price, quantity) {
  return { productId, price, quantity, name: `Product ${productId}` };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getCartStats
// ---------------------------------------------------------------------------

describe("getCartStats", () => {
  it("returns itemCount 0, total 0, success true for empty session cart", async () => {
    const req = { session: { cart: [] }, body: {} };
    const result = await getCartStats(req);
    expect(result).toEqual({ itemCount: 0, total: 0, success: true });
  });

  it("sets req.session.cart to [] when cart is missing from session", async () => {
    const req = { session: {}, body: {} };
    await getCartStats(req);
    expect(req.session.cart).toEqual([]);
  });

  it("returns correct itemCount for a single item with quantity 3", async () => {
    const req = { session: { cart: [makeItem("abc", 10, 3)] }, body: {} };
    const result = await getCartStats(req);
    expect(result.itemCount).toBe(3);
    expect(result.success).toBe(true);
  });

  it("returns total as sum of price * quantity across multiple items", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5.0, 2), makeItem("p2", 12.5, 4)] },
      body: {},
    };
    const result = await getCartStats(req);
    expect(result.total).toBe(60);
    expect(result.itemCount).toBe(6);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addCartItem
// ---------------------------------------------------------------------------

describe("addCartItem", () => {
  let mockGetUniqueItem;

  beforeEach(() => {
    mockGetUniqueItem = vi.fn();
    dbModel.mockImplementation(function () { this.getUniqueItem = mockGetUniqueItem; });
  });

  it("returns success false when quantity is 0", async () => {
    const req = { session: {}, body: { data: { productId: "abc123", quantity: 0 } } };
    const result = await addCartItem(req);
    expect(result.success).toBe(false);
    expect(mockGetUniqueItem).not.toHaveBeenCalled();
  });

  it("returns success false when quantity is negative", async () => {
    const req = { session: {}, body: { data: { productId: "abc123", quantity: -5 } } };
    const result = await addCartItem(req);
    expect(result.success).toBe(false);
    expect(mockGetUniqueItem).not.toHaveBeenCalled();
  });

  it("returns success false with 'Product not found' when getUniqueItem returns null", async () => {
    mockGetUniqueItem.mockResolvedValue(null);
    const req = { session: {}, body: { data: { productId: "abc123", quantity: 1 } } };
    const result = await addCartItem(req);
    expect(result).toEqual({ success: false, message: "Product not found" });
  });

  it("uses DB price from productData, not any client-supplied price", async () => {
    mockGetUniqueItem.mockResolvedValue({ productId: "abc123", price: 99.99, name: "Widget" });
    const req = { session: {}, body: { data: { productId: "abc123", quantity: 1, price: 1.0 } } };
    const result = await addCartItem(req);
    expect(result.success).toBe(true);
    const item = result.cart.find((i) => i.productId === "abc123");
    expect(item.price).toBe(99.99);
  });

  it("pushes new item to cart on successful add", async () => {
    mockGetUniqueItem.mockResolvedValue({ productId: "abc123", price: 10, name: "Widget" });
    const req = { session: { cart: [] }, body: { data: { productId: "abc123", quantity: 2 } } };
    const result = await addCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(1);
    expect(result.cart[0]).toMatchObject({ productId: "abc123", quantity: 2, price: 10 });
  });

  it("increments quantity and does NOT push a duplicate when same productId already in cart", async () => {
    mockGetUniqueItem.mockResolvedValue({ productId: "abc123", price: 10, name: "Widget" });
    const req = {
      session: { cart: [{ productId: "abc123", price: 10, quantity: 3, name: "Widget" }] },
      body: { data: { productId: "abc123", quantity: 2 } },
    };
    const result = await addCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(1);
    expect(result.cart[0].quantity).toBe(5);
  });

  it("updates existing item's price to DB price on duplicate add", async () => {
    mockGetUniqueItem.mockResolvedValue({ productId: "abc123", price: 19.99, name: "Widget" });
    const req = {
      session: { cart: [{ productId: "abc123", price: 9.99, quantity: 1, name: "Widget" }] },
      body: { data: { productId: "abc123", quantity: 1 } },
    };
    await addCartItem(req);
    expect(req.session.cart[0].price).toBe(19.99);
  });
});

// ---------------------------------------------------------------------------
// updateCartItem
// ---------------------------------------------------------------------------

describe("updateCartItem", () => {
  it("updates quantity of existing item in session", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 2)] },
      body: { productId: "p1", quantity: 10 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart[0].quantity).toBe(10);
  });

  it("removes item from cart when quantity is 0", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 2)] },
      body: { productId: "p1", quantity: 0 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(0);
  });

  it("removes item from cart when quantity is negative", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 2)] },
      body: { productId: "p1", quantity: -1 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(0);
  });

  it("returns success true without crashing when productId is not in cart", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 2)] },
      body: { productId: "not-in-cart", quantity: 3 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(1);
  });

  it("preserves other cart items when removing one", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 1), makeItem("p2", 10, 2)] },
      body: { productId: "p1", quantity: 0 },
    };
    const result = await updateCartItem(req);
    expect(result.cart).toHaveLength(1);
    expect(result.cart[0].productId).toBe("p2");
  });
});

// ---------------------------------------------------------------------------
// removeCartItem
// ---------------------------------------------------------------------------

describe("removeCartItem", () => {
  it("returns success false when req.body has no productId", async () => {
    const req = { session: {}, body: {} };
    const result = await removeCartItem(req);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("removes matching item and preserves all other items", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 1), makeItem("p2", 10, 2), makeItem("p3", 15, 1)] },
      body: { productId: "p2" },
    };
    const result = await removeCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(2);
    expect(result.cart.find((i) => i.productId === "p2")).toBeUndefined();
    expect(result.cart.find((i) => i.productId === "p1")).toBeDefined();
    expect(result.cart.find((i) => i.productId === "p3")).toBeDefined();
  });

  it("returns success true and empty cart after removing last item", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 1)] },
      body: { productId: "p1" },
    };
    const result = await removeCartItem(req);
    expect(result).toEqual({ success: true, cart: [] });
  });
});
