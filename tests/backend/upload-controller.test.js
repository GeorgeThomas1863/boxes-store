import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules that would pull in DB connections or real filesystem operations
vi.mock("../../src/products.js", () => ({
  storeProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getProductData: vi.fn(),
}));

vi.mock("../../src/upload-back.js", () => ({
  deletePic: vi.fn(),
  uploadDir: "/fake/public/images",
  upload: { single: vi.fn() },
}));

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

import { uploadPicControl, deletePicControl } from "../../controllers/admin-controller.js";
import { deletePic } from "../../src/upload-back.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };
  return res;
}

function mockReq(overrides = {}) {
  return { body: {}, file: null, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// uploadPicControl
// ---------------------------------------------------------------------------

describe("uploadPicControl", () => {
  it("returns 400 when req.file is absent", async () => {
    const req = mockReq({ file: null });
    const res = mockRes();

    await uploadPicControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toBe("No file uploaded");
  });

  it("returns 200 with correct shape for a valid image upload", async () => {
    const req = mockReq({
      file: {
        filename: "1234-photo.jpg",
        originalname: "photo.jpg",
        mimetype: "image/jpeg",
        // path must be resolvable relative to uploadDir
        path: "/fake/public/images/products/1234-photo.jpg",
      },
    });
    const res = mockRes();

    await uploadPicControl(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toMatchObject({
      message: expect.any(String),
      filename: "1234-photo.jpg",
      originalName: "photo.jpg",
      path: expect.any(String),
      mediaType: "image",
    });
  });

  it("sets mediaType to 'video' when mimetype starts with 'video/'", async () => {
    const req = mockReq({
      file: {
        filename: "1234-clip.mp4",
        originalname: "clip.mp4",
        mimetype: "video/mp4",
        path: "/fake/public/images/products/1234-clip.mp4",
      },
    });
    const res = mockRes();

    await uploadPicControl(req, res);

    expect(res._body.mediaType).toBe("video");
  });

  it("sets mediaType to 'image' for image/* mimetypes", async () => {
    const req = mockReq({
      file: {
        filename: "1234-img.png",
        originalname: "img.png",
        mimetype: "image/png",
        path: "/fake/public/images/products/1234-img.png",
      },
    });
    const res = mockRes();

    await uploadPicControl(req, res);

    expect(res._body.mediaType).toBe("image");
  });
});

// ---------------------------------------------------------------------------
// deletePicControl
// ---------------------------------------------------------------------------

describe("deletePicControl", () => {
  it("returns 400 when filename is missing from body", async () => {
    const req = mockReq({ body: { entityType: "products" } });
    const res = mockRes();

    await deletePicControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/filename/i);
  });

  it("returns 400 when entityType is invalid", async () => {
    const req = mockReq({ body: { filename: "photo.jpg", entityType: "users" } });
    const res = mockRes();

    await deletePicControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/entity type/i);
  });

  it("returns 400 when entityType is missing", async () => {
    const req = mockReq({ body: { filename: "photo.jpg" } });
    const res = mockRes();

    await deletePicControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/entity type/i);
  });

  it("returns 400 when filename changes after sanitization (path separator present)", async () => {
    // "subdir/photo.jpg" sanitizes to "photo.jpg" — controller checks safeName !== filename
    const req = mockReq({ body: { filename: "subdir/photo.jpg", entityType: "products" } });
    const res = mockRes();

    await deletePicControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toBe("Invalid filename");
    expect(deletePic).not.toHaveBeenCalled();
  });

  it("returns 400 when filename contains backslash path separators", async () => {
    const req = mockReq({ body: { filename: "sub\\photo.jpg", entityType: "products" } });
    const res = mockRes();

    await deletePicControl(req, res);

    expect(res._status).toBe(400);
    expect(res._body.error).toBe("Invalid filename");
    expect(deletePic).not.toHaveBeenCalled();
  });

  it("delegates to deletePic and returns 200 on success", async () => {
    deletePic.mockResolvedValue({ success: true, message: "File deleted successfully" });

    const req = mockReq({ body: { filename: "photo.jpg", entityType: "products" } });
    const res = mockRes();

    await deletePicControl(req, res);

    expect(deletePic).toHaveBeenCalledWith("photo.jpg", "products");
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });

  it("returns 500 when deletePic returns { success: false }", async () => {
    deletePic.mockResolvedValue({ success: false, message: "File not found" });

    const req = mockReq({ body: { filename: "photo.jpg", entityType: "products" } });
    const res = mockRes();

    await deletePicControl(req, res);

    expect(res._status).toBe(500);
    expect(res._body.error).toBe("File not found");
  });

  it("returns 500 when deletePic returns falsy", async () => {
    deletePic.mockResolvedValue(null);

    const req = mockReq({ body: { filename: "photo.jpg", entityType: "products" } });
    const res = mockRes();

    await deletePicControl(req, res);

    expect(res._status).toBe(500);
  });
});
