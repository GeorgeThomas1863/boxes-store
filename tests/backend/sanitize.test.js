import { describe, it, expect } from "vitest";
import { sanitizeFilename, sanitizeEmailHeader, whitelistFields, validateEmail, validateZip, validateString, escapeHtml } from "../../src/sanitize.js";

describe("sanitizeFilename", () => {
  it("returns a normal filename unchanged", () => {
    expect(sanitizeFilename("photo.jpg")).toBe("photo.jpg");
  });

  it("strips unix-style path traversal sequences (../)", () => {
    // `..` sequences removed → `//etc/passwd`, then basename extracted → `passwd`
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
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

describe("sanitizeEmailHeader", () => {
  it("strips newline characters", () => {
    expect(sanitizeEmailHeader("John\nDoe")).toBe("JohnDoe");
  });

  it("strips carriage returns", () => {
    expect(sanitizeEmailHeader("John\rDoe")).toBe("JohnDoe");
  });

  it("strips tabs", () => {
    expect(sanitizeEmailHeader("John\tDoe")).toBe("JohnDoe");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeEmailHeader(null)).toBe("");
    expect(sanitizeEmailHeader(undefined)).toBe("");
    expect(sanitizeEmailHeader(42)).toBe("");
  });

  it("returns a clean string unchanged", () => {
    expect(sanitizeEmailHeader("John Doe")).toBe("John Doe");
  });
});

describe("whitelistFields", () => {
  it("returns only allowed keys from an object", () => {
    const result = whitelistFields({ name: "Alice", age: 30, secret: "x" }, ["name", "age"]);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("omits keys not in allowedFields", () => {
    const result = whitelistFields({ a: 1, b: 2, c: 3 }, ["a"]);
    expect(result).toEqual({ a: 1 });
    expect(result.b).toBeUndefined();
  });

  it("returns empty object when no keys match", () => {
    expect(whitelistFields({ x: 1 }, ["a", "b"])).toEqual({});
  });

  it("returns empty object for null input", () => {
    expect(whitelistFields(null, ["name"])).toEqual({});
  });

  it("returns empty object for non-object input (string)", () => {
    expect(whitelistFields("string", ["name"])).toEqual({});
  });

  it("does not include keys absent from the object even if allowed", () => {
    const result = whitelistFields({ name: "Bob" }, ["name", "email"]);
    expect(result).toEqual({ name: "Bob" });
    expect(Object.prototype.hasOwnProperty.call(result, "email")).toBe(false);
  });
});

describe("validateEmail", () => {
  it("returns trimmed email for a valid address", () => {
    expect(validateEmail("user@example.com")).toBe("user@example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(validateEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("returns null for an address with no @", () => {
    expect(validateEmail("notanemail")).toBeNull();
  });

  it("returns null for missing domain part", () => {
    expect(validateEmail("user@")).toBeNull();
  });

  it("returns null for non-string input (number)", () => {
    expect(validateEmail(42)).toBeNull();
  });

  it("returns null for null input", () => {
    expect(validateEmail(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(validateEmail("")).toBeNull();
  });
});

describe("validateZip", () => {
  it("accepts a 5-digit ZIP code", () => {
    expect(validateZip("12345")).toBe("12345");
  });

  it("accepts a ZIP+4 code", () => {
    expect(validateZip("12345-6789")).toBe("12345-6789");
  });

  it("returns null for a 4-digit code", () => {
    expect(validateZip("1234")).toBeNull();
  });

  it("returns null for a 6-digit code", () => {
    expect(validateZip("123456")).toBeNull();
  });

  it("returns null for a ZIP with letters", () => {
    expect(validateZip("1234A")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(validateZip(null)).toBeNull();
  });

  it("returns null for non-string input (number)", () => {
    expect(validateZip(12345)).toBeNull();
  });

  it("trims and validates", () => {
    expect(validateZip("  90210  ")).toBe("90210");
  });
});

describe("validateString", () => {
  it("returns trimmed string for valid input", () => {
    expect(validateString("  hello  ")).toBe("hello");
  });

  it("returns null for empty string", () => {
    expect(validateString("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(validateString("   ")).toBeNull();
  });

  it("returns null when string exceeds maxLength", () => {
    expect(validateString("abc", 2)).toBeNull();
  });

  it("returns string when length equals maxLength", () => {
    expect(validateString("ab", 2)).toBe("ab");
  });

  it("uses default maxLength of 500", () => {
    const long = "a".repeat(500);
    expect(validateString(long)).toBe(long);
  });

  it("returns null for a 501-char string with default maxLength", () => {
    expect(validateString("a".repeat(501))).toBeNull();
  });

  it("returns null for non-string input (number)", () => {
    expect(validateString(42)).toBeNull();
  });

  it("returns null for null input", () => {
    expect(validateString(null)).toBeNull();
  });
});

describe("escapeHtml", () => {
  it("escapes & to &amp;", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes < and > to &lt; and &gt;", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes \" to &quot;", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes ' to &#x27;", () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it("returns empty string for non-string input (null)", () => {
    expect(escapeHtml(null)).toBe("");
  });

  it("returns empty string for non-string input (number)", () => {
    expect(escapeHtml(42)).toBe("");
  });

  it("returns clean string unchanged", () => {
    expect(escapeHtml("Hello world")).toBe("Hello world");
  });

  it("escapes all special chars in a complex string", () => {
    expect(escapeHtml('<a href="url">Tom & Jerry\'s</a>')).toBe(
      "&lt;a href=&quot;url&quot;&gt;Tom &amp; Jerry&#x27;s&lt;/a&gt;"
    );
  });
});
