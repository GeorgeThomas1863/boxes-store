import { sendToBack } from "../util/api-front.js";
import { buildCheckoutItem } from "../forms/checkout-form.js";
import { initStripePayment, confirmStripePayment } from "../util/stripe-payment.js";
import { showLoadStatus, hideLoadStatus } from "../util/loading.js";

export const populateCheckout = async () => {
  const [cartData, config] = await Promise.all([
    sendToBack({ route: "/cart/data" }, "GET"),
    sendToBack({ route: "/config/stripe" }, "GET"),
  ]);

  if (!cartData || !cartData.cart || cartData.cart.length === 0) {
    window.location.href = "/cart";
    return null;
  }

  await displayCheckoutItems(cartData.cart);
  await updateCheckoutSummary(config?.taxRate || 0);

  if (!config?.publishableKey) {
    const errorContainer = document.getElementById("payment-error");
    if (errorContainer) {
      errorContainer.textContent = "Payment is currently unavailable. Please try again later or contact support.";
      errorContainer.style.display = "block";
    }
    return null;
  }

  await initStripePayment(config.publishableKey);

  return true;
};

export const displayCheckoutItems = async (cartItems) => {
  const checkoutItemsContainer = document.getElementById("checkout-items-container");
  if (!checkoutItemsContainer) {
    console.error("Checkout items container not found");
    return null;
  }

  checkoutItemsContainer.replaceChildren();

  for (let i = 0; i < cartItems.length; i++) {
    const checkoutItem = await buildCheckoutItem(cartItems[i]);
    checkoutItemsContainer.append(checkoutItem);
  }

  return true;
};

export const updateCheckoutSummary = async (taxRate = 0) => {
  const subtotalElement = document.getElementById("checkout-subtotal");
  const taxElement = document.getElementById("checkout-tax");
  const shippingElement = document.getElementById("checkout-shipping");
  const totalElement = document.getElementById("checkout-total");

  if (!subtotalElement || !shippingElement || !totalElement) return null;

  const cartData = await sendToBack({ route: "/cart/stats" }, "GET");
  if (!cartData) {
    console.error("Failed to get cart summary");
    return null;
  }

  const subtotal = cartData.total;
  const tax = Math.round(subtotal * parseFloat(taxRate) * 100) / 100;
  const total = subtotal + tax;

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
  shippingElement.textContent = "FREE";
  totalElement.textContent = `$${total.toFixed(2)}`;

  return true;
};

const getCustomerParams = () => ({
  firstName: document.getElementById("first-name")?.value?.trim() || "",
  lastName: document.getElementById("last-name")?.value?.trim() || "",
  email: document.getElementById("email")?.value?.trim() || "",
  phone: document.getElementById("phone")?.value?.trim() || "",
  address: document.getElementById("address")?.value?.trim() || "",
  city: document.getElementById("city")?.value?.trim() || "",
  state: document.getElementById("state")?.value || "",
  zip: document.getElementById("zip")?.value?.trim() || "",
});

export const runPlaceOrder = async () => {
  const customerForm = document.getElementById("customer-info-form");
  if (!customerForm || !customerForm.checkValidity()) {
    if (customerForm) customerForm.reportValidity();
    return null;
  }

  const placeOrderBtn = document.getElementById("checkout-place-order-btn");
  const errorContainer = document.getElementById("payment-error");

  if (placeOrderBtn) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Processing...";
  }
  if (errorContainer) {
    errorContainer.textContent = "";
    errorContainer.style.display = "none";
  }

  await showLoadStatus();

  try {
    const intentData = await sendToBack({ route: "/checkout/create-payment-intent" });

    if (!intentData || !intentData.clientSecret) {
      await hideLoadStatus();
      showPaymentError(errorContainer, "Failed to initialize payment. Please try again.");
      resetPlaceOrderBtn(placeOrderBtn);
      return null;
    }

    const customerParams = getCustomerParams();

    const billingDetails = {
      name: `${customerParams.firstName} ${customerParams.lastName}`,
      email: customerParams.email,
      phone: customerParams.phone,
      address: {
        line1: customerParams.address,
        city: customerParams.city,
        state: customerParams.state,
        postal_code: customerParams.zip,
        country: "US",
      },
    };

    const confirmResult = await confirmStripePayment(intentData.clientSecret, billingDetails);

    if (!confirmResult || !confirmResult.success) {
      await hideLoadStatus();
      showPaymentError(errorContainer, confirmResult?.message || "Payment failed. Please check your card details.");
      resetPlaceOrderBtn(placeOrderBtn);
      return null;
    }

    const orderPayload = {
      route: "/checkout/place-order",
      paymentIntentId: confirmResult.paymentIntentId,
      ...customerParams,
    };

    const orderData = await sendToBack(orderPayload);

    if (!orderData || !orderData.success) {
      await hideLoadStatus();
      showPaymentError(errorContainer, orderData?.message || "Order processing failed. Please contact support.");
      resetPlaceOrderBtn(placeOrderBtn);
      return null;
    }

    sessionStorage.setItem("orderData", JSON.stringify(orderData));
    window.location.href = "/confirm-order";
  } catch (e) {
    console.error("Error processing order:", e);
    await hideLoadStatus();
    showPaymentError(errorContainer, "An unexpected error occurred. Please try again.");
    resetPlaceOrderBtn(placeOrderBtn);
    return null;
  }

  return true;
};

const showPaymentError = (errorContainer, message) => {
  if (!errorContainer) return;
  errorContainer.textContent = message;
  errorContainer.style.display = "block";
};

const resetPlaceOrderBtn = (btn) => {
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = "Place Order";
};
