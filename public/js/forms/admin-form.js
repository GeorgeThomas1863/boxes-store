import { buildCarouselElement } from "./main-form.js";
import { buildCollapseContainer } from "../util/collapse.js";
import { buildSpinSelector } from "../util/spin-options.js";
import { getGameSettings } from "../util/game-settings-cache.js";

export const buildAdminForm = async () => {
  const adminFormWrapper = document.createElement("div");
  adminFormWrapper.className = "admin-dashboard-wrapper";

  const dashboardHeader = await buildDashboardHeader();
  const productsSection = await buildProductsSection();

  const statsWrapper = document.createElement("div");
  statsWrapper.className = "stats-wrapper";

  const statsControls = document.createElement("div");
  statsControls.className = "stats-controls";

  const statsRefreshButton = document.createElement("button");
  statsRefreshButton.className = "btn-admin-stats-refresh";
  statsRefreshButton.type = "button";
  statsRefreshButton.textContent = "↺ Refresh Stats";
  statsRefreshButton.setAttribute("data-label", "refresh-admin-stats");

  statsControls.append(statsRefreshButton);

  const statsSection = await buildStatsSection();
  statsWrapper.append(statsControls, statsSection);

  const gameSection = await buildGameSection();
  adminFormWrapper.append(dashboardHeader, productsSection, gameSection, statsWrapper);

  return adminFormWrapper;
};

export const buildDashboardHeader = async () => {
  const header = document.createElement("div");
  header.className = "dashboard-header";

  const title = document.createElement("h1");
  title.className = "dashboard-title";
  title.textContent = "ADMIN DASHBOARD";

  const subtitle = document.createElement("p");
  subtitle.className = "dashboard-subtitle";
  subtitle.textContent = "Manage your products";

  const headerActions = document.createElement("div");
  headerActions.className = "header-actions";

  const homeLink = document.createElement("a");
  homeLink.className = "btn";
  homeLink.href = "/";
  homeLink.textContent = "← Back to Store";

  headerActions.append(homeLink);
  header.append(title, subtitle, headerActions);

  return header;
};

export const buildProductsSection = async () => {
  const section = document.createElement("div");
  section.className = "category-section";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = "📦 PRODUCTS";

  const actionCards = document.createElement("div");
  actionCards.className = "action-cards";

  const addCard = await buildActionCard("add", "products");
  const editCard = await buildActionCard("edit", "products");

  actionCards.append(addCard, editCard);

  const collapseContainer = await buildCollapseContainer({
    titleElement: title,
    contentElement: actionCards,
    isExpanded: true,
    dataAttribute: "products-collapse",
  });

  section.append(collapseContainer);

  return section;
};

export const buildGameSection = async () => {
  const section = document.createElement("div");
  section.className = "category-section";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = "🎮 GAME SETTINGS";

  const actionCards = document.createElement("div");
  actionCards.className = "action-cards";

  const gameCard = await buildGameActionCard();

  actionCards.append(gameCard);

  const collapseContainer = await buildCollapseContainer({
    titleElement: title,
    contentElement: actionCards,
    isExpanded: true,
    dataAttribute: "game-settings-collapse",
  });

  section.append(collapseContainer);

  return section;
};

export const buildGameActionCard = async () => {
  const card = document.createElement("div");
  card.className = "action-card";
  card.setAttribute("data-label", "open-modal-game-settings");

  const icon = document.createElement("div");
  icon.className = "action-icon";
  icon.textContent = "🎮";
  icon.setAttribute("data-label", "open-modal-game-settings");

  const title = document.createElement("div");
  title.className = "action-title";
  title.textContent = "Game Settings";
  title.setAttribute("data-label", "open-modal-game-settings");

  const description = document.createElement("div");
  description.className = "action-description";
  description.textContent = "Configure capsule count & spin options";
  description.setAttribute("data-label", "open-modal-game-settings");

  card.append(icon, title, description);

  return card;
};

