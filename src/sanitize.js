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
