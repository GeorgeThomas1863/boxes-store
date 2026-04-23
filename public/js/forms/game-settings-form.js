//---
// GAME SETTINGS MODAL BUILDERS
//---

export const buildGameSettingsModal = async (settings) => {
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.id = "game-settings-modal";

  const modalWrapper = document.createElement("div");
  modalWrapper.className = "modal-wrapper";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = await buildGameSettingsHeader();
  const modalBody = await buildGameSettingsBody(settings);
  const modalActions = await buildGameSettingsActions();

  modalContent.append(modalBody, modalActions);
  modalWrapper.append(modalHeader, modalContent);
  modalOverlay.append(modalWrapper);

  return modalOverlay;
};

//---
// HEADER
//---

export const buildGameSettingsHeader = async () => {
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("h2");
  title.className = "modal-title";
  title.textContent = "GAME SETTINGS";

  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.textContent = "×";
  closeButton.type = "button";
  closeButton.setAttribute("data-label", "close-modal-game-settings");

  header.append(title, closeButton);

  return header;
};

//---
// BODY
//---

export const buildGameSettingsBody = async (settings) => {
  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const capsuleSection = await buildCapsuleSection(settings.capsuleCount);
  const capsuleDescriptionsSection = await buildCapsuleDescriptionsSection(settings.capsuleDescriptions);
  const spinOptionsSection = await buildSpinOptionsSection(settings.spinOptions);
  const wheelItemsSection = await buildWheelItemsSection(settings.wheelItems || []);

  modalBody.append(capsuleSection, capsuleDescriptionsSection, spinOptionsSection, wheelItemsSection);

  return modalBody;
};

//---
// CAPSULE SECTION
//---

export const buildCapsuleSection = async (capsuleCount) => {
  const section = document.createElement("div");
  section.className = "product-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header";

  const sectionIcon = document.createElement("span");
  sectionIcon.className = "section-icon";
  sectionIcon.textContent = "💊";

  const sectionTitle = document.createElement("h3");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Pink Prize Capsules";

  sectionHeader.append(sectionIcon, sectionTitle);

  const infoRow = document.createElement("div");
  infoRow.className = "info-row";

  const infoLabel = document.createElement("div");
  infoLabel.className = "info-label";
  infoLabel.textContent = "Number of Capsules";

  const infoContentWrapper = document.createElement("div");
  infoContentWrapper.className = "info-content-wrapper";

  const capsuleInput = document.createElement("input");
  capsuleInput.className = "info-content info-input capsule-count-input";
  capsuleInput.type = "number";
  capsuleInput.id = "game-capsule-count";
  capsuleInput.setAttribute("min", "1");
  capsuleInput.setAttribute("step", "1");
  capsuleInput.value = String(capsuleCount);

  infoContentWrapper.append(capsuleInput);
  infoRow.append(infoLabel, infoContentWrapper);

  section.append(sectionHeader, infoRow);

  return section;
};

//---
// CAPSULE DESCRIPTIONS SECTION
//---

export const buildCapsuleDescriptionsSection = async (capsuleDescriptions) => {
  const descriptions = Array.isArray(capsuleDescriptions) ? capsuleDescriptions : [];

  const section = document.createElement("div");
  section.className = "product-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header";

  const sectionIcon = document.createElement("span");
  sectionIcon.className = "section-icon";
  sectionIcon.textContent = "🏷️";

  const sectionTitle = document.createElement("h3");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Capsule Pill Labels";

  sectionHeader.append(sectionIcon, sectionTitle);

  const sublabel = document.createElement("p");
  sublabel.className = "spin-options-sublabel";
  sublabel.textContent = "Labels shown in the Pink Prize Capsules section";

  const descriptionsList = document.createElement("div");
  descriptionsList.id = "capsule-descriptions-list";
  descriptionsList.className = "capsule-descriptions-list";

  for (let i = 0; i < descriptions.length; i++) {
    const row = await buildCapsuleDescriptionRow(descriptions[i]);
    descriptionsList.append(row);
  }

  const addButton = document.createElement("button");
  addButton.className = "btn-add-desc";
  addButton.textContent = "+ Add Label";
  addButton.type = "button";
  addButton.setAttribute("data-label", "add-capsule-description");
  addButton.id = "add-capsule-description-btn";

  const reorderButton = document.createElement("button");
  reorderButton.className = "btn-reorder-desc";
  reorderButton.textContent = "Reorder Labels";
  reorderButton.type = "button";
  reorderButton.setAttribute("data-label", "toggle-reorder-labels");
  reorderButton.id = "reorder-labels-btn";

  const descActions = document.createElement("div");
  descActions.className = "desc-actions-row";
  descActions.append(addButton, reorderButton);

  section.append(sectionHeader, sublabel, descriptionsList, descActions);

  return section;
};

//---
// CAPSULE DESCRIPTION ROW
//---