export const buildStatsSection = async () => {
  const section = document.createElement("div");
  section.className = "stats-section";

  const stats = [
    { icon: "📦", value: "0", label: "Products", id: "total-products-stat" },
    { icon: "👁️", value: "0", label: "Displayed", id: "displayed-products-stat" },
    { icon: "✅", value: "0", label: "Sold", id: "sold-products-stat" },
  ];

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    const statItem = document.createElement("div");
    statItem.className = "stat-item";

    const icon = document.createElement("div");
    icon.className = "stat-icon";
    icon.textContent = stat.icon;

    const value = document.createElement("div");
    value.className = "stat-value";
    value.id = stat.id;
    value.textContent = stat.value;

    const label = document.createElement("div");
    label.className = "stat-label";
    label.textContent = stat.label;

    statItem.append(icon, value, label);
    section.append(statItem);
  }

  return section;
};

export const buildActionCard = async (mode, entityType) => {
  const card = document.createElement("div");
  card.className = "action-card";
  card.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const icon = document.createElement("div");
  icon.className = "action-icon";
  icon.textContent = mode === "add" ? "➕" : "✏️";
  icon.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const title = document.createElement("div");
  title.className = "action-title";
  const titleText = mode === "add" ? "Add New Product" : "Edit Product";
  title.textContent = titleText;
  title.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const description = document.createElement("div");
  description.className = "action-description";
  const descText = mode === "add" ? "Create a new product listing with details" : "Modify or delete existing products";
  description.textContent = descText;
  description.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  card.append(icon, title, description);

  return card;
};

// =============================
// MODAL BUILDERS
// =============================

export const buildModal = async (mode, entityType) => {
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.id = `${mode}-${entityType}-modal`;

  const modalWrapper = document.createElement("div");
  modalWrapper.className = "modal-wrapper";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = await buildModalHeader(mode, entityType);
  const modalBody = await buildModalBody(mode, entityType);
  const modalActions = await buildModalActions(mode, entityType);

  modalContent.append(modalBody, modalActions);
  modalWrapper.append(modalHeader, modalContent);
  modalOverlay.append(modalWrapper);

  return modalOverlay;
};

export const buildModalHeader = async (mode, entityType) => {
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("h2");
  title.className = "modal-title";
  title.textContent = mode === "add" ? "ADD NEW PRODUCT" : "EDIT PRODUCT";

  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.textContent = "×";
  closeButton.type = "button";
  closeButton.setAttribute("data-label", `close-modal-${mode}-${entityType}`);

  header.append(title, closeButton);

  return header;
};

export const buildModalBody = async (mode, entityType) => {
  const body = document.createElement("div");
  body.className = "modal-body";

  if (mode === "edit") {
    const selector = await buildAdminProductSelector();
    body.append(selector);
  }

  const detailsSection = await buildProductDetailsSection(mode);
  const imagesSection = await buildProductImagesSection(mode);

  body.append(detailsSection, imagesSection);

  return body;
};

export const buildModalActions = async (mode, entityType) => {
  const actions = document.createElement("div");
  actions.className = "modal-actions";

  if (mode === "edit") {
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-admin-delete";
    deleteButton.type = "button";
    deleteButton.id = "delete-product-button";
    deleteButton.setAttribute("data-label", "delete-product-submit");
    deleteButton.textContent = "Delete";
    deleteButton.disabled = true;
    actions.append(deleteButton);
  }

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-admin-cancel";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.setAttribute("data-label", `close-modal-${mode}-${entityType}`);

  const submitButton = document.createElement("button");
  submitButton.className = "btn btn-admin-submit";
  submitButton.type = "button";
  submitButton.id = mode === "add" ? "submit-button" : "edit-submit-button";
  submitButton.textContent = mode === "add" ? "Submit" : "Update";
  submitButton.setAttribute("data-label", mode === "add" ? "new-product-submit" : "edit-product-submit");

  if (mode === "edit") {
    submitButton.disabled = true;
  }

  actions.append(cancelButton, submitButton);

  return actions;
};

// =============================
// PRODUCT FORM SECTIONS
// =============================

