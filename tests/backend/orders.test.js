import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/db-model.js", () => {
  const MockDbModel = vi.fn();
  return { default: MockDbModel };
});

vi.mock("../../src/cart.js", () => ({
  getCartStats: vi.fn(),
  buildCart: vi.fn(),
}));

vi.mock("../../src/payments.js", () => ({
  verifyPaymentIntent: vi.fn(),
}));

vi.mock("../../src/customer.js", () => ({
  storeCustomerData: vi.fn(),
}));

vi.mock("../../src/mailer.js", () => ({
  sendMail: vi.fn().mockResolvedValue({ messageId: "mock-id" }),
}));

import dbModel from "../../models/db-model.js";
import { getCartStats } from "../../src/cart.js";
import { verifyPaymentIntent } from "../../src/payments.js";
import { storeCustomerData } from "../../src/customer.js";
import { placeNewOrder, storeOrderData, getOrderNumber } from "../../src/orders.js";

process.env.ORDERS_COLLECTION = "orders";
process.env.TAX_RATE = "0.08";

const makeReq = (cartItems = [], bodyOverride = {}) => ({
  session: { cart: cartItems },
  body: {
    paymentIntentId: "pi_test123",
    firstName: "John", lastName: "Doe",
    email: "john@example.com", phone: "5551234567",
    address: "123 Main St", city: "Anytown",
    state: "CA", zip: "90210",
    ...bodyOverride,
  },
});

const makeCartItem = (productId, price, quantity) => ({
  productId, price, quantity, name: `Product ${productId}`,
});

beforeEach(() => vi.clearAllMocks());

describe("placeNewOrder — validation", () => {
  it("returns success false when req is null", async () => {
    expect((await placeNewOrder(null)).success).toBe(false);
  });

  it("returns success false when cart is empty", async () => {
    const result = await placeNewOrder(makeReq([]));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/cart/i);
  });

  it("returns success false when getCartStats fails", async () => {
    getCartStats.mockResolvedValue(null);
    expect((await placeNewOrder(makeReq([makeCartItem("p1", 10, 1)]))).success).toBe(false);
  });

  it("returns success false when verifyPaymentIntent fails", async () => {
    getCartStats.mockResolvedValue({ success: true, total: 10, itemCount: 1 });
    verifyPaymentIntent.mockResolvedValue({ success: false, message: "Payment not completed" });
    expect((await placeNewOrder(makeReq([makeCartItem("p1", 10, 1)]))).success).toBe(false);
  });
});

describe("placeNewOrder — success", () => {
  beforeEach(() => {
    getCartStats.mockResolvedValue({ success: true, total: 100, itemCount: 2 });
    verifyPaymentIntent.mockResolvedValue({
      success: true,
      intent: { id: "pi_test123", status: "succeeded", amount: 10800 },
    });
    storeCustomerData.mockResolvedValue({ email: "john@example.com" });
    dbModel.mockImplementation(function () {
      this.storeAny = vi.fn().mockResolvedValue({ insertedId: "mock_id" });
      this.getMaxId = vi.fn().mockResolvedValue(1000);
    });
  });

  it("returns success true on valid payment and cart", async () => {
    const result = await placeNewOrder(makeReq([makeCartItem("p1", 50, 2)]));
    expect(result.success).toBe(true);
    expect(result.data.email).toBe("john@example.com");
  });

  it("clears session cart after successful order", async () => {
    const req = makeReq([makeCartItem("p1", 50, 2)]);
    await placeNewOrder(req);
    expect(req.session.cart).toEqual([]);
  });

  it("calls verifyPaymentIntent with correct amount in cents (100 subtotal * 1.08 = 10800)", async () => {
    await placeNewOrder(makeReq([makeCartItem("p1", 100, 1)]));
    expect(verifyPaymentIntent).toHaveBeenCalledWith("pi_test123", 10800);
  });

  it("returns orderNumber = getMaxId + 1", async () => {
    const result = await placeNewOrder(makeReq([makeCartItem("p1", 50, 2)]));
    expect(result.data.orderNumber).toBe(1001);
  });
});

describe("getOrderNumber", () => {
  it("returns 1001 when no orders exist", async () => {
    dbModel.mockImplementation(function () {
      this.getMaxId = vi.fn().mockResolvedValue(null);
    });
    expect(await getOrderNumber()).toBe(1001);
  });

  it("returns maxId + 1 when orders exist", async () => {
    dbModel.mockImplementation(function () {
      this.getMaxId = vi.fn().mockResolvedValue(1005);
    });
    expect(await getOrderNumber()).toBe(1006);
  });
});

describe("storeOrderData", () => {
  it("returns null when orderObj is null", async () => {
    dbModel.mockImplementation(function () {
      this.getMaxId = vi.fn().mockResolvedValue(null);
    });
    expect(await storeOrderData(null)).toBeNull();
  });

  it("returns null when storeAny has no insertedId", async () => {
    dbModel.mockImplementation(function () {
      this.getMaxId = vi.fn().mockResolvedValue(1000);
      this.storeAny = vi.fn().mockResolvedValue({});
    });
    expect(await storeOrderData({ firstName: "Test" })).toBeNull();
  });

  it("attaches orderId and orderNumber", async () => {
    dbModel.mockImplementation(function () {
      this.getMaxId = vi.fn().mockResolvedValue(1000);
      this.storeAny = vi.fn().mockResolvedValue({ insertedId: "abc123" });
    });
    const result = await storeOrderData({ items: [] });
    expect(result.orderId).toBe("abc123");
    expect(result.orderNumber).toBe(1001);
  });
});
