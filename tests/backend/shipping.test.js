import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../models/db-model.js", () => {
  const MockDbModel = vi.fn();
  return { default: MockDbModel };
});

vi.mock("../../src/game-settings.js", () => ({
  getGameSettings: vi.fn().mockResolvedValue({
    spinOptions: [
      { extraSpins: 0, spinCost: 0 },
      { extraSpins: 3, spinCost: 30 },
    ],
  }),
}));

vi.mock("../../src/payments.js", () => ({
  createPaymentIntent: vi.fn(),
  verifyPaymentIntent: vi.fn(),
  refundPayment: vi.fn(),
}));

vi.mock("../../src/customer.js", () => ({ storeCustomerData: vi.fn() }));
vi.mock("../../src/mailer.js", () => ({ sendMail: vi.fn().mockResolvedValue({ messageId: "test" }) }));
vi.mock("../../src/products.js", () => ({ updateProduct: vi.fn() }));
vi.mock("../../src/contact.js", () => ({ submitContact: vi.fn() }));

import dbModel from "../../models/db-model.js";
import { createPaymentIntent, verifyPaymentIntent } from "../../src/payments.js";
import {
  fetchShippingRates,
  applyShippingAdjustments,
  updateSelectedRate,
} from "../../src/shipping.js";
import { addCartItem, updateCartItem, removeCartItem, updateCartSpins } from "../../src/cart.js";
import { placeNewOrder } from "../../src/orders.js";
import { createPaymentIntentControl } from "../../controllers/data-controller.js";

process.env.PRODUCTS_COLLECTION = "products";
process.env.ORDERS_COLLECTION = "orders";
process.env.SHIP_STATION_BASE_URL = "https://shipping.test";
process.env.SHIP_STATION_API_KEY = "key";
process.env.SHIPPING_ZIP = "10001";

const productById = {
  p1: { productId: "p1", name: "One", price: 10, weight: 2, length: 8, width: 4, height: 3 },
  p2: { productId: "p2", name: "Two", price: 20, weight: 5, length: 12, width: 2, height: 7 },
};

function installDbProducts(products = productById) {
  dbModel.mockImplementation(function (query) {
    this.getUniqueItem = vi.fn().mockResolvedValue(products[query?.itemValue] || null);
  });
}

function rate(amount, overrides = {}) {
  return {
    carrier_friendly_name: "USPS",
    service_type: "Ground Advantage",
    package_type: "package",
    shipping_amount: { amount },
    delivery_days: 3,
    estimated_delivery_date: "2026-01-30",
    ...overrides,
  };
}

function okJson(value) {
  return { ok: true, json: vi.fn().mockResolvedValue(value) };
}

function mockShippingFetch(rates = [rate(8)]) {
  fetch
    .mockResolvedValueOnce(okJson({ carriers: [{ friendly_name: "USPS", carrier_id: "usps-1" }] }))
    .mockResolvedValueOnce(okJson(rates));
}

function shippingReq(productArray = [{ productId: "p1", quantity: 1 }], zip = "12345") {
  return { body: { zip, productArray }, session: {} };
}

