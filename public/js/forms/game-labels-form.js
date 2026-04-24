import { buildCollapseContainer } from "../util/collapse.js";

//---

export const buildGameLabelsModal = async (settings) => {
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.id = "game-labels-modal";

  const modalWrapper = document.createElement("div");
  modalWrapper.className = "modal-wrapper";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = await buildGameLabelsHeader();
  const modalBody = await buildGameLabelsBody(settings);
  const modalActions = await buildGameLabelsActions();

  modalContent.append(modalBody, modalActions);
  modalWrapper.append(modalHeader, modalContent);
  modalOverlay.append(modalWrapper);

  return modalOverlay;
};

//---

export const buildGameLabelsHeader = async () => {
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("h2");
  title.className = "modal-title";
  title.textContent = "GAME LABELS";

  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.textContent = "×";
  closeButton.type = "button";
  closeButton.setAttribute("data-label", "close-modal-game-labels");

  header.append(title, closeButton);

  return header;
};

//---

export const buildGameLabelsBody = async (settings) => {
  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const capsuleDescriptionsSection = await buildCapsuleDescriptionsSection(settings.capsuleDescriptions);
  const wheelItemsSection = await buildWheelItemsSection(settings.wheelItems || []);

  modalBody.append(capsuleDescriptionsSection, wheelItemsSection);

  return modalBody;
};

//---

export const buildGameLabelsActions = async () => {
  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-admin-cancel";
  cancelButton.textContent = "Cancel";
  cancelButton.type = "button";
  cancelButton.setAttribute("data-label", "close-modal-game-labels");

  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-admin-submit";
  saveButton.textContent = "Save";
  saveButton.type = "button";
  saveButton.setAttribute("data-label", "save-game-labels");
  saveButton.id = "game-labels-save-btn";

  actions.append(cancelButton, saveButton);

  return actions;
};

//---

export const buildCapsuleDescriptionsSection = async (capsuleDescriptions) => {
  const descriptions = Array.isArray(capsuleDescriptions) ? capsuleDescriptions : [];

  const titleElement = document.createElement("h3");
  titleElement.className = "section-title";
  titleElement.textContent = "🏷️ Capsule Pill Labels";

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

  const contentWrapper = document.createElement("div");
  contentWrapper.append(sublabel, descriptionsList, descActions);

  return buildCollapseContainer({
    titleElement,
    contentElement: contentWrapper,
    isExpanded: true,
    dataAttribute: "game-capsule-descs-collapse",
  });
};

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

export const buildWheelItemsSection = async (wheelItems) => {
  const items = Array.isArray(wheelItems) ? wheelItems : [];

  const titleElement = document.createElement("h3");
  titleElement.className = "section-title";
  titleElement.textContent = "🎡 Wheel Item List";

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

  const contentWrapper = document.createElement("div");
  contentWrapper.append(sublabel, wheelItemsList, actionsRow);

  return buildCollapseContainer({
    titleElement,
    contentElement: contentWrapper,
    isExpanded: true,
    dataAttribute: "game-wheel-items-collapse",
  });
};

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
