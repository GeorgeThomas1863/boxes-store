import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";
import { getGameSettings, invalidateGameSettingsCache } from "../util/game-settings-cache.js";
import { buildGameLabelsModal, buildCapsuleDescriptionRow, buildAddCapsuleDescriptionRow, buildWheelItemRow, buildAddWheelItemRow } from "../forms/game-labels-form.js";

//---

export const runGameLabelsModalTrigger = async () => {
  const adminElement = document.getElementById("admin-element");
  if (!adminElement) return null;

  const existing = document.getElementById("game-labels-modal");
  if (existing) existing.remove();

  const settings = await getGameSettings();
  const modal = await buildGameLabelsModal(settings);
  adminElement.append(modal);
  modal.classList.add("visible");
  initCapsuleDescriptionDragSort();
  initWheelItemDragSort();

  return true;
};

//---

export const runSaveGameLabels = async () => {
  const descRows = document.querySelectorAll("#capsule-descriptions-list .capsule-desc-row");
  const capsuleDescriptions = [];
  for (let i = 0; i < descRows.length; i++) {
    const desc = descRows[i].getAttribute("data-description");
    if (desc !== null) capsuleDescriptions.push(desc);
  }

  const wheelItemRows = document.querySelectorAll("#wheel-items-list .wheel-item-row");
  const wheelItems = [];
  for (let i = 0; i < wheelItemRows.length; i++) {
    const item = wheelItemRows[i].getAttribute("data-wheel-item");
    if (item !== null) wheelItems.push(item);
  }

  let cachedSettings;
  try {
    cachedSettings = await getGameSettings();
  } catch {
    displayPopup("Failed to load settings. Please try again.", "error");
    return null;
  }
  const { capsuleCount, spinOptions } = cachedSettings;

  const result = await sendToBack({ route: "/save-game-settings-route", capsuleCount, spinOptions, capsuleDescriptions, wheelItems });

  if (result) {
    invalidateGameSettingsCache();
    displayPopup("Game labels saved!", "success");
    const modal = document.getElementById("game-labels-modal");
    if (modal) modal.remove();
  } else {
    displayPopup("Failed to save labels", "error");
  }

  return result;
};

//---

export const runAddCapsuleDescriptionRow = async () => {
  const list = document.getElementById("capsule-descriptions-list");
  if (!list) return null;
  if (list.querySelector(".add-desc-row")) return null;
  const addBtn = document.getElementById("add-capsule-description-btn");
  if (addBtn) addBtn.disabled = true;
  const row = await buildAddCapsuleDescriptionRow();
  list.append(row);
  return true;
};

export const runConfirmAddCapsuleDescription = async () => {
  const addRow = document.querySelector("#capsule-descriptions-list .add-desc-row");
  if (!addRow) return null;
  const descInput = document.getElementById("new-capsule-description");
  const desc = descInput?.value.trim() ?? "";
  const showInlineError = (message) => {
    let errorSpan = addRow.querySelector(".add-desc-error");
    if (!errorSpan) {
      errorSpan = document.createElement("span");
      errorSpan.className = "add-desc-error";
      errorSpan.style.color = "#dc2626";
      errorSpan.style.fontSize = "0.8rem";
      addRow.append(errorSpan);
    }
    errorSpan.textContent = message;
  };
  if (!desc) { showInlineError("Label cannot be empty"); return null; }
  if (desc.length > 80) { showInlineError("Label must be 80 characters or fewer"); return null; }
  const newRow = await buildCapsuleDescriptionRow(desc);
  addRow.remove();
  const addBtn = document.getElementById("add-capsule-description-btn");
  if (addBtn) addBtn.disabled = false;
  const list = document.getElementById("capsule-descriptions-list");
  if (list) list.append(newRow);
  return true;
};

export const runCancelAddCapsuleDescription = async () => {
  const addRow = document.querySelector("#capsule-descriptions-list .add-desc-row");
  if (addRow) addRow.remove();
  const addBtn = document.getElementById("add-capsule-description-btn");
  if (addBtn) addBtn.disabled = false;
  return true;
};

export const runRemoveCapsuleDescription = async (clickElement) => {
  const row = clickElement.closest(".capsule-desc-row");
  if (row) row.remove();
  return true;
};

export const initCapsuleDescriptionDragSort = () => {
  const list = document.getElementById("capsule-descriptions-list");
  if (!list) return;
  let draggedRow = null;
  list.addEventListener("dragstart", (e) => {
    if (!list.classList.contains("reordering")) return;
    if (e.target.closest(".btn-remove-desc")) { e.preventDefault(); return; }
    const row = e.target.closest(".capsule-desc-row");
    if (!row) return;
    draggedRow = row;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => { row.classList.add("dragging"); });
  });
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const target = e.target.closest(".capsule-desc-row");
    if (!target || !draggedRow || target === draggedRow) return;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) { list.insertBefore(draggedRow, target); }
    else { list.insertBefore(draggedRow, target.nextSibling); }
  });
  list.addEventListener("dragend", () => {
    if (draggedRow) { draggedRow.classList.remove("dragging"); draggedRow = null; }
  });
  list.addEventListener("touchstart", (e) => {
    if (!list.classList.contains("reordering")) return;
    if (e.target.closest(".btn-remove-desc")) return;
    const row = e.target.closest(".capsule-desc-row");
    if (!row) return;
    draggedRow = row;
    row.classList.add("dragging");
  }, { passive: true });
  list.addEventListener("touchmove", (e) => {
    if (!draggedRow) return;
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".capsule-desc-row");
    if (!target || target === draggedRow) return;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (touch.clientY < midY) { list.insertBefore(draggedRow, target); }
    else { list.insertBefore(draggedRow, target.nextSibling); }
  }, { passive: false });
  list.addEventListener("touchend", () => {
    if (draggedRow) { draggedRow.classList.remove("dragging"); draggedRow = null; }
  });
};

