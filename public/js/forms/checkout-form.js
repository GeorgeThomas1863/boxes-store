import { STATES_ARRAY } from "../util/define-things.js";

export const buildCheckoutForm = async () => {
  const checkoutContainer = document.createElement("div");
  checkoutContainer.className = "checkout-container";

  const pageHeader = await buildCheckoutPageHeader();
  const checkoutContent = await buildCheckoutContent();

  checkoutContainer.append(pageHeader, checkoutContent);

  return checkoutContainer;
};

export const buildCheckoutPageHeader = async () => {
  const pageHeader = document.createElement("div");
  pageHeader.className = "checkout-page-header";

  const pageTitle = document.createElement("h1");
  pageTitle.className = "checkout-page-title";
  pageTitle.textContent = "Checkout";

  pageHeader.append(pageTitle);

  return pageHeader;
};

export const buildCheckoutContent = async () => {
  const checkoutContent = document.createElement("div");
  checkoutContent.className = "checkout-content";

  const checkoutFormSection = await buildCheckoutFormSection();
  const checkoutSummarySection = await buildCheckoutSummarySection();

  checkoutContent.append(checkoutFormSection, checkoutSummarySection);

  return checkoutContent;
};

// Left side - Customer information and payment
export const buildCheckoutFormSection = async () => {
  const formSection = document.createElement("div");
  formSection.className = "checkout-form-section";

  const customerInfoCard = await buildCustomerInfoCard();
  const paymentCard = await buildPaymentCard();

  formSection.append(customerInfoCard, paymentCard);

  return formSection;
};

export const buildCustomerInfoCard = async () => {
  const card = document.createElement("div");
  card.className = "checkout-card";

  const cardTitle = document.createElement("h2");
  cardTitle.className = "checkout-card-title";
  cardTitle.textContent = "Customer Information";

  const form = document.createElement("form");
  form.className = "checkout-form";
  form.id = "customer-info-form";

  // Name fields
  const nameRow = document.createElement("div");
  nameRow.className = "checkout-form-row";

  const firstNameField = await buildFormField("First Name", "text", "firstName", "first-name", true);
  const lastNameField = await buildFormField("Last Name", "text", "lastName", "last-name", true);

  nameRow.append(firstNameField, lastNameField);

  // Email
  const emailField = await buildFormField("Email", "email", "email", "email", true);

  // Phone
  const phoneField = await buildFormField("Phone", "tel", "phone", "phone", true);

  // Shipping Address Title
  const shippingTitle = document.createElement("h2");
  shippingTitle.className = "checkout-subsection-title";
  shippingTitle.textContent = "Shipping Address";

  // Address
  const addressField = await buildFormField("Street Address", "text", "address", "address", true);

  // City, State, Zip row
  const locationRow = document.createElement("div");
  locationRow.className = "checkout-form-row checkout-form-row-location";

  const cityField = await buildFormField("City", "text", "city", "city", true);
  const stateField = await buildStateField();
  const zipField = await buildFormField("ZIP Code", "text", "zip", "zip", true);

  locationRow.append(cityField, stateField, zipField);


  form.append(nameRow, emailField, phoneField, shippingTitle, addressField, locationRow);

  card.append(cardTitle, form);

  return card;
};

export const buildPaymentCard = async () => {
  const card = document.createElement("div");
  card.className = "checkout-card";

  const cardTitle = document.createElement("h2");
  cardTitle.className = "checkout-card-title";
  cardTitle.textContent = "Payment Information";

  const paymentContainer = document.createElement("div");
  paymentContainer.className = "checkout-payment-container";
  paymentContainer.id = "payment-container";

  // Create container for Stripe's card input
  const cardInputContainer = document.createElement("div");
  cardInputContainer.id = "card-container";
  cardInputContainer.className = "stripe-card-container";

  // Create container for error messages
  const errorContainer = document.createElement("div");
  errorContainer.id = "payment-error";
  errorContainer.className = "payment-error-message";
  errorContainer.style.display = "none";

  paymentContainer.append(cardInputContainer, errorContainer);

  card.append(cardTitle, paymentContainer);

  return card;
};

