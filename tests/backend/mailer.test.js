import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMail } from "../../src/mailer.js";

describe("sendMail", () => {
  beforeEach(() => {
    process.env.MAILGUN_DOMAIN = "test.mailgun.org";
    process.env.MAILGUN_API_KEY = "test-api-key";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "<test-message-id@mailgun.org>" }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
  });

  it("calls the correct Mailgun endpoint with hardcoded host", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.mailgun.net/v3/test.mailgun.org/messages");
  });

  it("sends a POST with Basic auth header", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const options = global.fetch.mock.calls[0][1];
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe(
      "Basic " + Buffer.from("api:test-api-key").toString("base64")
    );
  });

  it("includes from, to, subject, and html in the request body", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Order Confirmation", html: "<p>Thanks!</p>" });

    const body = global.fetch.mock.calls[0][1].body;
    expect(body.get("from")).toBe("store@example.com");
    expect(body.get("to")).toBe("buyer@example.com");
    expect(body.get("subject")).toBe("Order Confirmation");
    expect(body.get("html")).toBe("<p>Thanks!</p>");
  });

  it("appends each bcc address as a separate entry", async () => {
    await sendMail({
      from: "store@example.com",
      to: "buyer@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      bcc: ["admin1@example.com", "admin2@example.com"],
    });

    const body = global.fetch.mock.calls[0][1].body;
    expect(body.getAll("bcc")).toEqual(["admin1@example.com", "admin2@example.com"]);
  });

  it("returns messageId from Mailgun response", async () => {
    const result = await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });
    expect(result.messageId).toBe("<test-message-id@mailgun.org>");
  });

  it("throws when Mailgun returns a non-2xx status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(
      sendMail({ from: "a@b.com", to: "c@d.com", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow("Mailgun error 401");
  });

  it("throws when both 'to' and 'bcc' are absent", async () => {
    await expect(
      sendMail({ from: "store@example.com", subject: "Test", html: "<p>Hi</p>" })
    ).rejects.toThrow("sendMail: at least one of 'to' or 'bcc' is required");
  });
});