export const runToggleReorderLabels = () => {
  const list = document.getElementById("capsule-descriptions-list");
  const btn = document.getElementById("reorder-labels-btn");
  const addBtn = document.getElementById("add-capsule-description-btn");
  if (!list || !btn) return;
  if (list.querySelector(".add-desc-row")) return;
  const isReordering = list.classList.toggle("reordering");
  btn.textContent = isReordering ? "Done" : "Reorder Labels";
  btn.classList.toggle("btn-reorder-desc-active", isReordering);
  if (addBtn) addBtn.disabled = isReordering;
};

//---

export const runAddWheelItemRow = async () => {
  const list = document.getElementById("wheel-items-list");
  if (!list) return null;
  if (list.querySelector(".add-wheel-item-row")) return null;
  const addBtn = document.getElementById("add-wheel-item-btn");
  if (addBtn) addBtn.disabled = true;
  const row = await buildAddWheelItemRow();
  list.append(row);
  return true;
};

export const runConfirmAddWheelItem = async () => {
  const addRow = document.querySelector("#wheel-items-list .add-wheel-item-row");
  if (!addRow) return null;
  const itemInput = document.getElementById("new-wheel-item");
  const item = itemInput?.value.trim() ?? "";
  const showInlineError = (message) => {
    let errorSpan = addRow.querySelector(".add-wheel-item-error");
    if (!errorSpan) {
      errorSpan = document.createElement("span");
      errorSpan.className = "add-wheel-item-error";
      errorSpan.style.color = "#dc2626";
      errorSpan.style.fontSize = "0.8rem";
      addRow.append(errorSpan);
    }
    errorSpan.textContent = message;
  };
  if (!item) { showInlineError("Item cannot be empty"); return null; }
  if (item.length > 120) { showInlineError("Item must be 120 characters or fewer"); return null; }
  const newRow = await buildWheelItemRow(item);
  addRow.remove();
  const addBtn = document.getElementById("add-wheel-item-btn");
  if (addBtn) addBtn.disabled = false;
  const list = document.getElementById("wheel-items-list");
  if (list) list.append(newRow);
  return true;
};

export const runCancelAddWheelItem = async () => {
  const addRow = document.querySelector("#wheel-items-list .add-wheel-item-row");
  if (addRow) addRow.remove();
  const addBtn = document.getElementById("add-wheel-item-btn");
  if (addBtn) addBtn.disabled = false;
  return true;
};

export const runRemoveWheelItem = async (clickElement) => {
  const row = clickElement.closest(".wheel-item-row");
  if (row) row.remove();
  return true;
};

export const initWheelItemDragSort = () => {
  const list = document.getElementById("wheel-items-list");
  if (!list) return;
  let draggedRow = null;
  list.addEventListener("dragstart", (e) => {
    if (!list.classList.contains("reordering")) return;
    if (e.target.closest(".btn-remove-wheel-item")) { e.preventDefault(); return; }
    const row = e.target.closest(".wheel-item-row");
    if (!row) return;
    draggedRow = row;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => { row.classList.add("dragging"); });
  });
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const target = e.target.closest(".wheel-item-row");
    if (!target || !draggedRow || target === draggedRow) return;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) { list.insertBefore(draggedRow, target); }
    else { list.insertBefore(draggedRow, target.nextSibling); }
  });
  list.addEventListener("dragend", () => {
    if (draggedRow) { draggedRow.classList.remove("dragging"); draggedRow = null; }
  });
  list.addEventListener("touchstart", (e) => {
    if (!list.classList.contains("reordering")) return;
    if (e.target.closest(".btn-remove-wheel-item")) return;
    const row = e.target.closest(".wheel-item-row");
    if (!row) return;
    draggedRow = row;
    row.classList.add("dragging");
  }, { passive: true });
  list.addEventListener("touchmove", (e) => {
    if (!draggedRow) return;
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".wheel-item-row");
    if (!target || target === draggedRow) return;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (touch.clientY < midY) { list.insertBefore(draggedRow, target); }
    else { list.insertBefore(draggedRow, target.nextSibling); }
  }, { passive: false });
  list.addEventListener("touchend", () => {
    if (draggedRow) { draggedRow.classList.remove("dragging"); draggedRow = null; }
  });
};

export const runToggleReorderWheelItems = () => {
  const list = document.getElementById("wheel-items-list");
  const btn = document.getElementById("reorder-wheel-items-btn");
  const addBtn = document.getElementById("add-wheel-item-btn");
  if (!list || !btn) return;
  if (list.querySelector(".add-wheel-item-row")) return;
  const isReordering = list.classList.toggle("reordering");
  btn.textContent = isReordering ? "Done" : "Reorder Items";
  btn.classList.toggle("btn-reorder-wheel-items-active", isReordering);
  if (addBtn) addBtn.disabled = isReordering;
};
