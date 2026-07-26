import { describe, it, expect, vi } from "vitest";

// Mock fs and multer so upload-back.js doesn't touch disk or set up real storage at load time
vi.mock("fs", () => ({
  default: { mkdirSync: vi.fn(), existsSync: vi.fn(), unlinkSync: vi.fn() },
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock("multer", () => {
  const multer = vi.fn(() => ({ single: vi.fn() }));
  multer.diskStorage = vi.fn(() => ({}));
  return { default: multer };
});

vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));

import { fileFilter } from "../../src/upload-back.js";

// Helper: call fileFilter and return what the callback received
function runFilter(originalname, mimetype) {
  return new Promise((resolve) => {
    fileFilter({}, { originalname, mimetype }, (err, accept) => {
      resolve({ err, accept });
    });
  });
}

describe("fileFilter", () => {
  it("accepts .jpg with image/jpeg", async () => {
    const { err, accept } = await runFilter("photo.jpg", "image/jpeg");
    expect(err).toBeNull();
    expect(accept).toBe(true);
  });

  it("accepts .jpeg with image/jpeg", async () => {
    const { err, accept } = await runFilter("photo.jpeg", "image/jpeg");
    expect(err).toBeNull();
    expect(accept).toBe(true);
  });

  it("accepts .png with image/png", async () => {
    const { err, accept } = await runFilter("photo.png", "image/png");
    expect(err).toBeNull();
    expect(accept).toBe(true);
  });

  it("accepts .gif with image/gif", async () => {
    const { err, accept } = await runFilter("anim.gif", "image/gif");
    expect(err).toBeNull();
    expect(accept).toBe(true);
  });

  it("accepts .webp with image/webp", async () => {
    const { err, accept } = await runFilter("photo.webp", "image/webp");
    expect(err).toBeNull();
    expect(accept).toBe(true);
  });

  it("rejects .pdf with application/pdf", async () => {
    const { err } = await runFilter("doc.pdf", "application/pdf");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/only image/i);
  });

  it("rejects .exe with application/octet-stream", async () => {
    const { err } = await runFilter("evil.exe", "application/octet-stream");
    expect(err).toBeInstanceOf(Error);
  });

  it("rejects MIME spoofing: .jpg extension but text/html content-type", async () => {
    const { err } = await runFilter("evil.jpg", "text/html");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/only image/i);
  });

  it("rejects MIME spoofing: .png extension but application/javascript content-type", async () => {
    const { err } = await runFilter("script.png", "application/javascript");
    expect(err).toBeInstanceOf(Error);
  });

  it("rejects valid MIME but unsupported extension (.bmp)", async () => {
    // image/bmp is a real image MIME but .bmp is not in the allowlist
    const { err } = await runFilter("photo.bmp", "image/bmp");
    expect(err).toBeInstanceOf(Error);
  });

  // Note: file size enforcement (UPLOAD_SIZE_LIMIT_MB) is handled by multer's
  // built-in limits option, not by fileFilter — no test needed here.
});