export const buildPicSlot = (index, entityType = "products") => {
  const slot = document.createElement("div");
  slot.className = "pic-slot";
  slot.setAttribute("data-slot-index", String(index));

  const imageDisplay = document.createElement("div");
  imageDisplay.className = "image-display";

  const imagePlaceholder = document.createElement("div");
  imagePlaceholder.className = "image-placeholder";
  imagePlaceholder.textContent = "🖼️";

  const currentImage = document.createElement("img");
  currentImage.className = "current-image hidden";
  currentImage.alt = "Product image";

  const currentVideo = document.createElement("video");
  currentVideo.className = "current-video hidden";
  currentVideo.controls = true;

  const deleteImageBtn = document.createElement("button");
  deleteImageBtn.type = "button";
  deleteImageBtn.className = "delete-image-btn hidden";
  deleteImageBtn.innerHTML = "×";
  deleteImageBtn.title = "Delete file";
  deleteImageBtn.setAttribute("data-label", "delete-slot-image");

  imageDisplay.append(imagePlaceholder, currentImage, currentVideo, deleteImageBtn);

  const picInput = document.createElement("input");
  picInput.type = "file";
  picInput.className = "pic-file-input hidden";
  picInput.accept = ".jpg,.jpeg,.png,.gif,.webp";

  const uploadBtn = document.createElement("button");
  uploadBtn.type = "button";
  uploadBtn.className = "upload-btn";
  uploadBtn.textContent = "Choose File";
  uploadBtn.setAttribute("data-label", "slot-upload-click");
  uploadBtn.entityType = entityType;

  const uploadStatus = document.createElement("span");
  uploadStatus.className = "upload-status hidden";

  const removeSlotBtn = document.createElement("button");
  removeSlotBtn.type = "button";
  removeSlotBtn.className = "remove-slot-btn";
  removeSlotBtn.textContent = "Remove slot";
  removeSlotBtn.setAttribute("data-label", "remove-pic-slot");
  if (index === 0) removeSlotBtn.classList.add("hidden");

  const actionsRow = document.createElement("div");
  actionsRow.className = "slot-image-actions";
  actionsRow.append(uploadBtn);

  slot.append(imageDisplay, picInput, actionsRow, uploadStatus, removeSlotBtn);

  return slot;
};

export const buildProductImagesSection = async (mode) => {
  const section = document.createElement("div");
  section.className = "product-section";

  const header = document.createElement("div");
  header.className = "section-header";

  const icon = document.createElement("span");
  icon.className = "section-icon";
  icon.textContent = "📷";

  const title = document.createElement("h3");
  title.className = "section-title";
  title.textContent = "Product Images";

  header.append(icon, title);

  const slotsContainer = document.createElement("div");
  slotsContainer.className = "pic-slots-container";

  const initialSlot = buildPicSlot(0);
  if (mode === "edit") {
    const slotUploadBtn = initialSlot.querySelector(".upload-btn");
    const slotFileInput = initialSlot.querySelector(".pic-file-input");
    if (slotUploadBtn) slotUploadBtn.disabled = true;
    if (slotFileInput) slotFileInput.disabled = true;
  }
  slotsContainer.append(initialSlot);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn-add-image";
  addBtn.textContent = "+ Add Image";
  addBtn.setAttribute("data-label", "add-pic-slot");
  if (mode === "edit") addBtn.disabled = true;

  section.append(header, slotsContainer, addBtn);

  return section;
};

export const buildProductDetailsSection = async (mode) => {
  const section = document.createElement("div");
  section.className = "product-section";

  const header = document.createElement("div");
  header.className = "section-header";

  const icon = document.createElement("span");
  icon.className = "section-icon";
  icon.textContent = "📦";

  const title = document.createElement("h3");
  title.className = "section-title";
  title.textContent = "Product Details";

  header.append(icon, title);

  const itemIdRow = await buildInfoRow(mode, "item-id", "Item Id");
  const nameRow = await buildInfoRow(mode, "name", "Product Name");

  if (mode === "add") {
    nameRow.querySelector("input").setAttribute("data-label", "admin-product-name-input");
  }

  const slugRow = await buildInfoRow(mode, "url-name", "URL Ending");

  const priceRow = await buildInfoRowPrice(mode, "price", "Price");
  const discountRow = await buildInfoRowDiscount(mode, "discount", "Discount (%)");
  const displayToggleRow = await buildInfoRowDisplayToggle(mode);
  const descRow = await buildInfoRowTextarea(mode, "description", "Description");

  section.append(header, itemIdRow, nameRow, priceRow, discountRow, displayToggleRow, descRow, slugRow);

  return section;
};

