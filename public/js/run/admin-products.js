import { clearAdminEditFields, disableAdminEditFields, enableAdminEditFields, updateProductStats } from "./admin-run.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewProductParams, getEditProductParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";
import { buildPicSlot } from "../forms/admin-form.js";

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

  // Reset pic slots to a single empty disabled slot
  const container = document.querySelector(".pic-slots-container");
  if (container) {
    container.innerHTML = "";
    const emptySlot = buildPicSlot(0);
    const slotUploadBtn = emptySlot.querySelector(".upload-btn");
    const slotFileInput = emptySlot.querySelector(".pic-file-input");
    if (slotUploadBtn) slotUploadBtn.disabled = true;
    if (slotFileInput) slotFileInput.disabled = true;
    container.append(emptySlot);
  }
  const addBtn = document.querySelector("[data-label='add-pic-slot']");
  if (addBtn) addBtn.disabled = true;

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

  const { itemId, name, urlName, price, description, discount } = inputObj;

  const adminEditMapArray = [
    { id: "edit-item-id", value: itemId },
    { id: "edit-name", value: name },
    { id: "edit-url-name", value: urlName },
    { id: "edit-price", value: price },
    { id: "edit-description", value: description },
    { id: "edit-discount", value: discount ?? 0 },
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  const deleteButton = document.getElementById("delete-product-button");
  if (deleteButton) deleteButton.disabled = false;

  const discountToggle = document.getElementById("edit-discount-toggle");
  const discountInput = document.getElementById("edit-discount");
  const discountToggleText = document.getElementById("edit-discount-toggle-text");
  if (discountToggle && discountInput) {
    const hasDiscount = discount != null && parseFloat(discount) > 0;
    discountToggle.checked = hasDiscount;
    if (hasDiscount) {
      discountInput.classList.remove("hidden");
      if (discountToggleText) discountToggleText.textContent = "Discount Active";
    } else {
      discountInput.classList.add("hidden");
      discountInput.value = "";
      if (discountToggleText) discountToggleText.textContent = "No Discount";
    }
  }

  // Rebuild image slots from picData
  const pics = inputObj.picData ? (Array.isArray(inputObj.picData) ? inputObj.picData : [inputObj.picData]) : [];
  const slotsContainer = document.querySelector(".pic-slots-container");
  if (slotsContainer) {
    slotsContainer.innerHTML = "";
    for (let i = 0; i < pics.length; i++) {
      const slot = buildPicSlot(i);
      const slotUploadBtn = slot.querySelector(".upload-btn");
      const slotCurrentImage = slot.querySelector(".current-image");
      const slotCurrentVideo = slot.querySelector(".current-video");
      const slotPlaceholder = slot.querySelector(".image-placeholder");
      const slotDeleteBtn = slot.querySelector(".delete-image-btn");

      if (slotUploadBtn) {
        slotUploadBtn.uploadData = pics[i];
        slotUploadBtn.textContent = "Change File";
      }
      if (pics[i].mediaType === "video") {
        if (slotCurrentVideo) {
          slotCurrentVideo.src = `/images/products/${pics[i].filename}`;
          slotCurrentVideo.classList.remove("hidden");
        }
        if (slotCurrentImage) slotCurrentImage.classList.add("hidden");
      } else {
        if (slotCurrentImage) {
          slotCurrentImage.src = `/images/products/${pics[i].filename}`;
          slotCurrentImage.classList.remove("hidden");
        }
        if (slotCurrentVideo) slotCurrentVideo.classList.add("hidden");
      }
      if (slotPlaceholder) slotPlaceholder.classList.add("hidden");
      if (slotDeleteBtn) slotDeleteBtn.classList.remove("hidden");

      slotsContainer.append(slot);
    }
    if (pics.length === 0) {
      slotsContainer.append(buildPicSlot(0));
    }
  }

  const addBtn = document.querySelector("[data-label='add-pic-slot']");
  if (addBtn) addBtn.disabled = false;

  return true;
};
