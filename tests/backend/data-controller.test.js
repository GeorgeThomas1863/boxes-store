import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock cart module before importing the controller
vi.mock("../../src/cart.js", () => ({
  buildCart: vi.fn(),
  getCartStats: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  updateCartSpins: vi.fn(),
}));

// Mock sanitize module
vi.mock("../../src/sanitize.js", () => ({
  validatePositiveInt: vi.fn(),
  sanitizeMongoValue: vi.fn(),
  validateEmail: vi.fn(),
  validateZip: vi.fn(),
  validateString: vi.fn(),
}));

// Mock dotenv so it doesn't try to read a real .env
vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

// Mock DB-touching modules not under test (prevent top-level dbConnect from firing)
vi.mock("../../src/orders.js", () => ({ placeNewOrder: vi.fn() }));
vi.mock("../../src/payments.js", () => ({ createPaymentIntent: vi.fn(), refundPayment: vi.fn() }));
vi.mock("../../src/products.js", () => ({ updateProduct: vi.fn() }));
vi.mock("../../src/contact.js", () => ({ submitContact: vi.fn() }));

import {
  getCartDataControl,
  getCartStatsControl,
  addToCartControl,
  updateCartItemControl,
  removeFromCartControl,
  clearCartControl,
  updateCartSpinsControl,
  getStripeConfigControl,
  createPaymentIntentControl,
} from "../../controllers/data-controller.js";

import {
  buildCart,
  getCartStats,
  addCartItem,
  updateCartItem,
  removeCartItem,
  updateCartSpins,
} from "../../src/cart.js";

import { validatePositiveInt } from "../../src/sanitize.js";
import { createPaymentIntent } from "../../src/payments.js";

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
    const req = mockReq({ body: { cartItemId: "abc123_0", quantity: 2 } });
    const res = mockRes();

    await updateCartItemControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to update cart item");
  });

  it("returns 500 when updateCartItem returns { success: false }", async () => {
    updateCartItem.mockResolvedValue({ success: false });
    const req = mockReq({ body: { cartItemId: "abc123_0", quantity: 2 } });
    const res = mockRes();

    await updateCartItemControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to update cart item");
  });

  it("returns 200 with updated cart on success", async () => {
    const cartData = { success: true, cart: [{ cartItemId: "abc123_0", quantity: 3 }] };
    updateCartItem.mockResolvedValue(cartData);
    const req = mockReq({ body: { cartItemId: "abc123_0", quantity: 3 } });
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
    const req = mockReq({ body: { cartItemId: "abc123_0" } });
    const res = mockRes();

    await removeFromCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to remove item from cart");
  });

  it("returns 500 when removeCartItem returns { success: false }", async () => {
    removeCartItem.mockResolvedValue({ success: false });
    const req = mockReq({ body: { cartItemId: "abc123_0" } });
    const res = mockRes();

    await removeFromCartControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Failed to remove item from cart");
  });

  it("returns 200 with updated cart on success", async () => {
    const cartData = { success: true, cart: [] };
    removeCartItem.mockResolvedValue(cartData);
    const req = mockReq({ body: { cartItemId: "abc123_0" } });
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
      session: { cart: [{ cartItemId: "abc123_0", quantity: 2 }] },
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
          { cartItemId: "p1_0", quantity: 1 },
          { cartItemId: "p2_0", quantity: 3 },
          { cartItemId: "p3_0", quantity: 5 },
        ],
      },
    });
    const res = mockRes();

    await clearCartControl(req, res);

    expect(req.session.cart).toHaveLength(0);
    expect(res._body.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateCartSpinsControl
// ---------------------------------------------------------------------------

describe("updateCartSpinsControl", () => {
  it("returns 400 when req.body is missing", async () => {
    const req = { session: { cart: [] } }; // no body
    const res = mockRes();

    await updateCartSpinsControl(req, res);

    expect(res._status).toBe(400);
  });

  it("passes result from updateCartSpins through on success", async () => {
    const cartData = { success: true, cart: [{ cartItemId: "p1_3", extraSpins: 3 }] };
    updateCartSpins.mockResolvedValue(cartData);
    const req = mockReq({ body: { cartItemId: "p1_0", extraSpins: 3, spinCost: 30 } });
    const res = mockRes();

    await updateCartSpinsControl(req, res);

    expect(res._body).toEqual(cartData);
  });

  it("passes failure result from updateCartSpins through", async () => {
    updateCartSpins.mockResolvedValue({ success: false, message: "Invalid spin option" });
    const req = mockReq({ body: { cartItemId: "p1_0", extraSpins: 99, spinCost: 999 } });
    const res = mockRes();

    await updateCartSpinsControl(req, res);

    expect(res._body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getStripeConfigControl
// ---------------------------------------------------------------------------

describe("getStripeConfigControl", () => {
  it("returns publishableKey from env", () => {
    process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_abc";
    const req = mockReq();
    const res = mockRes();

    getStripeConfigControl(req, res);

    expect(res._body.publishableKey).toBe("pk_test_abc");
    delete process.env.STRIPE_PUBLISHABLE_KEY;
  });

  it("returns undefined publishableKey when env var not set", () => {
    delete process.env.STRIPE_PUBLISHABLE_KEY;
    const req = mockReq();
    const res = mockRes();

    getStripeConfigControl(req, res);

    expect(res._body).toHaveProperty("publishableKey");
  });
});

// ---------------------------------------------------------------------------
// createPaymentIntentControl
// ---------------------------------------------------------------------------

describe("createPaymentIntentControl", () => {
  it("returns 500 when req.session is missing", async () => {
    const req = { body: {} }; // no session
    const res = mockRes();

    await createPaymentIntentControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("No session");
  });

  it("returns 400 when cart total is 0", async () => {
    getCartStats.mockResolvedValue({ success: true, total: 0, itemCount: 0 });
    const req = mockReq();
    const res = mockRes();

    await createPaymentIntentControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/cart/i);
  });

  it("returns 400 when getCartStats fails", async () => {
    getCartStats.mockResolvedValue({ success: false });
    const req = mockReq();
    const res = mockRes();

    await createPaymentIntentControl(req, res);

    expect(res._status).toBe(400);
  });

  it("returns 500 when createPaymentIntent returns { success: false }", async () => {
    getCartStats.mockResolvedValue({ success: true, total: 50, itemCount: 1 });
    createPaymentIntent.mockResolvedValue({ success: false, message: "Stripe error" });
    const req = mockReq();
    const res = mockRes();

    await createPaymentIntentControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("Stripe error");
  });

  it("returns clientSecret and stores pendingPaymentIntentId in session on success", async () => {
    getCartStats.mockResolvedValue({ success: true, total: 50, itemCount: 1 });
    createPaymentIntent.mockResolvedValue({ success: true, clientSecret: "pi_secret_xyz", paymentIntentId: "pi_abc" });
    const req = mockReq();
    const res = mockRes();

    await createPaymentIntentControl(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({ clientSecret: "pi_secret_xyz" });
    expect(req.session.pendingPaymentIntentId).toBe("pi_abc");
  });

  it("calls createPaymentIntent with totalInCents derived from cart total", async () => {
    getCartStats.mockResolvedValue({ success: true, total: 49.99, itemCount: 1 });
    createPaymentIntent.mockResolvedValue({ success: true, clientSecret: "s", paymentIntentId: "pi_x" });
    const req = mockReq();
    const res = mockRes();

    await createPaymentIntentControl(req, res);

    expect(createPaymentIntent).toHaveBeenCalledWith(4999);
  });
});
