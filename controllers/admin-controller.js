import path from "path";
import { storeProduct, updateProduct, deleteProduct, getProductData } from "../src/products.js";
import { deletePic, uploadDir } from "../src/upload-back.js";
import { whitelistFields, sanitizeFilename } from "../src/sanitize.js";

export const getProductDataControl = async (req, res) => {
  const data = await getProductData();
  return res.json(data);
};

export const addNewProductControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const safeParams = whitelistFields(inputParams, [
    "itemId",
    "name",
    "urlName",
    "price",
    "description",
    "picData",
    "dateCreated",
    "discount",
  ]);

  const data = await storeProduct(safeParams);
  return res.json(data);
};

export const editProductControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const safeParams = whitelistFields(inputParams, [
    "itemId",
    "name",
    "urlName",
    "price",
    "description",
    "picData",
    "productId",
    "discount",
  ]);

  const data = await updateProduct(safeParams);
  return res.json(data);
};

export const deleteProductControl = async (req, res) => {
  const productId = req.body.productId;
  if (!productId) return res.status(500).json({ error: "No product ID" });
  if (typeof productId === "object") return res.status(400).json({ error: "Invalid product ID" });

  const data = await deleteProduct(productId);
  return res.json(data);
};

export const uploadPicControl = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";

  const publicDir = path.join(uploadDir, "..");
  const relativePath = "/" + path.relative(publicDir, req.file.path).replace(/\\/g, "/");

  const data = {
    message: "Picture uploaded successfully",
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: relativePath,
    mediaType: mediaType,
  };

  return res.json(data);
};

export const deletePicControl = async (req, res) => {
  const { filename, entityType } = req.body;
  if (!filename) return res.status(400).json({ error: "No filename provided" });

  const allowedTypes = ["products"];
  if (!entityType || !allowedTypes.includes(entityType)) {
    return res.status(400).json({ error: "Invalid entity type" });
  }

  const safeName = sanitizeFilename(filename);
  if (!safeName || safeName !== filename) return res.status(400).json({ error: "Invalid filename" });

  try {
    const data = await deletePic(safeName, entityType);
    if (!data || !data.success) return res.status(500).json({ error: data.message });
    return res.json(data);
  } catch (error) {
    console.error("Error deleting file:", error);
    return res.status(500).json({ error: "Failed to delete file" });
  }
};
