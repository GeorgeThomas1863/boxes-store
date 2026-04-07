/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock all external dependencies before importing the module under test
// ---------------------------------------------------------------------------

vi.mock("../../../public/js/util/api-front.js", () => ({
  sendToBack: vi.fn(),
  sendToBackFile: vi.fn(),
}));

vi.mock("../../../public/js/util/popup.js", () => ({
  displayPopup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../public/js/forms/admin-form.js", () => ({
  buildPicSlot: vi.fn((index, entityType) => buildRealSlot(entityType)),
}));

import { sendToBack, sendToBackFile } from "../../../public/js/util/api-front.js";
import { displayPopup } from "../../../public/js/util/popup.js";
import {
  runSlotUploadPic,
  runDeleteSlotImage,
  runRemovePicSlot,
} from "../../../public/js/run/upload-pic.js";

// ---------------------------------------------------------------------------
// DOM helper — mirrors buildPicSlot from admin-form.js exactly
// ---------------------------------------------------------------------------

function buildRealSlot(entityType = "products") {
  const slot = document.createElement("div");
  slot.className = "pic-slot";

  const imageDisplay = document.createElement("div");
  imageDisplay.className = "image-display";

  const imagePlaceholder = document.createElement("div");
  imagePlaceholder.className = "image-placeholder";
  imagePlaceholder.textContent = "placeholder";

  const currentImage = document.createElement("img");
  currentImage.className = "current-image hidden";
  currentImage.alt = "Product image";

  const currentVideo = document.createElement("video");
  currentVideo.className = "current-video hidden";

  const deleteImageBtn = document.createElement("button");
  deleteImageBtn.type = "button";
  deleteImageBtn.className = "delete-image-btn hidden";
  deleteImageBtn.setAttribute("data-label", "delete-slot-image");

  imageDisplay.append(imagePlaceholder, currentImage, currentVideo, deleteImageBtn);

  const picInput = document.createElement("input");
  picInput.type = "file";
  picInput.className = "pic-file-input hidden";

  const actionsRow = document.createElement("div");
  actionsRow.className = "slot-image-actions";

  const uploadBtn = document.createElement("button");
  uploadBtn.type = "button";
  uploadBtn.className = "upload-btn";
  uploadBtn.textContent = "Choose File";
  uploadBtn.entityType = entityType;
  uploadBtn.uploadData = null;

  actionsRow.append(uploadBtn);

  const uploadStatus = document.createElement("span");
  uploadStatus.className = "upload-status hidden";

  const removeSlotBtn = document.createElement("button");
  removeSlotBtn.type = "button";
  removeSlotBtn.className = "remove-slot-btn";

  slot.append(imageDisplay, picInput, actionsRow, uploadStatus, removeSlotBtn);

  // Attach slot to document so closest() works
  document.body.appendChild(slot);

  return slot;
}

// Helper: create a fake File object for file input mocking
function fakeFile(name = "photo.jpg") {
  return new File(["data"], name, { type: "image/jpeg" });
}