// Right side - Order summary
export const buildCheckoutSummarySection = async () => {
  const summarySection = document.createElement("div");
  summarySection.className = "checkout-summary-section";

  const summaryCard = document.createElement("div");
  summaryCard.className = "checkout-summary-card";

  const summaryTitle = document.createElement("h2");
  summaryTitle.className = "checkout-summary-title";
  summaryTitle.textContent = "Order Summary";

  // Order items container
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "checkout-items-container";
  itemsContainer.id = "checkout-items-container";

  // Summary details
  const summaryDetails = document.createElement("div");
  summaryDetails.className = "checkout-summary-details";

  const subtotalRow = await buildSummaryRow("Subtotal:", "$0.00", "checkout-subtotal");
  // const taxRow = await buildSummaryRow("Tax:", "$0.00", "checkout-tax"); // TAX DISABLED
  const spinRow = await buildSummaryRow("Extra Spins:", "$0.00", "checkout-spin-total");
  spinRow.id = "checkout-spin-row";
  spinRow.style.display = "none";
  const shippingRow = await buildSummaryRow("Shipping:", "FREE", "checkout-shipping");

  const totalRow = document.createElement("div");
  totalRow.className = "checkout-summary-row checkout-summary-total";

  const totalLabel = document.createElement("span");
  totalLabel.className = "checkout-summary-label";
  totalLabel.textContent = "Total:";

  const totalValue = document.createElement("span");
  totalValue.className = "checkout-summary-value";
  totalValue.id = "checkout-total";
  totalValue.textContent = "$0.00";

  totalRow.append(totalLabel, totalValue);

  summaryDetails.append(subtotalRow, spinRow, shippingRow, totalRow); // TAX DISABLED: taxRow removed

  // Place order button
  const placeOrderBtn = document.createElement("button");
  placeOrderBtn.className = "checkout-place-order-btn";
  placeOrderBtn.id = "checkout-place-order-btn";
  placeOrderBtn.textContent = "Place Order";
  placeOrderBtn.setAttribute("data-label", "place-order");

  // Back to cart link
  const backToCartLink = document.createElement("a");
  backToCartLink.className = "checkout-back-link";
  backToCartLink.href = "/cart";
  backToCartLink.textContent = "Back to Cart";

  summaryCard.append(summaryTitle, itemsContainer, summaryDetails, placeOrderBtn, backToCartLink);
  summarySection.append(summaryCard);

  return summarySection;
};

// NEW: Build individual shipping option for checkout
export const buildCheckoutShippingOption = async (rateData) => {
  const optionDiv = document.createElement("div");
  optionDiv.className = "checkout-shipping-option";
  optionDiv.setAttribute("data-rate", JSON.stringify(rateData));
  optionDiv.setAttribute("data-label", "checkout-shipping-option-select");

  const radioInput = document.createElement("input");
  radioInput.type = "radio";
  radioInput.name = "checkout-shipping-option";
  radioInput.className = "checkout-shipping-option-radio";
  radioInput.value = rateData.shipping_amount.amount;
  if (rateData.carrier_friendly_name === "Pickup") {
    radioInput.id = "checkout-shipping-local-pickup";
    radioInput.setAttribute("data-is-local-pickup", "true");
  } else {
    radioInput.id = `checkout-shipping-${rateData.rateId}`;
  }

  const contentDiv = document.createElement("div");
  contentDiv.className = "checkout-shipping-option-content";
  contentDiv.setAttribute("data-label", "checkout-shipping-option-select");

  const headerDiv = document.createElement("div");
  headerDiv.className = "checkout-shipping-option-header";
  headerDiv.setAttribute("data-label", "checkout-shipping-option-select");

  const nameSpan = document.createElement("span");
  nameSpan.className = "checkout-shipping-option-name";
  let label;
  if (rateData.carrier_friendly_name === "Pickup") {
    label = rateData.service_type;
  } else {
    label = `${rateData.carrier_friendly_name} - ${rateData.service_type}`;
    if (rateData.package_type && rateData.package_type !== "package") {
      label += ` (${rateData.package_type.replace(/_/g, " ")})`;
    }
  }
  nameSpan.textContent = label;
  nameSpan.setAttribute("data-label", "checkout-shipping-option-select");

  const priceSpan = document.createElement("span");
  priceSpan.className = "checkout-shipping-option-price";
  priceSpan.textContent = `$${rateData.shipping_amount.amount.toFixed(2)}`;
  priceSpan.setAttribute("data-label", "checkout-shipping-option-select");

  headerDiv.append(nameSpan, priceSpan);

  const detailsDiv = document.createElement("div");
  detailsDiv.className = "checkout-shipping-option-details";
  detailsDiv.setAttribute("data-label", "checkout-shipping-option-select");

  if (rateData.delivery_days) {
    const deliverySpan = document.createElement("span");
    deliverySpan.textContent = `${rateData.delivery_days} business days`;
    deliverySpan.setAttribute("data-label", "checkout-shipping-option-select");
    detailsDiv.appendChild(deliverySpan);
  }

  if (rateData.estimated_delivery_date) {
    const dateSpan = document.createElement("span");
    const deliveryDate = new Date(rateData.estimated_delivery_date);
    dateSpan.textContent = `Est. delivery: ${deliveryDate.toLocaleDateString()}`;
    dateSpan.setAttribute("data-label", "checkout-shipping-option-select");
    detailsDiv.appendChild(dateSpan);
  }

  // if (rateData.rate_attributes && rateData.rate_attributes.length > 0) {
  //   const badgesDiv = document.createElement("div");
  //   badgesDiv.className = "checkout-shipping-option-badges";
  //   badgesDiv.setAttribute("data-label", "checkout-shipping-option-select");

  //   for (const attribute of rateData.rate_attributes) {
  //     if (attribute.includes("best_value")) continue;

  //     const badge = document.createElement("span");
  //     badge.className = `checkout-shipping-badge checkout-shipping-badge-${attribute}`;
  //     badge.textContent = attribute.replace("_", " ");
  //     badge.setAttribute("data-label", "checkout-shipping-option-select");
  //     badgesDiv.appendChild(badge);
  //   }

  //   detailsDiv.appendChild(badgesDiv);
  // }

  contentDiv.append(headerDiv, detailsDiv);
  optionDiv.append(radioInput, contentDiv);

  return optionDiv;
};

