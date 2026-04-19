import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/db-model.js", () => {
  const MockDbModel = vi.fn();
  return { default: MockDbModel };
});

import dbModel from "../../models/db-model.js";
import { buildCart, addCartItem, getCartStats, updateCartItem, removeCartItem, updateCartSpins } from "../../src/cart.js";

process.env.PRODUCTS_COLLECTION = "products";

function mockReq(cartItems = [], bodyOverride = {}) {
  return {
    session: { cart: cartItems.length ? [...cartItems] : undefined },
    body: bodyOverride,
  };
}

// cartItemId defaults to `${productId}_0` matching the real cart logic
function makeItem(productId, price, quantity) {
  return { productId, cartItemId: `${productId}_0`, price, quantity, name: `Product ${productId}` };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getCartStats
// ---------------------------------------------------------------------------

describe("getCartStats", () => {
  it("returns itemCount 0, total 0, spinTotal 0, success true for empty session cart", async () => {
    const req = { session: { cart: [] }, body: {} };
    const result = await getCartStats(req);
    expect(result).toEqual({ itemCount: 0, total: 0, spinTotal: 0, success: true });
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

  it("includes spinCost in total and spinTotal when item has spinCost", async () => {
    const item = { ...makeItem("p1", 10, 1), spinCost: 30 };
    const req = { session: { cart: [item] }, body: {} };
    const result = await getCartStats(req);
    expect(result.total).toBe(40);
    expect(result.spinTotal).toBe(30);
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

  it("increments quantity and does NOT push a duplicate when same cartItemId already in cart", async () => {
    mockGetUniqueItem.mockResolvedValue({ productId: "abc123", price: 10, name: "Widget" });
    const req = {
      session: { cart: [{ productId: "abc123", cartItemId: "abc123_0", price: 10, quantity: 3, name: "Widget" }] },
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
      session: { cart: [{ productId: "abc123", cartItemId: "abc123_0", price: 9.99, quantity: 1, name: "Widget" }] },
      body: { data: { productId: "abc123", quantity: 1 } },
    };
    await addCartItem(req);
    expect(req.session.cart[0].price).toBe(19.99);
  });

  it("applies discount when productData has a discount field", async () => {
    mockGetUniqueItem.mockResolvedValue({ productId: "abc123", price: 100, discount: 20, name: "Widget" });
    const req = { session: { cart: [] }, body: { data: { productId: "abc123", quantity: 1 } } };
    const result = await addCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart[0].price).toBe(80);
  });

  it("returns success false for an invalid spin option", async () => {
    const req = { session: {}, body: { data: { productId: "abc123", quantity: 1, extraSpins: 99, spinCost: 999 } } };
    const result = await addCartItem(req);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid spin/i);
  });
});

// ---------------------------------------------------------------------------
// updateCartItem
// ---------------------------------------------------------------------------

describe("updateCartItem", () => {
  it("updates quantity of existing item in session", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 2)] },
      body: { cartItemId: "p1_0", quantity: 10 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart[0].quantity).toBe(10);
  });

  it("returns success false when quantity is 0", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 2)] },
      body: { cartItemId: "p1_0", quantity: 0 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/quantity/i);
  });

  it("returns success false when quantity is negative", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 2)] },
      body: { cartItemId: "p1_0", quantity: -1 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/quantity/i);
  });

  it("returns success false when cartItemId is not in cart", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 2)] },
      body: { cartItemId: "not-in-cart_0", quantity: 3 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not in cart/i);
  });

  it("updating one item does not affect other cart items", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 1), makeItem("p2", 10, 2)] },
      body: { cartItemId: "p1_0", quantity: 5 },
    };
    const result = await updateCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(2);
    expect(result.cart.find((i) => i.cartItemId === "p2_0").quantity).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// removeCartItem
// ---------------------------------------------------------------------------

describe("removeCartItem", () => {
  it("returns success false when req.body has no cartItemId", async () => {
    const req = { session: {}, body: {} };
    const result = await removeCartItem(req);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("removes matching item and preserves all other items", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 1), makeItem("p2", 10, 2), makeItem("p3", 15, 1)] },
      body: { cartItemId: "p2_0" },
    };
    const result = await removeCartItem(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(2);
    expect(result.cart.find((i) => i.cartItemId === "p2_0")).toBeUndefined();
    expect(result.cart.find((i) => i.cartItemId === "p1_0")).toBeDefined();
    expect(result.cart.find((i) => i.cartItemId === "p3_0")).toBeDefined();
  });

  it("returns success true and empty cart after removing last item", async () => {
    const req = {
      session: { cart: [makeItem("p1", 5, 1)] },
      body: { cartItemId: "p1_0" },
    };
    const result = await removeCartItem(req);
    expect(result).toEqual({ success: true, cart: [] });
  });
});

// ---------------------------------------------------------------------------
// updateCartSpins
// ---------------------------------------------------------------------------

describe("updateCartSpins", () => {
  it("returns success false for an invalid spin option", async () => {
    const req = {
      session: { cart: [makeItem("p1", 10, 1)] },
      body: { cartItemId: "p1_0", extraSpins: 99, spinCost: 999 },
    };
    const result = await updateCartSpins(req);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid spin/i);
  });

  it("returns success false when cartItemId is not in cart", async () => {
    const req = {
      session: { cart: [makeItem("p1", 10, 1)] },
      body: { cartItemId: "notexist_0", extraSpins: 0, spinCost: 0 },
    };
    const result = await updateCartSpins(req);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not in cart/i);
  });

  it("updates extraSpins, spinCost, and cartItemId on the existing item", async () => {
    const req = {
      session: { cart: [makeItem("p1", 10, 2)] },
      body: { cartItemId: "p1_0", extraSpins: 3, spinCost: 30 },
    };
    const result = await updateCartSpins(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(1);
    expect(result.cart[0].cartItemId).toBe("p1_3");
    expect(result.cart[0].extraSpins).toBe(3);
    expect(result.cart[0].spinCost).toBe(30);
  });

  it("merges quantities when the target cartItemId already exists in cart", async () => {
    const req = {
      session: {
        cart: [
          makeItem("p1", 10, 2),
          { productId: "p1", cartItemId: "p1_3", price: 10, quantity: 1, name: "Product p1", extraSpins: 3, spinCost: 30 },
        ],
      },
      body: { cartItemId: "p1_0", extraSpins: 3, spinCost: 30 },
    };
    const result = await updateCartSpins(req);
    expect(result.success).toBe(true);
    expect(result.cart).toHaveLength(1);
    expect(result.cart[0].cartItemId).toBe("p1_3");
    expect(result.cart[0].quantity).toBe(3);
  });

  it("switching back to 0 extraSpins updates cartItemId accordingly", async () => {
    const req = {
      session: { cart: [{ productId: "p1", cartItemId: "p1_3", price: 10, quantity: 1, name: "Product p1", extraSpins: 3, spinCost: 30 }] },
      body: { cartItemId: "p1_3", extraSpins: 0, spinCost: 0 },
    };
    const result = await updateCartSpins(req);
    expect(result.success).toBe(true);
    expect(result.cart[0].cartItemId).toBe("p1_0");
    expect(result.cart[0].extraSpins).toBe(0);
    expect(result.cart[0].spinCost).toBe(0);
  });
});
