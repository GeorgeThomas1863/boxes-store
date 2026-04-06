import { sendToBack, sendToBackFile } from "../util/api-front.js";
import { buildPicSlot } from "../forms/admin-form.js";
import { displayPopup } from "../util/popup.js";

export const runSlotUploadClick = async (uploadBtn) => {
  if (!uploadBtn) return null;
  const slot = uploadBtn.closest(".pic-slot");
  if (!slot) return null;
  const fileInput = slot.querySelector(".pic-file-input");
  if (!fileInput) return null;
  fileInput.click();
};

export const runSlotUploadPic = async (fileInput) => {
  if (!fileInput) return null;
  const pic = fileInput.files[0];
  if (!pic) return null;

  const slot = fileInput.closest(".pic-slot");
  if (!slot) return null;

  const uploadBtn = slot.querySelector(".upload-btn");
  const uploadStatus = slot.querySelector(".upload-status");
  const currentImage = slot.querySelector(".current-image");
  const currentVideo = slot.querySelector(".current-video");
  const imagePlaceholder = slot.querySelector(".image-placeholder");
  const deleteImageBtn = slot.querySelector(".delete-image-btn");

  if (!uploadBtn || !uploadStatus) return null;

  // Capture the previous filename before overwriting — needed to delete the old file
  const previousFilename = uploadBtn.uploadData?.filename;
  const entityType = uploadBtn.entityType || "products";

  uploadBtn.uploadData = null;
  uploadStatus.textContent = "Uploading...";
  uploadStatus.classList.remove("hidden");
  uploadBtn.disabled = true;

  const formData = new FormData();
  formData.append("image", pic);

  const data = await sendToBackFile({ route: "/upload-product-pic-route", formData: formData });

  if (data === "FAIL" || !data) {
    uploadStatus.textContent = "✗ Upload failed";
    uploadStatus.style.color = "red";
    uploadBtn.uploadData = null;
    uploadBtn.disabled = false;
    return null;
  }

  uploadStatus.textContent = `✓ ${pic.name}`;
  uploadStatus.style.color = "green";
  uploadBtn.textContent = "Change File";
  uploadBtn.disabled = false;
  data.originalFilename = data.filename;
  uploadBtn.uploadData = data;

  // Delete the old file after a successful replacement — fire-and-forget, UI is already updated
  if (previousFilename && previousFilename !== data.filename) {
    sendToBack({ route: "/delete-pic-route", filename: previousFilename, entityType });
  }

  if (currentImage && data.filename) {
    currentImage.src = `/images/products/${data.filename}`;
    currentImage.classList.remove("hidden");
    if (currentVideo) currentVideo.classList.add("hidden");
    if (imagePlaceholder) imagePlaceholder.classList.add("hidden");
    if (deleteImageBtn) deleteImageBtn.classList.remove("hidden");
  }

  return data;
};

export const runDeleteSlotImage = async (deleteBtn) => {
  if (!deleteBtn) return null;

  const slot = deleteBtn.closest(".pic-slot");
  if (!slot) return null;

  const uploadBtn = slot.querySelector(".upload-btn");
  const uploadStatus = slot.querySelector(".upload-status");
  const currentImage = slot.querySelector(".current-image");
  const currentVideo = slot.querySelector(".current-video");
  const imagePlaceholder = slot.querySelector(".image-placeholder");
  const fileInput = slot.querySelector(".pic-file-input");

  const entityType = uploadBtn?.entityType || "products";
  const filename = uploadBtn?.uploadData?.filename;
  const originalFilename = uploadBtn?.uploadData?.originalFilename;

  if (filename) {
    const deleteResult = await sendToBack({ route: "/delete-pic-route", filename, entityType });
    if (!deleteResult || deleteResult === "FAIL") {
      await displayPopup("Image removed from form but file deletion failed", "error");
    }
  }
  if (originalFilename && originalFilename !== filename) {
    await sendToBack({ route: "/delete-pic-route", filename: originalFilename, entityType });
  }

  if (uploadBtn) {
    uploadBtn.uploadData = null;
    uploadBtn.textContent = "Choose File";
  }
  if (uploadStatus) {
    uploadStatus.textContent = "";
    uploadStatus.classList.add("hidden");
  }
  if (currentImage) {
    currentImage.src = "";
    currentImage.classList.add("hidden");
  }
  if (currentVideo) {
    currentVideo.src = "";
    currentVideo.classList.add("hidden");
  }
  if (imagePlaceholder) imagePlaceholder.classList.remove("hidden");
  deleteBtn.classList.add("hidden");
  if (fileInput) fileInput.value = "";
};

export const runAddPicSlot = async () => {
  const container = document.querySelector(".pic-slots-container");
  if (!container) return null;

  const existingSlots = container.querySelectorAll(".pic-slot");
  const lastSlot = existingSlots[existingSlots.length - 1];
  const lastHasImage = !!(lastSlot && lastSlot.querySelector(".upload-btn")?.uploadData);

  const existingUploadBtn = container.querySelector(".upload-btn");
  const entityType = existingUploadBtn?.entityType || "products";

  const index = container.children.length;
  const slot = buildPicSlot(index, entityType);
  container.append(slot);

  if (lastHasImage) {
    slot.querySelector(".pic-file-input").click();
  }
};

export const runRemovePicSlot = async (removeBtn) => {
  if (!removeBtn) return null;
  const slot = removeBtn.closest(".pic-slot");
  if (!slot) return null;

  const uploadBtn = slot.querySelector(".upload-btn");
  const entityType = uploadBtn?.entityType || "products";
  const filename = uploadBtn?.uploadData?.filename;
  const originalFilename = uploadBtn?.uploadData?.originalFilename;

  if (filename) {
    const deleteResult = await sendToBack({ route: "/delete-pic-route", filename, entityType });
    if (!deleteResult || deleteResult === "FAIL") {
      await displayPopup("Slot removed but file deletion failed", "error");
    }
  }
  if (originalFilename && originalFilename !== filename) {
    await sendToBack({ route: "/delete-pic-route", filename: originalFilename, entityType });
  }

  slot.remove();
};