// =============================
// PRODUCT SELECTOR
// =============================

export const buildAdminProductSelector = async () => {
  const selectorWrapper = document.createElement("li");
  selectorWrapper.className = "form-field product-selector-field";

  const productSelect = document.createElement("select");
  productSelect.className = "form-select";
  productSelect.id = "product-selector";
  productSelect.name = "product-selector";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select a product --";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  productSelect.append(defaultOption);

  selectorWrapper.append(productSelect);

  return selectorWrapper;
};

// =============================
// FIELD ROW BUILDERS
// =============================

export const buildInfoRow = async (mode, fieldName, labelText) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const input = document.createElement("input");
  input.className = "info-content info-input";
  input.type = "text";
  input.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  input.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    input.disabled = true;
  }

  contentWrapper.append(input);
  row.append(label, contentWrapper);

  return row;
};

export const buildInfoRowPrice = async (mode, fieldName, labelText) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const input = document.createElement("input");
  input.className = "info-content info-input";
  input.type = "number";
  input.min = "0";
  input.step = "1.00";
  input.placeholder = "0.00";
  input.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  input.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    input.disabled = true;
  }

  contentWrapper.append(input);
  row.append(label, contentWrapper);

  return row;
};

export const buildInfoRowDiscount = async (mode, fieldName, labelText) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const toggleRow = document.createElement("div");
  toggleRow.className = "discount-toggle-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "discount-toggle-label";

  const toggleCheckbox = document.createElement("input");
  toggleCheckbox.type = "checkbox";
  toggleCheckbox.className = "discount-toggle-checkbox";
  toggleCheckbox.id = mode === "add" ? "discount-toggle" : "edit-discount-toggle";

  const toggleTrack = document.createElement("span");
  toggleTrack.className = "discount-toggle-track";

  const toggleText = document.createElement("span");
  toggleText.className = "discount-toggle-text";
  toggleText.id = mode === "add" ? "discount-toggle-text" : "edit-discount-toggle-text";
  toggleText.textContent = "No Discount";

  toggleLabel.append(toggleCheckbox, toggleTrack, toggleText);
  toggleRow.append(toggleLabel);

  const input = document.createElement("input");
  input.className = "info-content info-input hidden";
  input.type = "number";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.placeholder = "0";
  input.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  input.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    toggleCheckbox.disabled = true;
    input.disabled = true;
  }

  toggleCheckbox.addEventListener("change", () => {
    if (toggleCheckbox.checked) {
      input.classList.remove("hidden");
      toggleText.textContent = "Discount Active";
    } else {
      input.classList.add("hidden");
      input.value = "";
      toggleText.textContent = "No Discount";
    }
  });

  contentWrapper.append(toggleRow, input);
  row.append(label, contentWrapper);

  return row;
};

export const buildInfoRowDisplayToggle = async (mode) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = "Show on Site";

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const toggleRow = document.createElement("div");
  toggleRow.className = "discount-toggle-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "discount-toggle-label";

  const toggleCheckbox = document.createElement("input");
  toggleCheckbox.type = "checkbox";
  toggleCheckbox.className = "discount-toggle-checkbox";
  toggleCheckbox.id = mode === "add" ? "display-toggle" : "edit-display-toggle";
  toggleCheckbox.checked = true;

  if (mode === "edit") {
    toggleCheckbox.disabled = true;
  }

  const toggleTrack = document.createElement("span");
  toggleTrack.className = "discount-toggle-track display-toggle-track";

  const toggleText = document.createElement("span");
  toggleText.className = "discount-toggle-text";
  toggleText.id = mode === "add" ? "display-toggle-text" : "edit-display-toggle-text";
  toggleText.textContent = "Visible";

  toggleCheckbox.addEventListener("change", () => {
    toggleText.textContent = toggleCheckbox.checked ? "Visible" : "Hidden";
  });

  toggleLabel.append(toggleCheckbox, toggleTrack, toggleText);
  toggleRow.append(toggleLabel);
  contentWrapper.append(toggleRow);
  row.append(label, contentWrapper);

  return row;
};

