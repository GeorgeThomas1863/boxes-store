import path from "path";
import { storeProduct, updateProduct, deleteProduct, getProductData } from "../src/products.js";
import { deletePic, uploadDir } from "../src/upload-back.js";
import { whitelistFields, sanitizeFilename } from "../src/sanitize.js";
import { getGameSettings, saveGameSettings } from "../src/game-settings.js";

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
    "display",
  ]);

  if ('price' in safeParams) {
    const p = parseFloat(safeParams.price);
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ error: "Price must be a non-negative number" });
    }
    safeParams.price = p;
  }

  if ('discount' in safeParams) {
    const d = Number(safeParams.discount);
    if (!Number.isFinite(d) || d < 0 || d > 100) {
      return res.status(400).json({ error: "Discount must be a number between 0 and 100" });
    }
    safeParams.discount = Math.round(d);
  }

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
    "display",
  ]);

  if ('price' in safeParams) {
    const p = parseFloat(safeParams.price);
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ error: "Price must be a non-negative number" });
    }
    safeParams.price = p;
  }

  if ('discount' in safeParams) {
    const d = Number(safeParams.discount);
    if (!Number.isFinite(d) || d < 0 || d > 100) {
      return res.status(400).json({ error: "Discount must be a number between 0 and 100" });
    }
    safeParams.discount = Math.round(d);
  }

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

export const getGameSettingsControl = async (req, res) => {
  try {
    const data = await getGameSettings();
    return res.json(data);
  } catch (error) {
    console.error("Error fetching game settings:", error);
    return res.status(500).json({ error: "Failed to fetch game settings" });
  }
};

export const saveGameSettingsControl = async (req, res) => {
  const { capsuleCount, spinOptions, capsuleDescriptions = [] } = req.body;

  // validate capsuleCount
  const count = Number(capsuleCount);
  if (!Number.isFinite(count) || !Number.isInteger(count) || count < 1) {
    return res.status(400).json({ error: "capsuleCount must be a positive integer" });
  }

  // validate spinOptions
  if (!Array.isArray(spinOptions)) {
    return res.status(400).json({ error: "spinOptions must be an array" });
  }
  for (let i = 0; i < spinOptions.length; i++) {
    const opt = spinOptions[i];
    const spins = Number(opt.extraSpins);
    const cost = Number(opt.spinCost);
    if (!Number.isFinite(spins) || spins < 0 || !Number.isInteger(spins)) {
      return res.status(400).json({ error: "extraSpins must be a non-negative integer" });
    }
    if (!Number.isFinite(cost) || cost < 0) {
      return res.status(400).json({ error: "spinCost must be a non-negative number" });
    }
  }

  // validate capsuleDescriptions
  if (!Array.isArray(capsuleDescriptions)) {
    return res.status(400).json({ error: "capsuleDescriptions must be an array" });
  }
  for (let i = 0; i < capsuleDescriptions.length; i++) {
    const trimmed = String(capsuleDescriptions[i]).trim();
    if (!trimmed || trimmed.length > 80) {
      return res.status(400).json({ error: "Each capsule description must be a non-empty string of 80 characters or fewer" });
    }
  }

  // build clean options (no labels — saveGameSettings generates them)
  const cleanOptions = [];
  for (let i = 0; i < spinOptions.length; i++) {
    const opt = spinOptions[i];
    cleanOptions.push({ extraSpins: Number(opt.extraSpins), spinCost: Number(opt.spinCost) });
  }

  const cleanDescriptions = [];
  for (let i = 0; i < capsuleDescriptions.length; i++) {
    cleanDescriptions.push(String(capsuleDescriptions[i]).trim());
  }

  try {
    const result = await saveGameSettings({ capsuleCount: count, spinOptions: cleanOptions, capsuleDescriptions: cleanDescriptions });
    return res.json(result);
  } catch (error) {
    console.error("Error saving game settings:", error);
    return res.status(500).json({ error: "Failed to save game settings" });
  }
};
