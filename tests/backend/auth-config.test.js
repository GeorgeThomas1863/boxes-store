import { describe, it, expect, vi, beforeEach } from "vitest";

import requireAuth from "../../middleware/auth-config.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockReq({ path = "/admin", accept = "", authenticated = false } = {}) {
  return {
    path,
    session: { authenticated },
    get: (name) => (name === "Accept" ? accept : ""),
  };
}

function mockRes() {
  const res = {
    _status: 200,
    _body: null,
    _file: null,
    _headers: {},
    setHeader(name, value) {
      this._headers[name] = value;
    },
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
    sendFile(file) {
      this._file = file;
      return this;
    },
  };
  return res;
}

let next;
beforeEach(() => {
  next = vi.fn();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("requireAuth", () => {
  it("calls next when the session is authenticated", () => {
    const res = mockRes();
    requireAuth(mockReq({ authenticated: true }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res._file).toBeNull();
  });

  it("sets Cache-Control no-store on every response", () => {
    const res = mockRes();
    requireAuth(mockReq(), res, next);
    expect(res._headers["Cache-Control"]).toBe("no-store");
  });

  it("serves the auth page with 200 for an unauthenticated page request", () => {
    const res = mockRes();
    requireAuth(mockReq({ path: "/admin" }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(200);
    expect(res._file).toMatch(/auth\.html$/);
    expect(res._body).toBeNull();
  });

  it("returns 401 JSON for an unauthenticated -route request", () => {
    const res = mockRes();
    requireAuth(mockReq({ path: "/get-order-stats-route" }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toEqual({ success: false, message: "Unauthorized", redirect: "/401" });
    expect(res._file).toBeNull();
  });

  it("returns 401 JSON when the client explicitly accepts JSON", () => {
    const res = mockRes();
    requireAuth(mockReq({ path: "/admin", accept: "application/json" }), res, next);
    expect(res._status).toBe(401);
    expect(res._body.success).toBe(false);
    expect(res._file).toBeNull();
  });
});