export const buildCapsuleDescriptionRow = async (desc) => {
  const row = document.createElement("div");
  row.className = "capsule-desc-row";
  row.setAttribute("data-description", desc);
  row.draggable = true;

  const dragHandle = document.createElement("span");
  dragHandle.className = "capsule-desc-drag-handle";
  dragHandle.textContent = "⠿";

  const label = document.createElement("span");
  label.className = "capsule-desc-label";
  label.textContent = desc;

  const removeButton = document.createElement("button");
  removeButton.className = "btn-remove-desc";
  removeButton.textContent = "×";
  removeButton.type = "button";
  removeButton.draggable = false;
  removeButton.setAttribute("data-label", "remove-capsule-description");

  row.append(dragHandle, label, removeButton);

  return row;
};

//---
// ADD CAPSULE DESCRIPTION ROW (inline input row)
//---

export const buildAddCapsuleDescriptionRow = async () => {
  const row = document.createElement("div");
  row.className = "add-desc-row";

  const descLabel = document.createElement("label");
  descLabel.className = "add-desc-label";
  descLabel.textContent = "Label:";

  const descInput = document.createElement("input");
  descInput.className = "desc-input";
  descInput.type = "text";
  descInput.id = "new-capsule-description";
  descInput.placeholder = "e.g. Shift Essentials";
  descInput.setAttribute("maxlength", "80");

  const confirmButton = document.createElement("button");
  confirmButton.className = "btn-confirm-desc";
  confirmButton.textContent = "✓";
  confirmButton.type = "button";
  confirmButton.setAttribute("data-label", "confirm-add-capsule-description");
  confirmButton.title = "Confirm";

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn-cancel-desc";
  cancelButton.textContent = "×";
  cancelButton.type = "button";
  cancelButton.setAttribute("data-label", "cancel-add-capsule-description");
  cancelButton.title = "Cancel";

  row.append(descLabel, descInput, confirmButton, cancelButton);

  return row;
};

//---
// SPIN OPTIONS SECTION
//---

export const buildSpinOptionsSection = async (spinOptions) => {
  const section = document.createElement("div");
  section.className = "product-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header";

  const sectionIcon = document.createElement("span");
  sectionIcon.className = "section-icon";
  sectionIcon.textContent = "🎰";

  const sectionTitle = document.createElement("h3");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Spin Options";

  sectionHeader.append(sectionIcon, sectionTitle);

  const sublabel = document.createElement("p");
  sublabel.className = "spin-options-sublabel";
  sublabel.textContent = "Spin options available to customers at checkout";

  const spinOptionsList = document.createElement("div");
  spinOptionsList.id = "spin-options-list";
  spinOptionsList.className = "spin-options-list";

  for (let i = 0; i < spinOptions.length; i++) {
    const row = await buildSpinOptionRow(spinOptions[i]);
    spinOptionsList.append(row);
  }

  const addButton = document.createElement("button");
  addButton.className = "btn-add-spin-option";
  addButton.textContent = "+ Add Option";
  addButton.type = "button";
  addButton.setAttribute("data-label", "add-spin-option");
  addButton.id = "add-spin-option-btn";

  section.append(sectionHeader, sublabel, spinOptionsList, addButton);

  return section;
};

//---
// SPIN OPTION ROW
//---

export const buildSpinOptionRow = async (opt) => {
  const row = document.createElement("div");
  row.className = "spin-option-row";
  row.setAttribute("data-extra-spins", String(opt.extraSpins));
  row.setAttribute("data-spin-cost", String(opt.spinCost));

  const label = document.createElement("span");
  label.className = "spin-option-label";

  if (opt.spinCost > 0) {
    label.textContent = `${opt.label} (+$${opt.spinCost.toFixed(2)})`;
  } else {
    label.textContent = opt.label;
  }

  const removeButton = document.createElement("button");
  removeButton.className = "btn-remove-spin";
  removeButton.textContent = "×";
  removeButton.type = "button";
  removeButton.setAttribute("data-label", "remove-spin-option");

  row.append(label, removeButton);

  return row;
};

//---
// ADD SPIN ROW (inline input row)
//---

export const buildAddSpinRow = async () => {
  const row = document.createElement("div");
  row.className = "add-spin-row";

  const spinsLabel = document.createElement("label");
  spinsLabel.className = "add-spin-label";
  spinsLabel.textContent = "Extra spins:";

  const spinsInput = document.createElement("input");
  spinsInput.className = "spin-input-spins";
  spinsInput.type = "number";
  spinsInput.setAttribute("min", "0");
  spinsInput.setAttribute("step", "1");
  spinsInput.placeholder = "0";
  spinsInput.id = "new-spin-count";

  const costLabel = document.createElement("label");
  costLabel.className = "add-spin-label";
  costLabel.textContent = "Cost ($):";

  const costInput = document.createElement("input");
  costInput.className = "spin-input-cost";
  costInput.type = "number";
  costInput.setAttribute("min", "0");
  costInput.setAttribute("step", "0.01");
  costInput.placeholder = "0.00";
  costInput.id = "new-spin-cost";

  const confirmButton = document.createElement("button");
  confirmButton.className = "btn-confirm-spin";
  confirmButton.textContent = "✓";
  confirmButton.type = "button";
  confirmButton.setAttribute("data-label", "confirm-add-spin-option");
  confirmButton.title = "Confirm";

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn-cancel-spin";
  cancelButton.textContent = "×";
  cancelButton.type = "button";
  cancelButton.setAttribute("data-label", "cancel-add-spin-option");
  cancelButton.title = "Cancel";

  row.append(spinsLabel, spinsInput, costLabel, costInput, confirmButton, cancelButton);

  return row;
};