export const buildSummaryRow = async (label, value, valueId) => {
  const row = document.createElement("div");
  row.className = "checkout-summary-row";

  const labelSpan = document.createElement("span");
  labelSpan.className = "checkout-summary-label";
  labelSpan.textContent = label;

  const valueSpan = document.createElement("span");
  valueSpan.className = "checkout-summary-value";
  valueSpan.id = valueId;
  valueSpan.textContent = value;

  row.append(labelSpan, valueSpan);

  return row;
};

// Build checkout item (simplified version of cart item)
export const buildCheckoutItem = async (itemData) => {
  const checkoutItem = document.createElement("div");
  checkoutItem.className = "checkout-item";

  const itemImage = document.createElement("img");
  itemImage.className = "checkout-item-image";
  const picsArr = Array.isArray(itemData.picData) ? itemData.picData : itemData.picData ? [itemData.picData] : [];
  let pic = null;
  for (let i = 0; i < picsArr.length; i++) {
    if (picsArr[i].mediaType !== "video") {
      pic = picsArr[i];
      break;
    }
  }
  if (!pic) pic = picsArr[0];
  itemImage.src = `/images/products/${pic?.filename || ""}`;
  itemImage.alt = itemData.name;

  const itemDetails = document.createElement("div");
  itemDetails.className = "checkout-item-details";

  const itemName = document.createElement("div");
  itemName.className = "checkout-item-name";
  itemName.textContent = itemData.name;

  const itemQuantity = document.createElement("div");
  itemQuantity.className = "checkout-item-quantity";
  itemQuantity.textContent = `Qty: ${itemData.quantity}`;

  const itemPrice = document.createElement("div");
  itemPrice.className = "checkout-item-price";
  const totalPrice = (itemData.price + (itemData.spinCost || 0)) * itemData.quantity;
  itemPrice.textContent = `$${totalPrice.toFixed(2)}`;

  itemDetails.append(itemName, itemQuantity);

  if ((itemData.spinCost || 0) > 0) {
    const spinNote = document.createElement("div");
    spinNote.className = "checkout-item-spin-note";
    spinNote.textContent = `${itemData.extraSpins} Extra Spins`;
    itemDetails.append(spinNote);
  }

  if (itemData.discount > 0) {
    const discountNote = document.createElement("span");
    discountNote.className = "checkout-item-discount-note";
    discountNote.textContent = `${itemData.discount}% discount`;
    itemDetails.append(discountNote);
  }

  if (itemData.canShip === "no") {
    const badge = document.createElement("span");
    badge.className = "pickup-badge";
    badge.textContent = "Pickup Only";
    itemDetails.append(badge);
  }

  checkoutItem.append(itemImage, itemDetails, itemPrice);

  return checkoutItem;
};

//--------------



export const buildFormField = async (label, type, name, id, required = false) => {
  const field = document.createElement("div");
  field.className = "checkout-form-field";

  const labelElement = document.createElement("label");
  labelElement.className = "checkout-form-label";
  labelElement.textContent = label;
  labelElement.setAttribute("for", id);

  const input = document.createElement("input");
  input.className = "checkout-form-input";
  input.type = type;
  input.name = name;
  input.id = id;
  if (required) {
    input.required = true;
  }

  field.append(labelElement, input);

  return field;
};

export const buildStateField = async () => {
  const field = document.createElement("div");
  field.className = "checkout-form-field";

  const labelElement = document.createElement("label");
  labelElement.className = "checkout-form-label";
  labelElement.textContent = "State";
  labelElement.setAttribute("for", "state");

  const select = document.createElement("select");
  select.className = "checkout-form-input";
  select.name = "state";
  select.id = "state";
  select.required = true;

  // Build options
  for (let i = 0; i < STATES_ARRAY.length; i++) {
    const option = document.createElement("option");
    option.value = STATES_ARRAY[i].value;
    option.textContent = STATES_ARRAY[i].text;
    if (i === 0) {
      option.disabled = true;
      option.selected = true;
    }
    select.append(option);
  }

  field.append(labelElement, select);

  return field;
};
