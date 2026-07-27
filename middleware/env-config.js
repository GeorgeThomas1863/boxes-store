import dotenv from "dotenv";

// Loaded via bare import before any module that reads process.env.
// .env.test (if present) overrides .env — first file wins.
dotenv.config({ path: [".env.test", ".env"] });
