import { runAuthSubmit } from "./auth.js";
import { closePopup, closeConfirmDialog } from "./util/popup.js";
import { runPwToggle } from "./util/collapse.js";

import { runAddToCart, runIncreaseQuantity, runDecreaseQuantity, runRemoveFromCart } from "./run/cart-run.js";
import { runModalTrigger, runModalClose, updateAdminStats } from "./run/admin-run.js";
import { runAddNewProduct, runEditProduct, runDeleteProduct, changeAdminProductSelector } from "./run/admin-products.js";
import { runSlotUploadPic, runSlotUploadClick, runDeleteSlotImage, runAddPicSlot, runRemovePicSlot } from "./run/upload-pic.js";

const displayElement = document.getElementById("display-element");
const cartElement = document.getElementById("cart-element");
const authElement = document.getElementById("auth-element");
const adminElement = document.getElementById("admin-element");

const generateSlug = (name) => {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const clickHandler = async (e) => {
  const clickedElement = e.target;
  const clickId = clickedElement.id;
  const clickType = clickedElement.getAttribute("data-label");

  if (clickType === "toggle-menu") {
    const menu = document.querySelector(".nav-links");
    if (menu) menu.classList.toggle("open");
  }

  if (clickType === "pwToggle") await runPwToggle();
  if (clickType === "auth-submit") await runAuthSubmit();

  if (clickType === "add-to-cart") await runAddToCart(clickedElement);
  if (clickType === "increase-quantity") await runIncreaseQuantity(clickedElement);
  if (clickType === "decrease-quantity") await runDecreaseQuantity(clickedElement);
  if (clickType === "remove-from-cart") await runRemoveFromCart(clickedElement);

  if (clickType === "popup-close") await closePopup();
  if (clickType === "confirm-yes") await closeConfirmDialog(true);
  if (clickType === "confirm-no") await closeConfirmDialog(false);

  if (clickType?.includes("open-modal-")) await runModalTrigger(clickedElement);
  if (clickType?.includes("close-modal-")) await runModalClose(clickedElement);

  if (clickType === "new-product-submit") await runAddNewProduct();
  if (clickType === "edit-product-submit") await runEditProduct();
  if (clickType === "delete-product-submit") await runDeleteProduct();

  if (clickType === "refresh-admin-stats") await updateAdminStats();

  if (clickType === "slot-upload-click") await runSlotUploadClick(clickedElement);
  if (clickType === "delete-slot-image") await runDeleteSlotImage(clickedElement);
  if (clickType === "add-pic-slot") await runAddPicSlot();
  if (clickType === "remove-pic-slot") await runRemovePicSlot(clickedElement);
};

export const changeHandler = async (e) => {
  const changeElement = e.target;
  const changeId = changeElement.id;
  const changeType = changeElement.getAttribute("data-label");

  if (changeElement.classList.contains("pic-file-input")) {
    if (e.target.files[0]) await runSlotUploadPic(changeElement);
    return;
  }

  if (changeId === "product-selector") await changeAdminProductSelector(changeElement);
};

export const inputHandler = async (e) => {
  const inputElement = e.target;
  const label = inputElement.getAttribute("data-label");

  if (label === "admin-product-name-input") {
    const slugInput = document.getElementById("url-name");
    if (slugInput) slugInput.value = generateSlug(inputElement.value);
  }
};

if (displayElement) displayElement.addEventListener("click", clickHandler);
if (cartElement) cartElement.addEventListener("click", clickHandler);
if (authElement) {
  authElement.addEventListener("click", clickHandler);
}
if (adminElement) {
  adminElement.addEventListener("click", clickHandler);
  adminElement.addEventListener("change", changeHandler);
  adminElement.addEventListener("input", inputHandler);
}
