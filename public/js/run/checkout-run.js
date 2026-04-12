import { sendToBack } from "../util/api-front.js";
import { buildCheckoutItem } from "../forms/checkout-form.js";

export const populateCheckout = async () => {
  const data = await sendToBack({ route: "/cart/data" }, "GET");

  if (!data || !data.cart) {
    window.location.href = "/cart";
    return null;
  }

  if (data.cart.length === 0) {
    window.location.href = "/cart";
    return null;
  }

  await displayCheckoutItems(data.cart);
  await updateCheckoutSummary();

  return true;
};

export const displayCheckoutItems = async (cartItems) => {
  const checkoutItemsContainer = document.getElementById("checkout-items-container");

  if (!checkoutItemsContainer) {
    console.error("Checkout items container not found");
    return null;
  }

  checkoutItemsContainer.innerHTML = "";

  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    const checkoutItem = await buildCheckoutItem(item);
    checkoutItemsContainer.append(checkoutItem);
  }

  return true;
};

export const updateCheckoutSummary = async () => {
  const subtotalElement = document.getElementById("checkout-subtotal");
  const shippingElement = document.getElementById("checkout-shipping");
  const totalElement = document.getElementById("checkout-total");

  if (!subtotalElement || !shippingElement || !totalElement) return null;

  const cartData = await sendToBack({ route: "/cart/stats" }, "GET");

  if (!cartData) {
    console.error("Failed to get cart summary");
    return null;
  }

  const { total } = cartData;

  subtotalElement.textContent = `$${total.toFixed(2)}`;
  shippingElement.textContent = "FREE";

  const finalTotal = total;
  totalElement.textContent = `$${finalTotal.toFixed(2)}`;

  return true;
};