function estimateBody() {
  return JSON.parse(fetch.mock.calls[1][1].body);
}

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  installDbProducts();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shipping package calculation", () => {
  it("sums weight by quantity while taking the maximum dimensions across products", async () => {
    mockShippingFetch();
    await fetchShippingRates(shippingReq([
      { productId: "p1", quantity: 3 },
      { productId: "p2", quantity: 2 },
    ]));

    expect(estimateBody()).toMatchObject({
      weight: { value: 16, unit: "pound" },
      dimensions: { length: 12, width: 4, height: 7, unit: "inch" },
    });
  });

  it("uses database dimensions instead of client-supplied dimensions", async () => {
    mockShippingFetch();
    await fetchShippingRates(shippingReq([
      { productId: "p1", quantity: 2, weight: 9999, length: 9999, width: 9999, height: 9999 },
    ]));

    expect(estimateBody()).toMatchObject({
      weight: { value: 4 },
      dimensions: { length: 8, width: 4, height: 3 },
    });
  });

  it("caps girth at exactly 100 without changing length", async () => {
    installDbProducts({
      p1: { productId: "p1", weight: 1, length: 80, width: 40, height: 20 },
    });
    mockShippingFetch();
    await fetchShippingRates(shippingReq());

    const dimensions = estimateBody().dimensions;
    expect(2 * (dimensions.width + dimensions.height)).toBe(100);
    expect(dimensions.length).toBe(80);
  });

  it("rejects an empty or unshippable cart without calling either endpoint", async () => {
    installDbProducts({});
    const result = await fetchShippingRates(shippingReq([{ productId: "missing", quantity: 1 }]));

    expect(result.success).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to the default package size for a product with no shipping fields", async () => {
    installDbProducts({
      p1: { productId: "p1", name: "No dims", price: 10 },
    });
    mockShippingFetch();
    const result = await fetchShippingRates(shippingReq([{ productId: "p1", quantity: 2 }]));

    expect(result.success).toBe(true);
    expect(estimateBody()).toMatchObject({
      weight: { value: 2, unit: "pound" },
      dimensions: { length: 8, width: 6, height: 4, unit: "inch" },
    });
  });

  it("fills only the missing fields with defaults when a product has partial shipping data", async () => {
    installDbProducts({
      p1: { productId: "p1", name: "Partial", price: 10, weight: 3, length: 20 },
    });
    mockShippingFetch();
    const result = await fetchShippingRates(shippingReq([{ productId: "p1", quantity: 1 }]));

    expect(result.success).toBe(true);
    expect(estimateBody()).toMatchObject({
      weight: { value: 3 },
      dimensions: { length: 20, width: 6, height: 4 },
    });
  });

  it("rejects a malformed ZIP before any network call", async () => {
    const result = await fetchShippingRates(shippingReq(undefined, "12-345"));

    expect(result.success).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("shipping rates", () => {
  it("drops envelope and media rates and renumbers every surviving rate", async () => {
    mockShippingFetch([
      rate(4, { package_type: "flat_rate_envelope" }),
      rate(5, { service_type: "Priority Envelope" }),
      rate(6, { service_type: "USPS Media Mail" }),
      rate(9, { service_type: "Ground" }),
      rate(11, { service_type: "Priority" }),
    ]);
    const result = await fetchShippingRates(shippingReq());

    expect(result.rateData).toHaveLength(2);
    expect(result.rateData[0]).toMatchObject({ service_type: "Ground", rateId: 0 });
    expect(result.rateData[1]).toMatchObject({ service_type: "Priority", rateId: 1 });
  });

  it("adds two dollars, two delivery days, and two calendar days across a month boundary", () => {
    const rates = [rate(7.25)];
    applyShippingAdjustments(rates);

    expect(rates[0]).toMatchObject({
      shipping_amount: { amount: 9.25 },
      delivery_days: 5,
      estimated_delivery_date: "2026-02-01",
    });
  });

  it("leaves missing delivery days and estimated dates absent while still applying markup", () => {
    const rates = [{ shipping_amount: { amount: "3.50" } }];
    expect(() => applyShippingAdjustments(rates)).not.toThrow();
    expect(rates[0]).toEqual({ shipping_amount: { amount: 5.5 } });
  });

  it("selects the cheapest adjusted rate and stores the complete calculation in the session", async () => {
    const req = shippingReq();
    mockShippingFetch([rate(12), rate(5), rate(8)]);
    await fetchShippingRates(req);

    expect(req.session.shipping).toMatchObject({
      zip: "12345",
      rateData: [{ rateId: 0 }, { rateId: 1 }, { rateId: 2 }],
      selectedRate: { rateId: 1, shipping_amount: { amount: 7 } },
    });
    expect(new Date(req.session.shipping.calculatedAt).toISOString()).toBe(req.session.shipping.calculatedAt);
  });

  it("selects the trusted session rate instead of client-supplied rate fields", () => {
    const trusted = [rate(9, { rateId: 0 }), rate(14, { rateId: 1 })];
    const req = {
      session: { shipping: { rateData: trusted, selectedRate: trusted[0] } },
      body: { selectedRate: { rateId: 1, shipping_amount: { amount: 0 } } },
    };
    updateSelectedRate(req);

    expect(req.session.shipping.selectedRate).toBe(trusted[1]);
    expect(req.session.shipping.selectedRate.shipping_amount.amount).toBe(14);
  });

  it.each([
    ["a missing rateId", {}],
    ["an out-of-range rateId", { rateId: 2 }],
  ])("rejects %s", (_label, selectedRate) => {
    const req = { session: { shipping: { rateData: [rate(5)] } }, body: { selectedRate } };
    expect(updateSelectedRate(req).success).toBe(false);
  });

  it("rejects rate selection when the session has no calculated rates", () => {
    const req = { session: {}, body: { selectedRate: { rateId: 0 } } };
    expect(updateSelectedRate(req).success).toBe(false);
  });
});

describe("shipping network failures", () => {
  it("returns failure and leaves the session empty when the carriers endpoint is non-2xx", async () => {
    fetch.mockResolvedValue({ ok: false });
    const req = shippingReq();
    expect((await fetchShippingRates(req)).success).toBe(false);
    expect(req.session.shipping).toBeUndefined();
  });

  it("returns failure and leaves the session empty when the estimate endpoint is non-2xx", async () => {
    fetch.mockResolvedValueOnce(okJson({ carriers: [{ friendly_name: "USPS", carrier_id: "id" }] }))
      .mockResolvedValueOnce({ ok: false });
    const req = shippingReq();
    expect((await fetchShippingRates(req)).success).toBe(false);
    expect(req.session.shipping).toBeUndefined();
  });

  it("returns failure rather than throwing when fetch rejects", async () => {
    fetch.mockRejectedValue(new Error("offline"));
    const req = shippingReq();
    await expect(fetchShippingRates(req)).resolves.toMatchObject({ success: false });
    expect(req.session.shipping).toBeUndefined();
  });

  it("leaves the session empty when the rate estimate rejects after the carrier lookup succeeds", async () => {
    fetch.mockResolvedValueOnce(okJson({ carriers: [{ friendly_name: "USPS", carrier_id: "id" }] }))
      .mockRejectedValueOnce(new Error("offline"));
    const req = shippingReq();
    expect((await fetchShippingRates(req)).success).toBe(false);
    expect(req.session.shipping).toBeUndefined();
  });
});

describe("shipping money path", () => {
  it("refuses payment intent creation with 400 when no shipping rate is selected", async () => {
    const req = { session: { cart: [{ price: 10, quantity: 1 }] } };
    const res = mockRes();
    await createPaymentIntentControl(req, res);

    expect(res.statusCode).toBe(400);
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it("creates and records a payment intent for subtotal plus shipping in cents", async () => {
    createPaymentIntent.mockResolvedValue({
      success: true,
      clientSecret: "secret",
      paymentIntentId: "pi_1",
    });
    dbModel.mockImplementation(function () {
      this.storeAny = vi.fn().mockResolvedValue({ insertedId: "pending" });
    });
    const cart = [{ productId: "p1", price: 19.99, quantity: 1 }];
    const req = {
      session: { cart, shipping: { selectedRate: { shipping_amount: { amount: 6.25 } } } },
    };
    await createPaymentIntentControl(req, mockRes());

    expect(createPaymentIntent).toHaveBeenCalledWith(2624);
  });

  it("refuses order placement when no shipping rate is selected", async () => {
    const req = { session: { cart: [{ price: 10, quantity: 1 }] }, body: { paymentIntentId: "pi_1" } };
    const result = await placeNewOrder(req);

    expect(result).toMatchObject({ success: false, message: "No shipping rate selected" });
    expect(verifyPaymentIntent).not.toHaveBeenCalled();
  });

  it("verifies the same subtotal-plus-shipping cents used to create the payment intent", async () => {
    verifyPaymentIntent.mockResolvedValue({ success: false, message: "stop after amount check" });
    const req = {
      session: {
        cart: [{ price: 19.99, quantity: 1 }],
        shipping: {
          zip: "12345",
          selectedRate: {
            shipping_amount: { amount: 6.25 },
            carrier_friendly_name: "USPS",
            service_type: "Ground",
          },
        },
      },
      body: { paymentIntentId: "pi_1" },
    };
    await placeNewOrder(req);

    expect(verifyPaymentIntent).toHaveBeenCalledWith("pi_1", 2624);
  });
});

describe("cart mutations invalidate shipping", () => {
  it("clears shipping after adding an item", async () => {
    const req = {
      session: { cart: [], shipping: { selectedRate: rate(5) } },
      body: { data: { productId: "p1", quantity: 1 } },
    };
    await addCartItem(req);
    expect(req.session.shipping).toBeNull();
  });

  it("clears shipping after changing an item quantity", async () => {
    const req = {
      session: { cart: [{ cartItemId: "p1_0", quantity: 1 }], shipping: { selectedRate: rate(5) } },
      body: { cartItemId: "p1_0", quantity: 2 },
    };
    await updateCartItem(req);
    expect(req.session.shipping).toBeNull();
  });

  it("clears shipping after removing an item", async () => {
    const req = {
      session: { cart: [{ cartItemId: "p1_0" }], shipping: { selectedRate: rate(5) } },
      body: { cartItemId: "p1_0" },
    };
    await removeCartItem(req);
    expect(req.session.shipping).toBeNull();
  });

  it("clears shipping after changing an item's spins", async () => {
    const req = {
      session: {
        cart: [{ productId: "p1", cartItemId: "p1_0", quantity: 1 }],
        shipping: { selectedRate: rate(5) },
      },
      body: { cartItemId: "p1_0", extraSpins: 3, spinCost: 30 },
    };
    await updateCartSpins(req);
    expect(req.session.shipping).toBeNull();
  });
});
