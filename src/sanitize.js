// Prevent NoSQL operator injection — if value is an object with $-prefixed keys, convert to string
export const sanitizeMongoValue = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val === "object" && !Array.isArray(val)) {
    const keys = Object.keys(val);
    for (const key of keys) {
      if (key.startsWith("$")) return String(val);
    }
  }
  return val;
};

// Validate and return a positive integer, or null if invalid
export const validatePositiveInt = (val) => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
};

// Return new object with only allowed keys (prevents mass assignment)
export const whitelistFields = (obj, allowedFields) => {
  if (!obj || typeof obj !== "object") return {};
  const result = {};
  for (const field of allowedFields) {
    if (obj.hasOwnProperty(field)) {
      result[field] = obj[field];
    }
  }
  return result;
};

// Strip path separators and traversal sequences, return basename only
export const sanitizeFilename = (filename) => {
  if (typeof filename !== "string") return "";
  // Remove any path traversal sequences
  let clean = filename.replace(/\.\./g, "");
  // Extract basename (remove directory components)
  clean = clean.replace(/^.*[\\\/]/, "");
  // Remove any remaining null bytes
  clean = clean.replace(/\0/g, "");
  return clean;
};

export const validateEmail = (val) => {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return null;
  return trimmed;
};

export const validateZip = (val) => {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(trimmed)) return null;
  return trimmed;
};

export const validateString = (val, maxLength = 500) => {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength) return null;
  return trimmed;
};

export const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

// Strip newlines, carriage returns, and tabs from strings used in email headers (prevents header injection)
export const sanitizeEmailHeader = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/[\r\n\t]/g, "");
};
