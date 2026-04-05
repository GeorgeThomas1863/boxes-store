import { sendToBack } from "../util/api-front.js";
import { buildModal } from "../forms/admin-form.js";
import { populateAdminProductSelector } from "./admin-products.js";

const adminElement = document.getElementById("admin-element");

// =============================
// MODAL CONTROLS
// =============================

export const runModalTrigger = async (clickElement) => {
  if (!clickElement) return null;

  const modalType = clickElement.getAttribute("data-label");
  if (!modalType) return null;

  const modalStr = modalType.split("-").slice(2).join("-");
  const [mode, entityType] = modalStr.split("-");

  const modal = await buildModal(mode, entityType);
  adminElement.append(modal);

  if (mode === "edit" && entityType === "products") {
    const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
    if (productData && productData.length) {
      await populateAdminProductSelector(productData);
      await updateProductStats(productData);
    }
  }

  modal.classList.add("visible");

  return true;
};

export const runModalClose = async (clickElement) => {
  if (!clickElement) return null;

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  return true;
};

// =============================
// FIELD ENABLE/DISABLE
// =============================

export const enableAdminEditFields = async () => {
  const enableFieldsArray = [
    "edit-item-id",
    "edit-name",
    "edit-url-name",
    "edit-price",
    "edit-description",
    "edit-submit-button",
  ];
  for (let i = 0; i < enableFieldsArray.length; i++) {
    const field = document.getElementById(enableFieldsArray[i]);
    if (field) field.disabled = false;
  }
  return true;
};

export const disableAdminEditFields = async () => {
  const disableFieldsArray = [
    "edit-item-id",
    "edit-name",
    "edit-url-name",
    "edit-price",
    "edit-description",
    "edit-submit-button",
  ];
  for (let i = 0; i < disableFieldsArray.length; i++) {
    const field = document.getElementById(disableFieldsArray[i]);
    if (field) field.disabled = true;
  }
  return true;
};

export const clearAdminEditFields = async () => {
  const clearFieldsArray = [
    "edit-item-id",
    "edit-name",
    "edit-url-name",
    "edit-price",
    "edit-description",
  ];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) field.value = "";
  }

  const deleteProductButton = document.getElementById("delete-product-button");
  if (deleteProductButton) deleteProductButton.disabled = true;

  return true;
};

// =============================
// STATS
// =============================

export const updateAdminStats = async () => {
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData && productData.length) await updateProductStats(productData);
  return true;
};

export const updateProductStats = async (productData) => {
  if (!productData || !productData.length) return null;

  const totalProducts = productData.length;
  const displayedProducts = productData.filter((p) => p.display === "yes").length;
  const soldProducts = productData.filter((p) => p.sold === "yes").length;

  const totalStat = document.getElementById("total-products-stat");
  const displayedStat = document.getElementById("displayed-products-stat");
  const soldStat = document.getElementById("sold-products-stat");

  if (totalStat) totalStat.textContent = totalProducts;
  if (displayedStat) displayedStat.textContent = displayedProducts;
  if (soldStat) soldStat.textContent = soldProducts;

  return true;
};
