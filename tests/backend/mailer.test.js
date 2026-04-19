import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMail } from "../../src/mailer.js";

describe("sendMail", () => {
  beforeEach(() => {
    process.env.MAILERSEND_API_KEY = "test-api-key";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (name) => (name === "X-Message-Id" ? "<test-message-id@mailersend.com>" : null) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
    delete process.env.MAILERSEND_API_KEY;
  });

  it("calls the correct MailerSend endpoint", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.mailersend.com/v1/email");
  });

  it("sends a POST with Bearer auth header and JSON content-type", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const options = global.fetch.mock.calls[0][1];
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-api-key");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("sends from, to, subject, and html as JSON objects/arrays", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Order Confirmation", html: "<p>Thanks!</p>" });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.from).toEqual({ email: "store@example.com" });
    expect(body.to).toEqual([{ email: "buyer@example.com" }]);
    expect(body.subject).toBe("Order Confirmation");
    expect(body.html).toBe("<p>Thanks!</p>");
  });

  it("includes fromName as from.name when provided", async () => {
    await sendMail({ from: "store@example.com", fromName: "PRN & Pretty Things Co.", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.from).toEqual({ email: "store@example.com", name: "PRN & Pretty Things Co." });
  });

  it("omits from.name when fromName is not provided", async () => {
    await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.from).toEqual({ email: "store@example.com" });
  });

  it("sends bcc as an array of recipient objects", async () => {
    await sendMail({
      from: "store@example.com",
      to: "buyer@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      bcc: ["admin1@example.com", "admin2@example.com"],
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.bcc).toEqual([{ email: "admin1@example.com" }, { email: "admin2@example.com" }]);
  });

  it("splits a comma-separated 'to' string into multiple recipients", async () => {
    await sendMail({
      from: "store@example.com",
      to: "admin1@example.com, admin2@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.to).toEqual([{ email: "admin1@example.com" }, { email: "admin2@example.com" }]);
  });

  it("sets reply_to as an object when replyTo is provided", async () => {
    await sendMail({
      from: "store@example.com",
      to: "buyer@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      replyTo: "customer@example.com",
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.reply_to).toEqual({ email: "customer@example.com" });
  });

  it("returns messageId from X-Message-Id response header", async () => {
    const result = await sendMail({ from: "store@example.com", to: "buyer@example.com", subject: "Test", html: "<p>Hi</p>" });
    expect(result.messageId).toBe("<test-message-id@mailersend.com>");
  });

  it("throws when MailerSend returns a non-2xx status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(
      sendMail({ from: "a@b.com", to: "c@d.com", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow("MailerSend error 401");
  });

  it("throws when 'to' is absent", async () => {
    await expect(
      sendMail({ from: "store@example.com", subject: "Test", html: "<p>Hi</p>" })
    ).rejects.toThrow("sendMail: 'to' is required");
  });

  it("throws when MAILERSEND_API_KEY is not set", async () => {
    delete process.env.MAILERSEND_API_KEY;
    await expect(
      sendMail({ from: "a@b.com", to: "c@d.com", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow("sendMail: MAILERSEND_API_KEY must be set");
  });

  it("throws when 'from' is not provided", async () => {
    await expect(
      sendMail({ to: "c@d.com", subject: "X", html: "<p>X</p>" })
    ).rejects.toThrow("sendMail: 'from' is required");
  });
});
