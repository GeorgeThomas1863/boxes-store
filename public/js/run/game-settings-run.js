import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";
import { getGameSettings, invalidateGameSettingsCache } from "../util/game-settings-cache.js";
import { buildGameSettingsModal, buildAddSpinRow, buildSpinOptionRow, buildCapsuleDescriptionRow, buildAddCapsuleDescriptionRow } from "../forms/game-settings-form.js";

//---

export const runGameSettingsModalTrigger = async () => {
  const adminElement = document.getElementById("admin-element");
  if (!adminElement) return null;

  const existing = document.getElementById("game-settings-modal");
  if (existing) existing.remove();

  const settings = await getGameSettings();
  const modal = await buildGameSettingsModal(settings);
  adminElement.append(modal);
  modal.classList.add("visible");
  initCapsuleDescriptionDragSort();

  return true;
};

//---

export const runSaveGameSettings = async () => {
  const capsuleInput = document.getElementById("game-capsule-count");
  const capsuleCount = parseInt(capsuleInput?.value || 0, 10);

  if (!capsuleInput || capsuleCount < 1) {
    displayPopup("Capsule count must be at least 1", "error");
    return null;
  }

  const spinRows = document.querySelectorAll("#spin-options-list .spin-option-row");
  const spinOptions = [];
  for (let i = 0; i < spinRows.length; i++) {
    const row = spinRows[i];
    const extraSpins = parseInt(row.getAttribute("data-extra-spins") || "0", 10);
    const spinCost = parseFloat(row.getAttribute("data-spin-cost") || "0");
    spinOptions.push({ extraSpins, spinCost });
  }

  const descRows = document.querySelectorAll("#capsule-descriptions-list .capsule-desc-row");
  const capsuleDescriptions = [];
  for (let i = 0; i < descRows.length; i++) {
    capsuleDescriptions.push(descRows[i].getAttribute("data-description"));
  }

  const result = await sendToBack({ route: "/save-game-settings-route", capsuleCount, spinOptions, capsuleDescriptions });

  if (result) {
    invalidateGameSettingsCache();
    displayPopup("Game settings saved!", "success");
    const modal = document.getElementById("game-settings-modal");
    if (modal) modal.remove();
  } else {
    displayPopup("Failed to save settings", "error");
  }

  return result;
};

//---

export const runAddSpinOptionRow = async () => {
  const list = document.getElementById("spin-options-list");
  if (!list) return null;

  if (list.querySelector(".add-spin-row")) return null;

  const addBtn = document.getElementById("add-spin-option-btn");
  if (addBtn) addBtn.disabled = true;

  const row = await buildAddSpinRow();
  list.append(row);

  return true;
};

//---

export const runConfirmAddSpinOption = async () => {
  const addRow = document.querySelector("#spin-options-list .add-spin-row");
  if (!addRow) return null;

  const spinsInput = addRow.querySelector(".spin-input-spins");
  const costInput = addRow.querySelector(".spin-input-cost");

  const extraSpins = parseInt(spinsInput?.value ?? "", 10);
  const spinCost = parseFloat(costInput?.value ?? "");

  const showInlineError = (message) => {
    let errorSpan = addRow.querySelector(".add-spin-error");
    if (!errorSpan) {
      errorSpan = document.createElement("span");
      errorSpan.className = "add-spin-error";
      errorSpan.style.color = "#dc2626";
      errorSpan.style.fontSize = "0.8rem";
      addRow.append(errorSpan);
    }
    errorSpan.textContent = message;
  };

  if (!Number.isInteger(extraSpins) || extraSpins < 0) {
    showInlineError("Extra spins must be a whole number (0 or more)");
    return null;
  }

  if (!Number.isFinite(spinCost) || spinCost < 0) {
    showInlineError("Cost must be a valid number (0 or more)");
    return null;
  }

  const existingRows = document.querySelectorAll("#spin-options-list .spin-option-row");
  for (let i = 0; i < existingRows.length; i++) {
    if (existingRows[i].getAttribute("data-extra-spins") === String(extraSpins)) {
      showInlineError("A spin option with that number of extra spins already exists");
      return null;
    }
  }

  let label = "";
  if (extraSpins === 0 && spinCost === 0) {
    label = "1 Spin (Free!)";
  } else {
    label = `${extraSpins} Extra Spin${extraSpins !== 1 ? "s" : ""}`;
  }

  const opt = { extraSpins, spinCost, label };
  const newRow = await buildSpinOptionRow(opt);

  addRow.remove();

  const addBtn = document.getElementById("add-spin-option-btn");
  if (addBtn) addBtn.disabled = false;

  const spinList = document.getElementById("spin-options-list");
  if (spinList) spinList.append(newRow);

  return true;
};

//---

export const runCancelAddSpinOption = async () => {
  const addRow = document.querySelector("#spin-options-list .add-spin-row");
  if (addRow) addRow.remove();

  const addBtn = document.getElementById("add-spin-option-btn");
  if (addBtn) addBtn.disabled = false;

  return true;
};

//---

export const runRemoveSpinOption = async (clickElement) => {
  const row = clickElement.closest(".spin-option-row");
  if (row) row.remove();

  return true;
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

//---

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

  if (!desc) {
    showInlineError("Label cannot be empty");
    return null;
  }

  if (desc.length > 80) {
    showInlineError("Label must be 80 characters or fewer");
    return null;
  }

  const newRow = await buildCapsuleDescriptionRow(desc);

  addRow.remove();

  const addBtn = document.getElementById("add-capsule-description-btn");
  if (addBtn) addBtn.disabled = false;

  const list = document.getElementById("capsule-descriptions-list");
  if (list) list.append(newRow);

  return true;
};

//---

export const runCancelAddCapsuleDescription = async () => {
  const addRow = document.querySelector("#capsule-descriptions-list .add-desc-row");
  if (addRow) addRow.remove();

  const addBtn = document.getElementById("add-capsule-description-btn");
  if (addBtn) addBtn.disabled = false;

  return true;
};

//---

export const runRemoveCapsuleDescription = async (clickElement) => {
  const row = clickElement.closest(".capsule-desc-row");
  if (row) row.remove();

  return true;
};

//---

export const initCapsuleDescriptionDragSort = () => {
  const list = document.getElementById("capsule-descriptions-list");
  if (!list) return;

  let draggedRow = null;

  list.addEventListener("dragstart", (e) => {
    if (e.target.closest(".btn-remove-desc")) {
      e.preventDefault();
      return;
    }
    const row = e.target.closest(".capsule-desc-row");
    if (!row) return;
    draggedRow = row;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => {
      row.classList.add("dragging");
    });
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const target = e.target.closest(".capsule-desc-row");
    if (!target || !draggedRow || target === draggedRow) return;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      list.insertBefore(draggedRow, target);
    } else {
      list.insertBefore(draggedRow, target.nextSibling);
    }
  });

  list.addEventListener("dragend", () => {
    if (draggedRow) {
      draggedRow.classList.remove("dragging");
      draggedRow = null;
    }
  });
};
