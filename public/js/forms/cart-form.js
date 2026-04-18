// forms/cart-form.js
import { buildSpinSelector } from "../util/spin-options.js";
export const buildCartForm = async () => {
  const cartContainer = document.createElement("div");
  cartContainer.className = "cart-container";

  const pageHeader = await buildCartPageHeader();
  const cartContent = await buildCartContent();

  cartContainer.append(pageHeader, cartContent);

  return cartContainer;
};

export const buildCartPageHeader = async () => {
  const pageHeader = document.createElement("div");
  pageHeader.className = "cart-page-header";

  const pageTitle = document.createElement("h1");
  pageTitle.className = "cart-page-title";
  pageTitle.textContent = "Shopping Cart";

  pageHeader.append(pageTitle);

  return pageHeader;
};

export const buildCartContent = async () => {
  const cartContent = document.createElement("div");
  cartContent.className = "cart-content";

  // Create a wrapper for the right column
  const rightColumnWrapper = document.createElement("div");
  rightColumnWrapper.className = "cart-right-column";

  const cartItemsSection = await buildCartItemsSection();
  const cartSummarySection = await buildCartSummarySection();


  // rightColumnWrapper.append(cartSummarySection);

  // cartContent.append(cartItemsSection, rightColumnWrapper);
  cartContent.append(cartItemsSection, cartSummarySection);

  return cartContent;
};

export const buildCartItemsSection = async () => {
  const itemsSection = document.createElement("div");
  itemsSection.className = "cart-items-section";

  const itemsContainer = document.createElement("div");
  itemsContainer.className = "cart-items-container";
  itemsContainer.id = "cart-items-container";

  itemsSection.append(itemsContainer);

  return itemsSection;
};

export const buildCartSummarySection = async () => {
  const summarySection = document.createElement("div");
  summarySection.className = "cart-summary-section";

  const summaryCard = document.createElement("div");
  summaryCard.className = "cart-summary-card";

  const summaryTitle = document.createElement("h2");
  summaryTitle.className = "cart-summary-title";
  summaryTitle.textContent = "Order Summary";

  const summaryDetails = document.createElement("div");
  summaryDetails.className = "cart-summary-details";

  const itemCountRow = await buildSummaryRow("Items:", "0", "cart-summary-item-count");
  const subtotalRow = await buildSummaryRow("Subtotal:", "$0.00", "cart-summary-subtotal");
  const spinRow = await buildSummaryRow("Extra Spins:", "$0.00", "cart-summary-spin-total");
  spinRow.id = "cart-summary-spin-row";
  spinRow.style.display = "none";
  const shippingRow = await buildSummaryRow("Shipping:", "FREE", "cart-summary-shipping");

  const totalRow = document.createElement("div");
  totalRow.className = "cart-summary-row cart-summary-total";

  const totalLabel = document.createElement("span");
  totalLabel.className = "cart-summary-label";
  totalLabel.textContent = "Total:";

  const totalValue = document.createElement("span");
  totalValue.className = "cart-summary-value";
  totalValue.id = "cart-summary-total";
  totalValue.textContent = "$0.00";

  totalRow.append(totalLabel, totalValue);

  summaryDetails.append(itemCountRow, subtotalRow, spinRow, shippingRow, totalRow);

  const checkoutBtn = document.createElement("button");
  checkoutBtn.className = "cart-checkout-btn";
  checkoutBtn.id = "cart-checkout-btn";
  checkoutBtn.textContent = "Proceed to Checkout";
  checkoutBtn.setAttribute("data-label", "checkout-btn");
  checkoutBtn.disabled = true;

  const continueShoppingLink = document.createElement("a");
  continueShoppingLink.className = "cart-continue-shopping";
  continueShoppingLink.href = "/";
  continueShoppingLink.textContent = "Continue Shopping";

  summaryCard.append(summaryTitle, summaryDetails, checkoutBtn, continueShoppingLink);
  summarySection.append(summaryCard);

  return summarySection;
};

export const buildSummaryRow = async (label, value, valueId) => {
  const row = document.createElement("div");
  row.className = "cart-summary-row";

  const labelSpan = document.createElement("span");
  labelSpan.className = "cart-summary-label";
  labelSpan.textContent = label;

  const valueSpan = document.createElement("span");
  valueSpan.className = "cart-summary-value";
  valueSpan.id = valueId;
  valueSpan.textContent = value;

  row.append(labelSpan, valueSpan);

  return row;
};

export const buildCartItem = async (itemData) => {
  const safeItemData = { ...itemData, cartItemId: itemData.cartItemId || `${itemData.productId}_${itemData.extraSpins || 0}` };
  const cartItem = document.createElement("div");
  cartItem.className = "cart-item";
  cartItem.setAttribute("data-product-id", safeItemData.productId);
  cartItem.setAttribute("data-cart-item-id", safeItemData.cartItemId);
  cartItem.setAttribute("data-base-price", safeItemData.price);
  cartItem.setAttribute("data-price", safeItemData.price + (safeItemData.spinCost || 0));

  const itemImage = await buildCartItemImage(safeItemData);
  const itemDetails = await buildCartItemDetails(safeItemData);
  const itemActions = await buildCartItemActions(safeItemData);

  cartItem.append(itemImage, itemDetails, itemActions);

  return cartItem;
};

