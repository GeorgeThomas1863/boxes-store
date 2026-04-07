import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "../../src/sanitize.js";

describe("sanitizeFilename", () => {
  it("returns a normal filename unchanged", () => {
    expect(sanitizeFilename("photo.jpg")).toBe("photo.jpg");
  });

  it("strips unix-style path traversal sequences (../)", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("etcpasswd");
  });

  it("strips windows-style path traversal sequences (..\\)", () => {
    // sanitizeFilename strips `..` then takes basename — result depends on order
    const result = sanitizeFilename("..\\..\\windows\\system32");
    // After removing `..` → `\\\\windows\\system32`, basename extraction removes leading separators
    expect(result).toBe("system32");
  });

  it("strips directory components and returns basename only", () => {
    expect(sanitizeFilename("subdir/file.jpg")).toBe("file.jpg");
  });

  it("strips directory components from windows-style paths", () => {
    expect(sanitizeFilename("C:\\Users\\me\\image.png")).toBe("image.png");
  });

  it("removes null bytes", () => {
    expect(sanitizeFilename("file\0.jpg")).toBe("file.jpg");
  });

  it("returns empty string for non-string input (number)", () => {
    expect(sanitizeFilename(42)).toBe("");
  });

  it("returns empty string for non-string input (object)", () => {
    expect(sanitizeFilename({})).toBe("");
  });

  it("returns empty string for non-string input (null)", () => {
    expect(sanitizeFilename(null)).toBe("");
  });

  it("returns empty string for an empty string input", () => {
    expect(sanitizeFilename("")).toBe("");
  });
});
