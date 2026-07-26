import { sendToBack } from "../util/api-front.js";
import { buildCheckoutItem } from "../forms/checkout-form.js";
import { initStripePayment, confirmStripePayment } from "../util/stripe-payment.js";
import { showLoadStatus, hideLoadStatus } from "../util/loading.js";
import { displayPopup } from "../util/popup.js";
import { loadCheckoutShippingOptions } from "./shipping-run.js";

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
  const shipping = await loadCheckoutShippingOptions();
  const zipInput = document.getElementById("zip");
  if (zipInput && shipping?.zip) zipInput.value = shipping.zip;
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

export const updateCheckoutSummary = async (taxRate = 0) => { // TAX DISABLED: taxRate param kept for future use
  const subtotalElement = document.getElementById("checkout-subtotal");
  // const taxElement = document.getElementById("checkout-tax"); // TAX DISABLED
  const shippingElement = document.getElementById("checkout-shipping");
  const totalElement = document.getElementById("checkout-total");

  if (!subtotalElement || !shippingElement || !totalElement) return null;

  const [cartData, shippingData] = await Promise.all([
    sendToBack({ route: "/cart/stats" }, "GET"),
    sendToBack({ route: "/shipping/data" }, "GET"),
  ]);
  if (!cartData) {
    console.error("Failed to get cart summary");
    return null;
  }

  const spinTotal = cartData.spinTotal || 0;
  const subtotal = cartData.total - spinTotal;
  const shippingAmount = Number(shippingData?.shipping?.selectedRate?.shipping_amount?.amount);
  const hasShipping = Number.isFinite(shippingAmount);
  // const tax = Math.round(subtotal * parseFloat(taxRate) * 100) / 100; // TAX DISABLED
  // const total = subtotal + tax; // TAX DISABLED
  const total = cartData.total + (hasShipping ? shippingAmount : 0); // TAX DISABLED

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  // if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`; // TAX DISABLED
  shippingElement.textContent = hasShipping ? `$${shippingAmount.toFixed(2)}` : "[Enter ZIP]";
  totalElement.textContent = `$${total.toFixed(2)}`;

  const spinRow = document.getElementById("checkout-spin-row");
  const spinEl = document.getElementById("checkout-spin-total");
  if (spinRow && spinEl) {
    if (spinTotal > 0) {
      spinRow.style.display = "";
      spinEl.textContent = `+$${spinTotal.toFixed(2)}`;
    } else {
      spinRow.style.display = "none";
    }
  }

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
  nursingSpecialty: document.getElementById("nursing-specialty")?.value?.trim() || "",
  productLikes: document.getElementById("product-likes")?.value?.trim() || "",
  productDislikes: document.getElementById("product-dislikes")?.value?.trim() || "",
  tiktokHandle: document.getElementById("tiktok-handle")?.value?.trim() || "",
});

export const runPlaceOrder = async () => {
  const customerForm = document.getElementById("customer-info-form");
  if (!customerForm) return null;

  const fieldMap = [
    { id: "first-name", label: "First Name" },
    { id: "last-name", label: "Last Name" },
    { id: "email", label: "Email" },
    { id: "address", label: "Street Address" },
    { id: "city", label: "City" },
    { id: "state", label: "State" },
    { id: "zip", label: "ZIP Code" },
  ];

  const missing = [];
  for (let i = 0; i < fieldMap.length; i++) {
    if (!document.getElementById(fieldMap[i].id)?.value?.trim()) {
      missing.push(fieldMap[i].label);
    }
  }

  if (missing.length > 0) {
    await displayPopup(`Please fill in the following: ${missing.join(", ")}`, "error");
    return null;
  }

  const zip = document.getElementById("zip")?.value?.trim();
  if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    await displayPopup("Please enter a valid ZIP code (e.g. 12345 or 12345-6789).", "error");
    return null;
  }

  const phone = document.getElementById("phone")?.value?.trim();
  if (phone && (!/^[+\d()\-\s.]+$/.test(phone) || phone.replace(/\D/g, "").length < 7)) {
    await displayPopup("Please enter a valid phone number.", "error");
    return null;
  }

  const email = document.getElementById("email")?.value?.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await displayPopup("Please enter a valid email address.", "error");
    return null;
  }

  const shippingData = await sendToBack({ route: "/shipping/data" }, "GET");
  if (!shippingData?.shipping?.selectedRate) {
    await displayPopup("Please calculate shipping before placing your order", "error");
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
    await hideLoadStatus();
    await displayPopup("Order placed successfully!", "success");
    await new Promise((resolve) => setTimeout(resolve, 1500));
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