export const buildInfoRowSelect = async (mode, fieldName, labelText, options) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const select = document.createElement("select");
  select.className = "info-content info-select";
  select.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  select.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    select.disabled = true;
  }

  for (let i = 0; i < options.length; i++) {
    const optionData = options[i];
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    if (optionData.selected) {
      option.selected = true;
    }
    select.append(option);
  }

  contentWrapper.append(select);
  row.append(label, contentWrapper);

  return row;
};

export const buildInfoRowTextarea = async (mode, fieldName, labelText) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const textarea = document.createElement("textarea");
  textarea.className = "info-content info-textarea";
  textarea.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  textarea.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    textarea.disabled = true;
  }

  contentWrapper.append(textarea);
  row.append(label, contentWrapper);

  return row;
};

// =============================
// PRODUCT DETAIL MODAL (main page)
// =============================

export const buildProductDetailModal = async (productData, startIndex = 0) => {
  const { productId, name, price, picData, description, discount } = productData;

  const overlay = document.createElement("div");
  overlay.className = "product-detail-overlay";
  overlay.setAttribute("data-label", "close-product-modal");

  const wrapper = document.createElement("div");
  wrapper.className = "product-detail-wrapper";

  // Header (close button only)
  const header = document.createElement("div");
  header.className = "product-detail-header";

  const closeBtn = document.createElement("button");
  closeBtn.className = "product-detail-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("data-label", "close-product-modal");
  closeBtn.textContent = "\u00d7";

  header.append(closeBtn);
  wrapper.append(header);

  // Image section (skip if no picData)
  const pics = picData ? (Array.isArray(picData) ? picData : [picData]) : [];
  if (pics.length > 0) {
    const imageWrap = document.createElement("div");
    imageWrap.className = "product-detail-image-wrap";

    if (pics.length === 1) {
      if (pics[0].mediaType === "video") {
        const videoEl = document.createElement("video");
        videoEl.className = "product-detail-image";
        videoEl.controls = true;
        videoEl.src = pics[0].path;
        imageWrap.append(videoEl);
      } else if (pics[0]?.path) {
        const img = document.createElement("img");
        img.className = "product-detail-image";
        img.src = pics[0].path;
        img.alt = name || "";
        img.loading = "lazy";
        imageWrap.append(img);
      }
    } else {
      imageWrap.append(buildCarouselElement(pics, name || "", false, startIndex));
    }

    wrapper.append(imageWrap);
  }

  // Body
  const body = document.createElement("div");
  body.className = "product-detail-body";

  const nameEl = document.createElement("h2");
  nameEl.className = "product-detail-name";
  nameEl.textContent = name;

  let priceEl;
  if (discount > 0) {
    priceEl = document.createElement("div");
    priceEl.className = "product-detail-price-block";

    const originalEl = document.createElement("del");
    originalEl.className = "product-detail-price-original";
    originalEl.textContent = `$${parseFloat(price || 0).toFixed(2)}`;

    const discountedEl = document.createElement("span");
    discountedEl.className = "product-detail-price product-detail-price-discounted";
    discountedEl.textContent = `$${(parseFloat(price || 0) * (1 - discount / 100)).toFixed(2)}`;

    const badgeEl = document.createElement("span");
    badgeEl.className = "discount-badge";
    badgeEl.textContent = `${discount}% OFF`;

    priceEl.append(originalEl, discountedEl, badgeEl);
  } else {
    priceEl = document.createElement("span");
    priceEl.className = "product-detail-price";
    priceEl.textContent = `$${parseFloat(price || 0).toFixed(2)}`;
  }

  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "add-to-cart-btn product-detail-cart-btn";
  addToCartBtn.type = "button";
  addToCartBtn.setAttribute("data-label", "add-to-cart");
  addToCartBtn.productId = productId;
  addToCartBtn.textContent = "Add to Cart";

  const toAppend = [nameEl, priceEl, addToCartBtn];

  if (description) {
    const descEl = document.createElement("p");
    descEl.className = "product-detail-description";
    descEl.textContent = description;
    toAppend.push(descEl);
  }

  const settings = await getGameSettings();
  const spinSel = buildSpinSelector(productId, 0, null, settings.spinOptions);
  if (spinSel) toAppend.push(spinSel);
  body.append(...toAppend);
  wrapper.append(body);
  overlay.append(wrapper);

  return overlay;
};
