import { buildCollapseContainer } from "../util/collapse.js";

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

  adminFormWrapper.append(dashboardHeader, productsSection, statsWrapper);

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

  header.append(title, subtitle);

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
  const descText = mode === "add"
    ? "Create a new product listing with details"
    : "Modify or delete existing products";
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

  body.append(detailsSection);

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
  const descRow = await buildInfoRowTextarea(mode, "description", "Description");

  section.append(header, itemIdRow, nameRow, priceRow, descRow, slugRow);

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