// Helper: attach a fake file to a file input (files list is read-only, override with defineProperty)
function attachFile(input, file) {
  Object.defineProperty(input, "files", {
    value: file ? [file] : [],
    configurable: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// runSlotUploadPic
// ---------------------------------------------------------------------------

describe("runSlotUploadPic", () => {
  it("returns null when fileInput has no file selected", async () => {
    const slot = buildRealSlot();
    const fileInput = slot.querySelector(".pic-file-input");
    attachFile(fileInput, null);

    const result = await runSlotUploadPic(fileInput);
    expect(result).toBeNull();
    expect(sendToBackFile).not.toHaveBeenCalled();
  });

  it("sets uploadData, updates image src and status on successful upload", async () => {
    const slot = buildRealSlot();
    const fileInput = slot.querySelector(".pic-file-input");
    const uploadBtn = slot.querySelector(".upload-btn");
    const uploadStatus = slot.querySelector(".upload-status");
    const currentImage = slot.querySelector(".current-image");

    const file = fakeFile("photo.jpg");
    attachFile(fileInput, file);

    sendToBackFile.mockResolvedValue({ filename: "new.jpg", path: "/images/products/new.jpg" });

    const result = await runSlotUploadPic(fileInput);

    expect(result).not.toBeNull();
    expect(uploadBtn.uploadData).toMatchObject({ filename: "new.jpg" });
    expect(currentImage.src).toContain("new.jpg");
    expect(uploadStatus.textContent).toContain("photo.jpg");
    expect(sendToBack).not.toHaveBeenCalled(); // no previous file to delete
  });

  it("shows error status, nulls uploadData and re-enables button on upload failure", async () => {
    const slot = buildRealSlot();
    const fileInput = slot.querySelector(".pic-file-input");
    const uploadBtn = slot.querySelector(".upload-btn");
    const uploadStatus = slot.querySelector(".upload-status");

    const file = fakeFile("photo.jpg");
    attachFile(fileInput, file);

    sendToBackFile.mockResolvedValue("FAIL");

    const result = await runSlotUploadPic(fileInput);

    expect(result).toBeNull();
    expect(uploadBtn.uploadData).toBeNull();
    expect(uploadBtn.disabled).toBe(false);
    expect(uploadStatus.textContent).toMatch(/fail/i);
  });

  it("deletes old file when replacing with a new file with a different filename", async () => {
    const slot = buildRealSlot();
    const fileInput = slot.querySelector(".pic-file-input");
    const uploadBtn = slot.querySelector(".upload-btn");

    // Pre-set previous upload data
    uploadBtn.uploadData = { filename: "old.jpg", originalFilename: "old.jpg" };

    const file = fakeFile("new-photo.jpg");
    attachFile(fileInput, file);

    sendToBackFile.mockResolvedValue({ filename: "new.jpg", path: "/images/products/new.jpg" });
    sendToBack.mockResolvedValue({ success: true });

    await runSlotUploadPic(fileInput);

    expect(sendToBack).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "old.jpg" })
    );
  });

  it("does NOT delete when new filename equals the previous filename", async () => {
    const slot = buildRealSlot();
    const fileInput = slot.querySelector(".pic-file-input");
    const uploadBtn = slot.querySelector(".upload-btn");

    uploadBtn.uploadData = { filename: "same.jpg", originalFilename: "same.jpg" };

    const file = fakeFile("same.jpg");
    attachFile(fileInput, file);

    sendToBackFile.mockResolvedValue({ filename: "same.jpg", path: "/images/products/same.jpg" });

    await runSlotUploadPic(fileInput);

    // sendToBack should NOT be called for deletion of the old file
    expect(sendToBack).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// runDeleteSlotImage
// ---------------------------------------------------------------------------

describe("runDeleteSlotImage", () => {
  it("resets UI without calling sendToBack when uploadData is null", async () => {
    const slot = buildRealSlot();
    const deleteImageBtn = slot.querySelector(".delete-image-btn");
    const uploadBtn = slot.querySelector(".upload-btn");
    const imagePlaceholder = slot.querySelector(".image-placeholder");
    const currentImage = slot.querySelector(".current-image");

    uploadBtn.uploadData = null;

    await runDeleteSlotImage(deleteImageBtn);

    expect(sendToBack).not.toHaveBeenCalled();
    expect(imagePlaceholder.classList.contains("hidden")).toBe(false);
    expect(currentImage.classList.contains("hidden")).toBe(true);
  });

  it("calls sendToBack twice when filename and originalFilename differ", async () => {
    const slot = buildRealSlot();
    const deleteImageBtn = slot.querySelector(".delete-image-btn");
    const uploadBtn = slot.querySelector(".upload-btn");

    uploadBtn.uploadData = { filename: "current.jpg", originalFilename: "original.jpg" };

    sendToBack.mockResolvedValue({ success: true });

    await runDeleteSlotImage(deleteImageBtn);

    expect(sendToBack).toHaveBeenCalledTimes(2);
    const calledFilenames = sendToBack.mock.calls.map((call) => call[0].filename);
    expect(calledFilenames).toContain("current.jpg");
    expect(calledFilenames).toContain("original.jpg");
  });

  it("calls sendToBack only once when filename equals originalFilename", async () => {
    const slot = buildRealSlot();
    const deleteImageBtn = slot.querySelector(".delete-image-btn");
    const uploadBtn = slot.querySelector(".upload-btn");

    uploadBtn.uploadData = { filename: "same.jpg", originalFilename: "same.jpg" };

    sendToBack.mockResolvedValue({ success: true });

    await runDeleteSlotImage(deleteImageBtn);

    // First sendToBack for filename, second condition (originalFilename !== filename) is false
    expect(sendToBack).toHaveBeenCalledTimes(1);
    expect(sendToBack).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "same.jpg" })
    );
  });
});

// ---------------------------------------------------------------------------
// runRemovePicSlot
// ---------------------------------------------------------------------------

describe("runRemovePicSlot", () => {
  it("removes the slot from DOM without calling sendToBack when uploadData is null", async () => {
    const slot = buildRealSlot();
    const removeBtn = slot.querySelector(".remove-slot-btn");
    const uploadBtn = slot.querySelector(".upload-btn");

    uploadBtn.uploadData = null;

    expect(document.body.contains(slot)).toBe(true);

    await runRemovePicSlot(removeBtn);

    expect(sendToBack).not.toHaveBeenCalled();
    expect(document.body.contains(slot)).toBe(false);
  });

  it("calls sendToBack with filename and removes slot when uploadData has a filename", async () => {
    const slot = buildRealSlot();
    const removeBtn = slot.querySelector(".remove-slot-btn");
    const uploadBtn = slot.querySelector(".upload-btn");

    uploadBtn.uploadData = { filename: "photo.jpg", originalFilename: "photo.jpg" };

    sendToBack.mockResolvedValue({ success: true });

    await runRemovePicSlot(removeBtn);

    expect(sendToBack).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "photo.jpg" })
    );
    expect(document.body.contains(slot)).toBe(false);
  });

  it("calls sendToBack twice and removes slot when filename and originalFilename differ", async () => {
    const slot = buildRealSlot();
    const removeBtn = slot.querySelector(".remove-slot-btn");
    const uploadBtn = slot.querySelector(".upload-btn");

    uploadBtn.uploadData = { filename: "current.jpg", originalFilename: "original.jpg" };

    sendToBack.mockResolvedValue({ success: true });

    await runRemovePicSlot(removeBtn);

    expect(sendToBack).toHaveBeenCalledTimes(2);
    expect(document.body.contains(slot)).toBe(false);
  });
});
