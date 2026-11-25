import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/cart.js", () => ({
  buildCart: vi.fn(),
  getCartStats: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  updateCartSpins: vi.fn(),
}));
vi.mock("../../src/sanitize.js", () => ({
  validatePositiveInt: vi.fn(),
  sanitizeMongoValue: vi.fn(),
  validateEmail: vi.fn(),
  validateZip: vi.fn(),
  validateString: vi.fn(),
}));
vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));
vi.mock("../../src/orders.js", () => ({
  placeNewOrder: vi.fn(),
  storePendingOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
}));
vi.mock("../../src/payments.js", () => ({ createPaymentIntent: vi.fn(), refundPayment: vi.fn() }));
vi.mock("../../src/products.js", () => ({ updateProduct: vi.fn() }));
vi.mock("../../src/contact.js", () => ({ submitContact: vi.fn() }));
vi.mock("../../src/shipping.js", () => ({
  getShippingFromSession: vi.fn(),
  fetchShippingRates: vi.fn(),
  updateSelectedRate: vi.fn(),
  clearShippingFromSession: vi.fn(),
  getSelectedShippingCost: vi.fn(),
}));

import { createPaymentIntentControl } from "../../controllers/data-controller.js";
import { getCartStats } from "../../src/cart.js";
import { createPaymentIntent } from "../../src/payments.js";
import { storePendingOrder } from "../../src/orders.js";
import { getSelectedShippingCost } from "../../src/shipping.js";

const mockRes = () => {
  const res = { _status: 200, _body: null };
  res.status = (code) => {
    res._status = code;
    return res;
  };
  res.json = (body) => {
    res._body = body;
    return res;
  };
  return res;
};

const mockReq = (bodyZip, pricedZip) => ({
  body: { zip: bodyZip },
  session: { cart: [{ id: "1" }], shipping: pricedZip === undefined ? null : { zip: pricedZip } },
});

describe("delivery ZIP must match priced ZIP before payment intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCartStats.mockResolvedValue({ success: true, total: 50 });
    getSelectedShippingCost.mockReturnValue(5);
    createPaymentIntent.mockResolvedValue({ success: true, paymentIntentId: "pi_1", clientSecret: "sec_1" });
    storePendingOrder.mockResolvedValue({ ok: true });
  });

  it("rejects a different ZIP and creates no payment intent", async () => {
    const req = mockReq("90210", "10001");
    const res = mockRes();
    await createPaymentIntentControl(req, res);
    expect(res._body.success).toBe(false);
    expect(res._body.message).toMatch(/different ZIP code/);
    expect(createPaymentIntent).not.toHaveBeenCalled();
    expect(req.session.pendingPaymentIntentId).toBeUndefined();
  });

  it("rejects when the delivery ZIP is missing", async () => {
    const res = mockRes();
    await createPaymentIntentControl(mockReq(undefined, "10001"), res);
    expect(res._body.success).toBe(false);
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it("rejects when the priced ZIP is missing from the session", async () => {
    const res = mockRes();
    await createPaymentIntentControl(mockReq("10001", undefined), res);
    expect(res._body.success).toBe(false);
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it("accepts an identical ZIP", async () => {
    const res = mockRes();
    await createPaymentIntentControl(mockReq("10001", "10001"), res);
    expect(res._body.clientSecret).toBe("sec_1");
  });

  it("compares only the first 5 digits (ZIP+4 on either side)", async () => {
    const res = mockRes();
    await createPaymentIntentControl(mockReq("10001-1234", "10001"), res);
    expect(res._body.clientSecret).toBe("sec_1");
    const res2 = mockRes();
    await createPaymentIntentControl(mockReq("10001", "10001-9999"), res2);
    expect(res2._body.clientSecret).toBe("sec_1");
  });

  it("rejects a malformed delivery ZIP", async () => {
    const res = mockRes();
    await createPaymentIntentControl(mockReq("1000", "10001"), res);
    expect(res._body.success).toBe(false);
  });
});