export const buildCartItemImage = async (itemData) => {
  const imageContainer = document.createElement("div");
  imageContainer.className = "cart-item-image-container";

  const image = document.createElement("img");
  image.className = "cart-item-image";

  const pic = Array.isArray(itemData.picData) ? itemData.picData[0] : itemData.picData;
  // Handle string path (this project) vs object with filename (EXAMPLES pattern)
  image.src = typeof pic === "string" ? pic : `/images/products/${pic?.filename || ""}`;
  image.alt = itemData.name;

  imageContainer.append(image);

  return imageContainer;
};

export const buildCartItemDetails = async (itemData) => {
  const details = document.createElement("div");
  details.className = "cart-item-details";

  const itemTotal = document.createElement("div");
  itemTotal.className = "cart-item-total";
  itemTotal.id = `item-total-${itemData.cartItemId}`;
  const totalValue = (itemData.price + (itemData.spinCost || 0)) * itemData.quantity;
  itemTotal.textContent = `$${totalValue.toFixed(2)}`;

  const name = document.createElement("h2");
  name.className = "cart-item-name";
  name.textContent = itemData.name;

  details.append(itemTotal, name);

  if (itemData.canShip === "no") {
    const badge = document.createElement("span");
    badge.className = "pickup-badge";
    badge.textContent = "Pickup Only";
    details.append(badge);
  }

  if (itemData.discount > 0) {
    const discountNote = document.createElement("span");
    discountNote.className = "cart-item-discount-note";
    discountNote.textContent = `${itemData.discount}% discount applied`;
    details.append(discountNote);
  }

  const spinSel = buildSpinSelector(itemData.productId, itemData.extraSpins || 0, itemData.cartItemId);
  details.append(spinSel);

  return details;
};

export const buildCartItemActions = async (itemData) => {
  const actions = document.createElement("div");
  actions.className = "cart-item-actions";

  const quantityControl = await buildQuantityControl(itemData);
  const removeBtn = await buildRemoveButton(itemData);

  actions.append(quantityControl, removeBtn);

  return actions;
};

export const buildQuantityControl = async (itemData) => {
  const control = document.createElement("div");
  control.className = "cart-quantity-control";

  const label = document.createElement("span");
  label.className = "cart-quantity-label";
  label.textContent = "Quantity:";

  const btnGroup = document.createElement("div");
  btnGroup.className = "cart-quantity-buttons";

  const decreaseBtn = document.createElement("button");
  decreaseBtn.className = "cart-quantity-btn";
  decreaseBtn.textContent = "-";
  decreaseBtn.setAttribute("data-label", "decrease-quantity");
  decreaseBtn.setAttribute("data-cart-item-id", itemData.cartItemId);

  const quantityDisplay = document.createElement("span");
  quantityDisplay.className = "cart-quantity-display";
  quantityDisplay.id = `quantity-${itemData.cartItemId}`;
  quantityDisplay.textContent = itemData.quantity;

  const increaseBtn = document.createElement("button");
  increaseBtn.className = "cart-quantity-btn";
  increaseBtn.textContent = "+";
  increaseBtn.setAttribute("data-label", "increase-quantity");
  increaseBtn.setAttribute("data-cart-item-id", itemData.cartItemId);

  btnGroup.append(decreaseBtn, quantityDisplay, increaseBtn);
  control.append(label, btnGroup);

  return control;
};

export const buildRemoveButton = async (itemData) => {
  const removeBtn = document.createElement("button");
  removeBtn.className = "cart-remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.setAttribute("data-label", "remove-from-cart");
  removeBtn.setAttribute("data-cart-item-id", itemData.cartItemId);

  return removeBtn;
};

export const buildItemTotal = async (itemData) => {
  const total = document.createElement("div");
  total.className = "cart-item-total";
  total.id = `item-total-${itemData.cartItemId}`;

  const totalValue = itemData.price * itemData.quantity;
  total.textContent = `$${totalValue.toFixed(2)}`;

  return total;
};

export const buildEmptyCart = async () => {
  const emptyContainer = document.createElement("div");
  emptyContainer.className = "cart-empty";
  emptyContainer.id = "cart-empty";

  const emptyIcon = document.createElement("div");
  emptyIcon.className = "cart-empty-icon";
  emptyIcon.textContent = "🛒";

  const emptyMessage = document.createElement("p");
  emptyMessage.className = "cart-empty-message";
  emptyMessage.textContent = "Your cart is empty";

  const shopLink = document.createElement("a");
  shopLink.className = "cart-empty-link";
  shopLink.href = "/";
  shopLink.textContent = "Start Shopping";

  emptyContainer.append(emptyIcon, emptyMessage, shopLink);

  return emptyContainer;
};
