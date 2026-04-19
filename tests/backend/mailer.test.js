import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMail } from "../../src/mailer.js";

describe("sendMail", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-api-key";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "test-message-id" }),
      text: async () => "OK",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
    delete process.env.RESEND_API_KEY;
  });

  it("calls the correct Resend endpoint", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
  });

  it("sends a POST with Bearer auth header and JSON content-type", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const options = global.fetch.mock.calls[0][1];
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-api-key");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("sends from as string, to as string array, with subject and html", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Order Confirmation", html: "<p>Thanks!</p>" });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.from).toBe("store@example.com");
    expect(body.to).toEqual(["buyer@example.com"]);
    expect(body.subject).toBe("Order Confirmation");
    expect(body.html).toBe("<p>Thanks!</p>");
  });

  it("includes fromName in from string when provided", async () => {
    await sendMail({ from: "store@example.com", fromName: "PRN & Pretty Things Co.", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.from).toBe("PRN & Pretty Things Co. <store@example.com>");
  });

  it("uses plain email string for from when fromName is not provided", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.from).toBe("store@example.com");
  });

  it("sends bcc as an array of email strings", async () => {
    await sendMail({
      from: "store@example.com",
      to: "buyer@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      bcc: ["admin1@example.com", "admin2@example.com"],
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.bcc).toEqual(["admin1@example.com", "admin2@example.com"]);
  });

  it("splits a comma-separated 'to' string into multiple recipients", async () => {
    await sendMail({
      from: "store@example.com",
      to: "admin1@example.com, admin2@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.to).toEqual(["admin1@example.com", "admin2@example.com"]);
  });

  it("sets reply_to as a plain string when replyTo is provided", async () => {
    await sendMail({
      from: "store@example.com",
      to: "buyer@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      replyTo: "customer@example.com",
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.reply_to).toBe("customer@example.com");
  });

  it("returns messageId from JSON response body", async () => {
    const result = await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });
    expect(result.messageId).toBe("test-message-id");
  });

  it("throws when Resend returns a non-2xx status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(
      sendMail({ from: "a@b.com", to: "c@d.com", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow("Resend error 401");
  });

  it("throws when 'to' is absent", async () => {
    await expect(
      sendMail({ from: "store@example.com", subject: "Test", html: "<p>Hi</p>" })
    ).rejects.toThrow("sendMail: 'to' is required");
  });

  it("throws when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(
      sendMail({ from: "a@b.com", to: "c@d.com", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow("sendMail: RESEND_API_KEY must be set");
  });

  it("throws when 'from' is not provided", async () => {
    await expect(
      sendMail({ to: "c@d.com", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow("sendMail: 'from' is required");
  });
});