//---
// WHEEL ITEMS SECTION
//---

export const buildWheelItemsSection = async (wheelItems) => {
  const items = Array.isArray(wheelItems) ? wheelItems : [];

  const section = document.createElement("div");
  section.className = "product-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header";

  const sectionIcon = document.createElement("span");
  sectionIcon.className = "section-icon";
  sectionIcon.textContent = "🎡";

  const sectionTitle = document.createElement("h3");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Wheel Item List";

  sectionHeader.append(sectionIcon, sectionTitle);

  const sublabel = document.createElement("p");
  sublabel.className = "spin-options-sublabel";
  sublabel.textContent = "Items shown in the Mystery Wheel Specialty Items section";

  const wheelItemsList = document.createElement("div");
  wheelItemsList.id = "wheel-items-list";
  wheelItemsList.className = "wheel-items-list";

  for (let i = 0; i < items.length; i++) {
    const row = await buildWheelItemRow(items[i]);
    wheelItemsList.append(row);
  }

  const addButton = document.createElement("button");
  addButton.className = "btn-add-wheel-item";
  addButton.textContent = "+ Add Item";
  addButton.type = "button";
  addButton.setAttribute("data-label", "add-wheel-item");
  addButton.id = "add-wheel-item-btn";

  const reorderButton = document.createElement("button");
  reorderButton.className = "btn-reorder-wheel-items";
  reorderButton.textContent = "Reorder Items";
  reorderButton.type = "button";
  reorderButton.setAttribute("data-label", "toggle-reorder-wheel-items");
  reorderButton.id = "reorder-wheel-items-btn";

  const actionsRow = document.createElement("div");
  actionsRow.className = "desc-actions-row";
  actionsRow.append(addButton, reorderButton);

  section.append(sectionHeader, sublabel, wheelItemsList, actionsRow);

  return section;
};

//---
// WHEEL ITEM ROW
//---

export const buildWheelItemRow = async (item) => {
  const row = document.createElement("div");
  row.className = "wheel-item-row";
  row.setAttribute("data-wheel-item", item);
  row.draggable = true;

  const dragHandle = document.createElement("span");
  dragHandle.className = "wheel-item-drag-handle";
  dragHandle.textContent = "⠿";

  const label = document.createElement("span");
  label.className = "wheel-item-label";
  label.textContent = item;

  const removeButton = document.createElement("button");
  removeButton.className = "btn-remove-wheel-item";
  removeButton.textContent = "×";
  removeButton.type = "button";
  removeButton.draggable = false;
  removeButton.setAttribute("data-label", "remove-wheel-item");

  row.append(dragHandle, label, removeButton);

  return row;
};

//---
// ADD WHEEL ITEM ROW (inline input row)
//---

export const buildAddWheelItemRow = async () => {
  const row = document.createElement("div");
  row.className = "add-wheel-item-row";

  const itemLabel = document.createElement("label");
  itemLabel.className = "add-desc-label";
  itemLabel.textContent = "Item:";

  const itemInput = document.createElement("input");
  itemInput.className = "wheel-item-input";
  itemInput.type = "text";
  itemInput.id = "new-wheel-item";
  itemInput.placeholder = "e.g. Items include planners...";
  itemInput.setAttribute("maxlength", "120");

  const confirmButton = document.createElement("button");
  confirmButton.className = "btn-confirm-wheel-item";
  confirmButton.textContent = "✓";
  confirmButton.type = "button";
  confirmButton.setAttribute("data-label", "confirm-add-wheel-item");
  confirmButton.title = "Confirm";

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn-cancel-wheel-item";
  cancelButton.textContent = "×";
  cancelButton.type = "button";
  cancelButton.setAttribute("data-label", "cancel-add-wheel-item");
  cancelButton.title = "Cancel";

  row.append(itemLabel, itemInput, confirmButton, cancelButton);

  return row;
};

//---
// ACTIONS (sticky bottom)
//---

export const buildGameSettingsActions = async () => {
  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-admin-cancel";
  cancelButton.textContent = "Cancel";
  cancelButton.type = "button";
  cancelButton.setAttribute("data-label", "close-modal-game-settings");

  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-admin-submit";
  saveButton.textContent = "Save";
  saveButton.type = "button";
  saveButton.setAttribute("data-label", "save-game-settings");
  saveButton.id = "game-settings-save-btn";

  actions.append(cancelButton, saveButton);

  return actions;
};
