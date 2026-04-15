// Build the loading overlay (replaces buildLoadStatusMessage)
export const buildLoadingOverlay = async () => {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "loading-overlay";
  loadingOverlay.className = "loading-overlay";

  const loadingContent = document.createElement("div");
  loadingContent.className = "loading-content";

  const spinner = document.createElement("div");
  spinner.className = "spinner";

  const loadingText = document.createElement("div");
  loadingText.className = "loading-text";
  loadingText.textContent = "Processing Your Order!";

  loadingContent.append(spinner, loadingText);
  loadingOverlay.append(loadingContent);

  return loadingOverlay;
};

// Show loading overlay
export const showLoadStatus = async () => {
  console.log("SHOWING LOAD STATUS");

  let loadingOverlay = document.getElementById("loading-overlay");

  if (!loadingOverlay) {
    loadingOverlay = await buildLoadingOverlay();
    document.body.append(loadingOverlay);
  }

  loadingOverlay.classList.add("active");
  return true;
};

// Hide loading overlay
export const hideLoadStatus = async () => {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (!loadingOverlay) return;

  loadingOverlay.classList.remove("active");
  return true;
};
