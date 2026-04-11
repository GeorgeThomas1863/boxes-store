import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fs before importing the module that calls fs.mkdirSync at load time
vi.mock("fs", () => ({
  default: {
    mkdirSync: vi.fn(),
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

// Mock dotenv so it doesn't try to read a real .env
vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

// Mock multer to avoid storage setup errors in the test environment
vi.mock("multer", () => {
  const multer = vi.fn(() => ({
    single: vi.fn(),
  }));
  multer.diskStorage = vi.fn(() => ({}));
  return { default: multer };
});

import fs from "fs";
import { deletePic } from "../../src/upload-back.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deletePic", () => {
  it("happy path: valid filename + products entityType + file exists → success", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockReturnValue(undefined);

    const result = await deletePic("photo.jpg", "products");

    expect(result.success).toBe(true);
    expect(fs.unlinkSync).toHaveBeenCalledOnce();
  });

  it("returns { success: false } for invalid entityType 'users'", async () => {
    const result = await deletePic("photo.jpg", "users");
    expect(result.success).toBe(false);
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it("returns { success: false } for null entityType", async () => {
    const result = await deletePic("photo.jpg", null);
    expect(result.success).toBe(false);
  });

  it("returns { success: false } for undefined entityType", async () => {
    const result = await deletePic("photo.jpg", undefined);
    expect(result.success).toBe(false);
  });

  it("returns 'Invalid filename' when sanitizeFilename yields empty string (null bytes only)", async () => {
    // A filename composed purely of null bytes becomes empty after sanitize
    const result = await deletePic("\0\0\0", "products");
    expect(result.success).toBe(false);
    expect(result.message).toBe("Invalid filename");
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it("returns 'Invalid filename' for empty string filename", async () => {
    const result = await deletePic("", "products");
    expect(result.success).toBe(false);
    expect(result.message).toBe("Invalid filename");
  });

  it("returns 'Invalid filename' for null filename", async () => {
    const result = await deletePic(null, "products");
    expect(result.success).toBe(false);
    expect(result.message).toBe("Invalid filename");
  });

  it("returns 'File not found' when file does not exist on disk", async () => {
    fs.existsSync.mockReturnValue(false);

    const result = await deletePic("photo.jpg", "products");
    expect(result.success).toBe(false);
    expect(result.message).toBe("File not found");
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it("returns success: true and calls unlinkSync with correct path for products", async () => {
    fs.existsSync.mockReturnValue(true);

    const result = await deletePic("1234-photo.jpg", "products");

    expect(result.success).toBe(true);
    const unlinkArg = fs.unlinkSync.mock.calls[0][0];
    expect(unlinkArg).toContain("products");
    expect(unlinkArg).toContain("1234-photo.jpg");
  });

  it("path traversal: filename with subdir component sanitizes to basename and resolves inside allowed base", async () => {
    // "subdir/file.jpg" → sanitizeFilename → "file.jpg" → resolves inside products dir
    fs.existsSync.mockReturnValue(true);

    const result = await deletePic("subdir/file.jpg", "products");
    // sanitize strips the subdir, "file.jpg" is valid and resolves inside the allowed base
    expect(result.success).toBe(true);
    expect(fs.unlinkSync).toHaveBeenCalledOnce();
  });

  it("path traversal: pure traversal sequence sanitizes to empty → Invalid filename", async () => {
    // "../" → strip ".." → "/" → basename → "" → caught as empty
    const result = await deletePic("../", "products");
    expect(result.success).toBe(false);
    expect(result.message).toBe("Invalid filename");
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});
