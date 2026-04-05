import { storeProduct, updateProduct, deleteProduct, getProductData } from "../src/products.js";
import { whitelistFields } from "../src/sanitize.js";

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
