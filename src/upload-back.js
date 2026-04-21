import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { sanitizeFilename } from "./sanitize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define upload directory
const uploadDir = path.join(__dirname, "../public/images");

// Ensure products directory exists
fs.mkdirSync(path.join(uploadDir, "products"), { recursive: true });

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(uploadDir, "products"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + sanitizeFilename(file.originalname));
  },
});

// File filter — images only
export const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  const validImage =
    [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext) &&
    /^image\/(jpeg|png|gif|webp)$/.test(mime);

  if (validImage) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// Configure multer
const fileSizeLimitBytes = (parseInt(process.env.UPLOAD_SIZE_LIMIT_MB, 10) || 10) * 1024 * 1024;
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: fileSizeLimitBytes },
});

export const deletePic = async (filename, entityType) => {
  const allowedTypes = ["products"];
  if (!entityType || !allowedTypes.includes(entityType)) {
    return { success: false, message: "Invalid entity type" };
  }

  const safeName = sanitizeFilename(filename);
  if (!safeName) return { success: false, message: "Invalid filename" };

  const filePath = path.join(uploadDir, entityType, safeName);
  const resolvedPath = path.resolve(filePath);
  const allowedBase = path.resolve(path.join(uploadDir, entityType));

  if (!resolvedPath.startsWith(allowedBase + path.sep)) {
    return { success: false, message: "Invalid file path" };
  }

  if (!fs.existsSync(resolvedPath)) {
    return { success: false, message: "File not found" };
  }

  fs.unlinkSync(resolvedPath);
  return { success: true, message: "File deleted successfully" };
};

export { uploadDir };
