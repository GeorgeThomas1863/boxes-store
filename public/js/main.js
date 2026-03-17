import { buildMainForm } from "./forms/main-form.js";

const displayElement = document.getElementById("display-element");

export const buildMainDisplay = async () => {
  if (!displayElement) return null;

  const form = await buildMainForm();

  displayElement.append(form);

  return true;
};

buildMainDisplay();
