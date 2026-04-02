import { buildMainForm, buildNavBar } from "./forms/main-form.js";
import { buildCartForm } from "./forms/cart-form.js";
import { populateCart, updateNavbarCart } from "./run/cart-run.js";

const displayElement = document.getElementById("display-element");
const cartElement = document.getElementById("cart-element");

export const buildMainDisplay = async () => {
  if (!displayElement) return null;

  const form = await buildMainForm();

  displayElement.append(form);

  await updateNavbarCart();

  return true;
};

export const buildAdminDisplay = async () => {
  if (!adminElement) return null;

  const adminFormData = await buildAdminForm();
  adminElement.append(adminFormData);

  await updateAdminStats();

  return true;
};

export const buildCartDisplay = async () => {
  if (!cartElement) return null;

  const navBar = await buildNavBar();
  const cartForm = await buildCartForm();

  cartElement.append(navBar, cartForm);

  await updateNavbarCart();
  await populateCart();

  return true;
};

if (displayElement) buildMainDisplay();
if (cartElement) buildCartDisplay();
