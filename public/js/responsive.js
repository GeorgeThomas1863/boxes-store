import { runAuthSubmit } from "./auth.js";
import { runPlaceOrder } from "./run/checkout-run.js";
import { closePopup, closeConfirmDialog } from "./util/popup.js";
import { runPwToggle } from "./util/collapse.js";

import { runAddToCart, runIncreaseQuantity, runDecreaseQuantity, runRemoveFromCart, runUpdateSpins } from "./run/cart-run.js";
import { runModalTrigger, runModalClose, updateAdminStats } from "./run/admin-run.js";
import { runAddNewProduct, runEditProduct, runDeleteProduct, changeAdminProductSelector } from "./run/admin-products.js";
import { runSlotUploadPic, runSlotUploadClick, runDeleteSlotImage, runAddPicSlot, runRemovePicSlot } from "./run/upload-pic.js";
import { buildProductDetailModal } from "./forms/admin-form.js";

const displayElement = document.getElementById("display-element");
const cartElement = document.getElementById("cart-element");
const checkoutElement = document.getElementById("checkout-element");
const confirmElement = document.getElementById("confirm-element");
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

const goToSlide = (carousel, index) => {
  const track = carousel.querySelector(".carousel-track");
  const dots = carousel.querySelectorAll(".carousel-dot");
  if (track) track.style.transform = `translateX(-${index * 100}%)`;
  for (let i = 0; i < dots.length; i++) dots[i].classList.remove("active");
  if (dots[index]) dots[index].classList.add("active");
};

const getActiveCarouselIndex = (carousel) => {
  const dot = carousel.querySelector(".carousel-dot.active");
  return dot ? parseInt(dot.getAttribute("data-index")) : 0;
};

const runOpenProductModal = async (clickElement) => {
  const card = clickElement.closest(".product-card");
  if (!card || !card.productData) return;

  const existing = document.getElementById("product-detail-modal");
  if (existing) existing.remove();

  const cardCarousel = card.querySelector(".product-carousel");
  const startIndex = cardCarousel ? getActiveCarouselIndex(cardCarousel) : 0;
  const modal = await buildProductDetailModal(card.productData, startIndex);
  modal.id = "product-detail-modal";
  if (!displayElement) return;
  displayElement.append(modal);

  requestAnimationFrame(() => {
    modal.classList.add("visible");
  });
};

const runCloseProductModal = () => {
  const modal = document.getElementById("product-detail-modal");
  if (modal) modal.remove();
};

export const clickHandler = async (e) => {
  const clickedElement = e.target;
  const clickId = clickedElement.id;
  const clickType = clickedElement.getAttribute("data-label");

  if (clickType === "toggle-menu") {
    const overlay = document.querySelector(".nav-overlay");
    if (overlay) {
      overlay.classList.toggle("open");
      document.body.style.overflow = overlay.classList.contains("open") ? "hidden" : "";
    }
  }

  if (clickType === "pwToggle") await runPwToggle();
  if (clickType === "auth-submit") await runAuthSubmit();

  if (clickType === "add-to-cart") {
    await runAddToCart(clickedElement);
    if (clickedElement.closest(".product-detail-overlay")) runCloseProductModal();
  }
  if (clickType === "increase-quantity") await runIncreaseQuantity(clickedElement);
  if (clickType === "decrease-quantity") await runDecreaseQuantity(clickedElement);
  if (clickType === "remove-from-cart") await runRemoveFromCart(clickedElement);
  if (clickType === "checkout-btn") window.location.href = "/checkout";
  if (clickType === "place-order") await runPlaceOrder();

  if (clickType === "popup-close") await closePopup();
  if (clickType === "confirm-yes") await closeConfirmDialog(true);
  if (clickType === "confirm-no") await closeConfirmDialog(false);

  if (clickType?.includes("open-modal-")) await runModalTrigger(clickedElement);
  if (clickType?.includes("close-modal-")) await runModalClose(clickedElement);
  if (clickType === "product-card-click") await runOpenProductModal(clickedElement);
  if (clickType === "close-product-modal") runCloseProductModal();

  if (clickType === "carousel-prev") {
    const carousel = clickedElement.closest(".product-carousel");
    if (carousel) {
      const total = carousel.querySelectorAll(".carousel-dot").length;
      const current = getActiveCarouselIndex(carousel);
      if (current > 0) goToSlide(carousel, current - 1);
    }
  }
  if (clickType === "carousel-next") {
    const carousel = clickedElement.closest(".product-carousel");
    if (carousel) {
      const total = carousel.querySelectorAll(".carousel-dot").length;
      const current = getActiveCarouselIndex(carousel);
      if (current < total - 1) goToSlide(carousel, current + 1);
    }
  }
  if (clickType === "product-carousel-dot") {
    const carousel = clickedElement.closest(".product-carousel");
    if (carousel) goToSlide(carousel, parseInt(clickedElement.getAttribute("data-index")));
  }

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
  if (changeType === "spin-select") await runUpdateSpins(changeElement);
};

export const keyHandler = async (e) => {
  if (e.key !== "Enter") return null;
  e.preventDefault();

  const keyElement = e.target;
  const keyId = keyElement.id;

  // console.log("KEY HANDLER");
  // console.log(keyId);

  if (keyId === "auth-pw-input") await runAuthSubmit();

  return true;
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
if (cartElement) cartElement.addEventListener("change", changeHandler);
if (authElement) {
  authElement.addEventListener("click", clickHandler);
  authElement.addEventListener("keypress", keyHandler);
}
if (adminElement) {
  adminElement.addEventListener("click", clickHandler);
  adminElement.addEventListener("change", changeHandler);
  adminElement.addEventListener("input", inputHandler);
}
if (checkoutElement) {
  checkoutElement.addEventListener("click", clickHandler);
  checkoutElement.addEventListener("input", inputHandler);
}
if (confirmElement) confirmElement.addEventListener("click", clickHandler);
const aboutElement = document.getElementById("about-element");
if (aboutElement) aboutElement.addEventListener("click", clickHandler);
