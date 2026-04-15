import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../middleware/stripe-config.js", () => ({
  default: {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
}));

import stripe from "../../middleware/stripe-config.js";
import { createPaymentIntent, verifyPaymentIntent } from "../../src/payments.js";

beforeEach(() => vi.clearAllMocks());

describe("createPaymentIntent", () => {
  it("returns success false when totalInCents is 0", async () => {
    const result = await createPaymentIntent(0);
    expect(result.success).toBe(false);
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("returns success false when totalInCents is negative", async () => {
    const result = await createPaymentIntent(-500);
    expect(result.success).toBe(false);
  });

  it("returns success false when totalInCents is not a number", async () => {
    const result = await createPaymentIntent("not-a-number");
    expect(result.success).toBe(false);
  });

  it("returns success false when Stripe returns no client_secret", async () => {
    stripe.paymentIntents.create.mockResolvedValue({ id: "pi_123" });
    const result = await createPaymentIntent(1000);
    expect(result.success).toBe(false);
  });

  it("returns success true with clientSecret on valid call", async () => {
    stripe.paymentIntents.create.mockResolvedValue({
      id: "pi_abc123",
      client_secret: "pi_abc123_secret_xyz",
    });
    const result = await createPaymentIntent(4999);
    expect(result.success).toBe(true);
    expect(result.clientSecret).toBe("pi_abc123_secret_xyz");
    expect(result.paymentIntentId).toBe("pi_abc123");
  });

  it("calls stripe.paymentIntents.create with correct amount and currency", async () => {
    stripe.paymentIntents.create.mockResolvedValue({ id: "pi_t", client_secret: "s_t" });
    await createPaymentIntent(2500);
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 2500, currency: "usd" })
    );
  });
});

describe("verifyPaymentIntent", () => {
  it("returns success false when paymentIntentId is null", async () => {
    const result = await verifyPaymentIntent(null, 1000);
    expect(result.success).toBe(false);
    expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled();
  });

  it("returns success false when Stripe returns null", async () => {
    stripe.paymentIntents.retrieve.mockResolvedValue(null);
    const result = await verifyPaymentIntent("pi_abc123", 1000);
    expect(result.success).toBe(false);
  });

  it("returns success false when status is not succeeded", async () => {
    stripe.paymentIntents.retrieve.mockResolvedValue({ id: "pi_abc123", status: "processing", amount: 1000 });
    const result = await verifyPaymentIntent("pi_abc123", 1000);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/processing/);
  });

  it("returns success false when amount does not match", async () => {
    stripe.paymentIntents.retrieve.mockResolvedValue({ id: "pi_abc123", status: "succeeded", amount: 1000 });
    const result = await verifyPaymentIntent("pi_abc123", 999);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/mismatch/i);
  });

  it("returns success true with intent when all checks pass", async () => {
    const mockIntent = { id: "pi_abc123", status: "succeeded", amount: 4999 };
    stripe.paymentIntents.retrieve.mockResolvedValue(mockIntent);
    const result = await verifyPaymentIntent("pi_abc123", 4999);
    expect(result.success).toBe(true);
    expect(result.intent).toBe(mockIntent);
  });
});
