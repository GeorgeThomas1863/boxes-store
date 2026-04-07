import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock cart module before importing the controller
vi.mock("../../src/cart.js", () => ({
  buildCart: vi.fn(),
  getCartStats: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

// Mock sanitize module
vi.mock("../../src/sanitize.js", () => ({
  validatePositiveInt: vi.fn(),
  sanitizeMongoValue: vi.fn(),
}));

// Mock dotenv so it doesn't try to read a real .env
vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

import {
  getCartDataControl,
  getCartStatsControl,
  addToCartControl,
  updateCartItemControl,
  removeFromCartControl,
  clearCartControl,
} from "../../controllers/data-controller.js";

import {
  buildCart,
  getCartStats,
  addCartItem,
  updateCartItem,
  removeCartItem,
} from "../../src/cart.js";

import { validatePositiveInt } from "../../src/sanitize.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };
  return res;
}

function mockReq(overrides = {}) {
  return {
    body: {},
    session: { cart: [] },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getCartDataControl
// ---------------------------------------------------------------------------

describe("getCartDataControl", () => {
  it("calls buildCart and responds with session cart", async () => {
    const cart = [{ productId: "abc", quantity: 2 }];
    const req = mockReq({ session: { cart } });
    const res = mockRes();

    buildCart.mockResolvedValue(cart);

    await getCartDataControl(req, res);

    expect(buildCart).toHaveBeenCalledWith(req);
    expect(res._body).toEqual({ cart });
  });

  it("responds with empty array when session cart is empty", async () => {
    const req = mockReq({ session: { cart: [] } });
    const res = mockRes();

    buildCart.mockResolvedValue([]);

    await getCartDataControl(req, res);

    expect(res._body).toEqual({ cart: [] });
  });
});

// ---------------------------------------------------------------------------
// getCartStatsControl
// ---------------------------------------------------------------------------

describe("getCartStatsControl", () => {
  it("returns 500 when req is missing session", async () => {
    const req = { body: {} }; // no session
    const res = mockRes();

    await getCartStatsControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("No session");
  });

  it("returns 500 when req is falsy", async () => {
    const res = mockRes();

    await getCartStatsControl(null, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("No session");
  });

  it("returns 500 when getCartStats returns falsy", async () => {
    getCartStats.mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();

    await getCartStatsControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to get cart stats");
  });

  it("returns 500 when getCartStats returns { success: false }", async () => {
    getCartStats.mockResolvedValue({ success: false });
    const req = mockReq();
    const res = mockRes();

    await getCartStatsControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to get cart stats");
  });

  it("returns stats data on success", async () => {
    const stats = { success: true, itemCount: 3, total: 59.97 };
    getCartStats.mockResolvedValue(stats);
    const req = mockReq();
    const res = mockRes();

    await getCartStatsControl(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(stats);
  });
});

// ---------------------------------------------------------------------------
// addToCartControl
// ---------------------------------------------------------------------------

describe("addToCartControl", () => {
  it("returns 500 when req.body.data is missing", async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await addToCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("No input parameters");
  });

  it("returns 500 when req.body is missing", async () => {
    const req = { session: { cart: [] } }; // no body
    const res = mockRes();

    await addToCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("No input parameters");
  });

  it("returns 400 when productId is an object (NoSQL injection attempt)", async () => {
    const req = mockReq({
      body: { data: { productId: { $gt: "" }, quantity: 1 } },
    });
    const res = mockRes();

    validatePositiveInt.mockReturnValue(1);

    await addToCartControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toBe("Invalid product ID");
  });

  it("returns 400 when quantity is invalid (validatePositiveInt returns null)", async () => {
    validatePositiveInt.mockReturnValue(null);
    const req = mockReq({
      body: { data: { productId: "abc123", quantity: -5 } },
    });
    const res = mockRes();

    await addToCartControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toBe("Invalid quantity");
  });

  it("returns 500 when addCartItem returns falsy", async () => {
    validatePositiveInt.mockReturnValue(2);
    addCartItem.mockResolvedValue(null);

    const req = mockReq({
      body: { data: { productId: "abc123", quantity: 2 } },
    });
    const res = mockRes();

    await addToCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBeTruthy();
  });

  it("returns 500 with addCartItem message when it returns { success: false, message }", async () => {
    validatePositiveInt.mockReturnValue(2);
    addCartItem.mockResolvedValue({ success: false, message: "Product not found" });

    const req = mockReq({
      body: { data: { productId: "abc123", quantity: 2 } },
    });
    const res = mockRes();

    await addToCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Product not found");
  });

  it("returns 200 with cart data on success", async () => {
    validatePositiveInt.mockReturnValue(1);
    const cartData = { success: true, cart: [{ productId: "abc123", quantity: 1 }], itemCount: 1 };
    addCartItem.mockResolvedValue(cartData);

    const req = mockReq({
      body: { data: { productId: "abc123", quantity: 1 } },
    });
    const res = mockRes();

    await addToCartControl(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(cartData);
  });
});

// ---------------------------------------------------------------------------
// updateCartItemControl
// ---------------------------------------------------------------------------

describe("updateCartItemControl", () => {
  it("returns 500 when req.body is missing", async () => {
    const req = { session: { cart: [] } }; // no body
    const res = mockRes();

    await updateCartItemControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("No input parameters");
  });

  it("returns 500 when updateCartItem returns falsy", async () => {
    updateCartItem.mockResolvedValue(null);
    const req = mockReq({ body: { productId: "abc123", quantity: 2 } });
    const res = mockRes();

    await updateCartItemControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to update cart item");
  });

  it("returns 500 when updateCartItem returns { success: false }", async () => {
    updateCartItem.mockResolvedValue({ success: false });
    const req = mockReq({ body: { productId: "abc123", quantity: 2 } });
    const res = mockRes();

    await updateCartItemControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to update cart item");
  });

  it("returns 200 with updated cart on success", async () => {
    const cartData = { success: true, cart: [{ productId: "abc123", quantity: 3 }] };
    updateCartItem.mockResolvedValue(cartData);
    const req = mockReq({ body: { productId: "abc123", quantity: 3 } });
    const res = mockRes();

    await updateCartItemControl(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(cartData);
  });
});

// ---------------------------------------------------------------------------
// removeFromCartControl
// ---------------------------------------------------------------------------

describe("removeFromCartControl", () => {
  it("returns 500 when req.body is missing", async () => {
    const req = { session: { cart: [] } }; // no body
    const res = mockRes();

    await removeFromCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("No input parameters");
  });

  it("returns 500 when removeCartItem returns falsy", async () => {
    removeCartItem.mockResolvedValue(null);
    const req = mockReq({ body: { productId: "abc123" } });
    const res = mockRes();

    await removeFromCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to remove item from cart");
  });

  it("returns 500 when removeCartItem returns { success: false }", async () => {
    removeCartItem.mockResolvedValue({ success: false });
    const req = mockReq({ body: { productId: "abc123" } });
    const res = mockRes();

    await removeFromCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to remove item from cart");
  });

  it("returns 200 with updated cart on success", async () => {
    const cartData = { success: true, cart: [] };
    removeCartItem.mockResolvedValue(cartData);
    const req = mockReq({ body: { productId: "abc123" } });
    const res = mockRes();

    await removeFromCartControl(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(cartData);
  });
});

// ---------------------------------------------------------------------------
// clearCartControl
// ---------------------------------------------------------------------------

describe("clearCartControl", () => {
  it("resets session.cart to empty array and responds with success", async () => {
    const req = mockReq({
      session: { cart: [{ productId: "abc123", quantity: 2 }] },
    });
    const res = mockRes();

    await clearCartControl(req, res);

    expect(req.session.cart).toEqual([]);
    expect(res._status).toBe(200);
    expect(res._body).toEqual({ success: true, cart: [] });
  });

  it("works when cart is already empty", async () => {
    const req = mockReq({ session: { cart: [] } });
    const res = mockRes();

    await clearCartControl(req, res);

    expect(req.session.cart).toEqual([]);
    expect(res._body).toEqual({ success: true, cart: [] });
  });

  it("clears a cart with multiple items", async () => {
    const req = mockReq({
      session: {
        cart: [
          { productId: "p1", quantity: 1 },
          { productId: "p2", quantity: 3 },
          { productId: "p3", quantity: 5 },
        ],
      },
    });
    const res = mockRes();

    await clearCartControl(req, res);

    expect(req.session.cart).toHaveLength(0);
    expect(res._body.success).toBe(true);
  });
});
