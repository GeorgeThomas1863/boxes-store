import { buildMainForm, buildNavBar } from "./forms/main-form.js";
import { buildCartForm } from "./forms/cart-form.js";
import { buildCheckoutForm } from "./forms/checkout-form.js";
import { buildAdminForm } from "./forms/admin-form.js";
import { populateCart, updateNavbarCart } from "./run/cart-run.js";
import { populateCheckout } from "./run/checkout-run.js";
import { buildAuthDisplay } from "./auth.js";
import { updateAdminStats } from "./run/admin-run.js";
import { buildConfirmOrderForm, populateConfirmOrder } from "./forms/confirm-form.js";
import { buildAboutForm } from "./forms/about-form.js";
import { buildContactForm } from "./forms/contact-form.js";

const displayElement = document.getElementById("display-element");
const cartElement = document.getElementById("cart-element");
const checkoutElement = document.getElementById("checkout-element");
const confirmElement = document.getElementById("confirm-element");
const authElement = document.getElementById("auth-element");
const adminElement = document.getElementById("admin-element");
const aboutElement = document.getElementById("about-element");
const contactElement = document.getElementById("contact-element");

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

export const buildCheckoutDisplay = async () => {
  if (!checkoutElement) return null;

  const navElement = await buildNavBar();
  const checkoutForm = await buildCheckoutForm();
  checkoutElement.append(navElement, checkoutForm);

  await updateNavbarCart();
  await populateCheckout();

  return true;
};

export const buildAboutDisplay = async () => {
  if (!aboutElement) return null;
  const form = await buildAboutForm();
  aboutElement.append(form);
  await updateNavbarCart();
  return true;
};

export const buildContactDisplay = async () => {
  if (!contactElement) return null;
  const form = await buildContactForm();
  contactElement.append(form);
  await updateNavbarCart();
  return true;
};

export const buildConfirmDisplay = async () => {
  if (!confirmElement) return null;

  const navBar = await buildNavBar();
  const confirmForm = await buildConfirmOrderForm();
  confirmElement.append(navBar, confirmForm);

  populateConfirmOrder();

  return true;
};

if (displayElement) buildMainDisplay();
if (adminElement) buildAdminDisplay();
if (cartElement) buildCartDisplay();
if (checkoutElement) buildCheckoutDisplay();
if (authElement) buildAuthDisplay();
if (confirmElement) buildConfirmDisplay();
if (aboutElement) buildAboutDisplay();
if (contactElement) buildContactDisplay();
