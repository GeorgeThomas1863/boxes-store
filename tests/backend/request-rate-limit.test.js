import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createRequestRateLimit, contactRateLimit, shippingRateLimit, paymentIntentRateLimit } from "../../middleware/request-rate-limit.js";

function mockRes() {
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
}

function hit(limiter, ip) {
  const res = mockRes();
  const next = vi.fn();
  limiter({ ip }, res, next);
  return { res, next };
}

describe("createRequestRateLimit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to max requests then returns 429", () => {
    const limiter = createRequestRateLimit({ max: 3, windowMs: 1000 });
    for (let i = 0; i < 3; i++) {
      expect(hit(limiter, "1.1.1.1").next).toHaveBeenCalled();
    }
    const blocked = hit(limiter, "1.1.1.1");
    expect(blocked.next).not.toHaveBeenCalled();
    expect(blocked.res._status).toBe(429);
    expect(blocked.res._body).toEqual({ success: false, message: "Too many requests. Please try again later." });
  });

  it("counts each IP separately", () => {
    const limiter = createRequestRateLimit({ max: 1, windowMs: 1000 });
    hit(limiter, "1.1.1.1");
    expect(hit(limiter, "1.1.1.1").res._status).toBe(429);
    expect(hit(limiter, "2.2.2.2").next).toHaveBeenCalled();
  });

  it("allows requests again after the window expires", () => {
    const limiter = createRequestRateLimit({ max: 1, windowMs: 1000 });
    hit(limiter, "1.1.1.1");
    expect(hit(limiter, "1.1.1.1").res._status).toBe(429);
    vi.advanceTimersByTime(1001);
    expect(hit(limiter, "1.1.1.1").next).toHaveBeenCalled();
  });

  it("evicts the oldest IP once 10,000 IPs are tracked", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const limiter = createRequestRateLimit({ max: 1, windowMs: 60000 });
    hit(limiter, "first");
    expect(hit(limiter, "first").res._status).toBe(429);
    for (let i = 1; i < 10000; i++) hit(limiter, `ip-${i}`);
    hit(limiter, "one-too-many");
    expect(hit(limiter, "first").next).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("still blocks an IP inside its window after older IPs expire", () => {
    const limiter = createRequestRateLimit({ max: 1, windowMs: 1000 });
    hit(limiter, "old");
    vi.advanceTimersByTime(600);
    hit(limiter, "new");
    vi.advanceTimersByTime(600);
    expect(hit(limiter, "old").next).toHaveBeenCalled();
    expect(hit(limiter, "new").res._status).toBe(429);
  });

  it("keeps separate limiters independent", () => {
    const a = createRequestRateLimit({ max: 1, windowMs: 1000 });
    const b = createRequestRateLimit({ max: 1, windowMs: 1000 });
    hit(a, "1.1.1.1");
    expect(hit(a, "1.1.1.1").res._status).toBe(429);
    expect(hit(b, "1.1.1.1").next).toHaveBeenCalled();
  });
});

describe("route limiters", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const cases = [
    ["contact", contactRateLimit, 5, 60 * 60 * 1000],
    ["shipping", shippingRateLimit, 30, 15 * 60 * 1000],
    ["payment intent", paymentIntentRateLimit, 20, 15 * 60 * 1000],
  ];

  for (const [name, limiter, max, windowMs] of cases) {
    it(`${name} allows ${max} then blocks, and resets after the window`, () => {
      const ip = `ip-${name}`;
      for (let i = 0; i < max; i++) {
        expect(hit(limiter, ip).next).toHaveBeenCalled();
      }
      expect(hit(limiter, ip).res._status).toBe(429);
      vi.advanceTimersByTime(windowMs + 1);
      expect(hit(limiter, ip).next).toHaveBeenCalled();
    });
  }

  it("exhausting one route does not affect another", () => {
    const ip = "shared-ip";
    for (let i = 0; i < 6; i++) hit(contactRateLimit, ip);
    expect(hit(contactRateLimit, ip).res._status).toBe(429);
    expect(hit(shippingRateLimit, ip).next).toHaveBeenCalled();
    expect(hit(paymentIntentRateLimit, ip).next).toHaveBeenCalled();
  });
});
