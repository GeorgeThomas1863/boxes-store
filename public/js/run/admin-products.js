import { clearAdminEditFields, disableAdminEditFields, enableAdminEditFields, updateProductStats } from "./admin-run.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewProductParams, getEditProductParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";

// =============================
// ADD PRODUCT
// =============================

export const runAddNewProduct = async () => {
  const newProductParams = await buildNewProductParams();
  if (!newProductParams || !newProductParams.name || !newProductParams.price) {
    await displayPopup("Please fill in the product name and price before submitting", "error");
    return null;
  }

  const data = await sendToBack(newProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to add new product", "error");
    return null;
  }

  const popupText = `Product "${data.name}" added successfully`;
  await displayPopup(popupText, "success");

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) await updateProductStats(productData);

  return data;
};

// =============================
// EDIT PRODUCT
// =============================

export const runEditProduct = async () => {
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to update", "error");
    return null;
  }

  const editProductParams = await getEditProductParams();
  if (!editProductParams || !editProductParams.name || !editProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  const productId = selectedOption.value;
  editProductParams.productId = productId;
  editProductParams.route = "/edit-product-route";

  const data = await sendToBack(editProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to update product", "error");
    return null;
  }

  const popupText = `Product "${data.name}" updated successfully`;
  await displayPopup(popupText, "success");

  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");

  if (productData) {
    await populateAdminProductSelector(productData);
    await updateProductStats(productData);

    productSelector.value = productId;

    const updatedOption = productSelector.options[productSelector.selectedIndex];
    if (updatedOption && updatedOption.productData) {
      await populateEditFormProducts(updatedOption.productData);
    }
  }

  return data;
};

// =============================
// DELETE PRODUCT
// =============================

export const runDeleteProduct = async () => {
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to delete", "error");
    return null;
  }

  const productName = document.getElementById("edit-name")?.value || "this product";
  const confirmMessage = `Are you sure you want to delete ${productName}? This action cannot be undone.`;
  const confirmed = await displayConfirmDialog(confirmMessage);

  if (!confirmed) return null;

  const productId = selectedOption.value;

  const data = await sendToBack({ route: "/delete-product-route", productId });
  if (!data || !data.success) {
    await displayPopup("Failed to delete product", "error");
    return null;
  }

  await displayPopup(`Product "${productName}" deleted successfully`, "success");

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) await updateProductStats(productData);

  return data;
};

// =============================
// SELECTOR CHANGE
// =============================

export const changeAdminProductSelector = async (changeElement) => {
  if (!changeElement) return null;

  await clearAdminEditFields();

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption.value) {
    await disableAdminEditFields();
    return null;
  }

  const productObj = selectedOption.productData;
  if (!productObj) return null;

  await enableAdminEditFields();
  await populateEditFormProducts(productObj);
};

// =============================
// POPULATE SELECTOR
// =============================

export const populateAdminProductSelector = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const productSelector = document.getElementById("product-selector");
  if (!productSelector) return;

  const defaultOption = productSelector.querySelector("option[disabled]");
  // Clear all options using replaceChildren (safe DOM method)
  productSelector.replaceChildren();
  if (defaultOption) {
    productSelector.append(defaultOption);
  }

  inputArray.sort((a, b) => {
    const aHasId = a.itemId != null && String(a.itemId).trim() !== "";
    const bHasId = b.itemId != null && String(b.itemId).trim() !== "";
    if (aHasId && bHasId) {
      const aStr = String(a.itemId);
      const bStr = String(b.itemId);
      const aIsAlpha = /^[a-zA-Z]/.test(aStr);
      const bIsAlpha = /^[a-zA-Z]/.test(bStr);
      if (aIsAlpha && !bIsAlpha) return -1;
      if (!aIsAlpha && bIsAlpha) return 1;
      return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: "base" });
    }
    if (aHasId) return -1;
    if (bHasId) return 1;
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    const option = document.createElement("option");
    option.value = product.productId;
    const hasId = product.itemId != null && String(product.itemId).trim() !== "";
    option.textContent = hasId ? `Item ID: ${product.itemId} | ${product.name}` : product.name;
    option.productData = product;
    productSelector.append(option);
  }

  return true;
};

// =============================
// POPULATE EDIT FORM
// =============================

export const populateEditFormProducts = async (inputObj) => {
  if (!inputObj) return null;

  const { itemId, name, urlName, price, description } = inputObj;

  const adminEditMapArray = [
    { id: "edit-item-id", value: itemId },
    { id: "edit-name", value: name },
    { id: "edit-url-name", value: urlName },
    { id: "edit-price", value: price },
    { id: "edit-description", value: description },
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  const deleteButton = document.getElementById("delete-product-button");
  if (deleteButton) deleteButton.disabled = false;

  return true;
};
