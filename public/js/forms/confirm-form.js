export const buildConfirmOrderForm = async () => {
  const container = document.createElement("div");
  container.className = "confirm-order-container";
  container.append(buildConfirmHeader(), buildConfirmContent());
  return container;
};

const buildConfirmHeader = () => {
  const header = document.createElement("div");
  header.className = "confirm-header";

  const icon = document.createElement("div");
  icon.className = "confirm-success-icon";
  icon.textContent = "\u2713";

  const title = document.createElement("h1");
  title.className = "confirm-title";
  title.textContent = "Order Confirmed";

  const subtitle = document.createElement("p");
  subtitle.className = "confirm-subtitle";
  subtitle.textContent = "Thank you for your purchase!";

  header.append(icon, title, subtitle);
  return header;
};

const buildConfirmContent = () => {
  const content = document.createElement("div");
  content.className = "confirm-content";
  content.append(buildDetailsCard(), buildItemsCard(), buildActions());
  return content;
};

const buildDetailsCard = () => {
  const card = document.createElement("div");
  card.className = "confirm-card";

  const title = document.createElement("h2");
  title.className = "confirm-card-title";
  title.textContent = "Order Details";

  const grid = document.createElement("div");
  grid.className = "confirm-details-grid";
  grid.append(
    buildDetailRow("Order Number", "confirm-order-number"),
    buildDetailRow("Order Date", "confirm-order-date"),
    buildDetailRow("Payment Status", "confirm-payment-status"),
    buildDetailRow("Email", "confirm-customer-email")
  );

  const shippingTitle = document.createElement("h2");
  shippingTitle.className = "confirm-subsection-title";
  shippingTitle.textContent = "Shipping Address";

  const shippingAddress = document.createElement("div");
  shippingAddress.className = "confirm-address";
  shippingAddress.id = "confirm-shipping-address";

  card.append(title, grid, shippingTitle, shippingAddress);
  return card;
};

const buildItemsCard = () => {
  const card = document.createElement("div");
  card.className = "confirm-card";

  const title = document.createElement("h2");
  title.className = "confirm-card-title";
  title.textContent = "Order Summary";

  const itemsContainer = document.createElement("div");
  itemsContainer.className = "confirm-items-container";
  itemsContainer.id = "confirm-items-container";

  const summaryDetails = document.createElement("div");
  summaryDetails.className = "confirm-summary-details";
  summaryDetails.append(
    buildSummaryRow("Subtotal:", "confirm-subtotal"),
    // buildSummaryRow("Tax:", "confirm-tax"), // TAX DISABLED
    buildSummaryRow("Shipping:", "confirm-shipping"),
    buildTotalRow()
  );

  card.append(title, itemsContainer, summaryDetails);
  return card;
};

const buildActions = () => {
  const section = document.createElement("div");
  section.className = "confirm-actions-section";

  const btn = document.createElement("a");
  btn.className = "confirm-action-btn";
  btn.href = "/";
  btn.textContent = "Continue Shopping";

  section.append(btn);
  return section;
};

const buildDetailRow = (label, valueId) => {
  const row = document.createElement("div");
  row.className = "confirm-detail-row";

  const labelEl = document.createElement("span");
  labelEl.className = "confirm-detail-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "confirm-detail-value";
  valueEl.id = valueId;
  valueEl.textContent = "\u2014";

  row.append(labelEl, valueEl);
  return row;
};

const buildSummaryRow = (label, valueId) => {
  const row = document.createElement("div");
  row.className = "confirm-summary-row";

  const labelEl = document.createElement("span");
  labelEl.className = "confirm-summary-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "confirm-summary-value";
  valueEl.id = valueId;
  valueEl.textContent = "$0.00";

  row.append(labelEl, valueEl);
  return row;
};

const buildTotalRow = () => {
  const row = document.createElement("div");
  row.className = "confirm-summary-row confirm-summary-total";

  const label = document.createElement("span");
  label.className = "confirm-summary-label";
  label.textContent = "Total:";

  const value = document.createElement("span");
  value.className = "confirm-summary-value";
  value.id = "confirm-total";
  value.textContent = "$0.00";

  row.append(label, value);
  return row;
};

export const buildConfirmItem = (itemData) => {
  const item = document.createElement("div");
  item.className = "confirm-item";

  const img = document.createElement("img");
  img.className = "confirm-item-image";
  const picsArr = Array.isArray(itemData.picData) ? itemData.picData : itemData.picData ? [itemData.picData] : [];
  const pic = picsArr.find((p) => p.mediaType !== "video") || picsArr[0];
  img.src = pic ? `/images/products/${pic.filename || ""}` : "";
  img.alt = itemData.name || "";

  const details = document.createElement("div");
  details.className = "confirm-item-details";

  const name = document.createElement("div");
  name.className = "confirm-item-name";
  name.textContent = itemData.name;

  const qty = document.createElement("div");
  qty.className = "confirm-item-quantity";
  qty.textContent = `Qty: ${itemData.quantity}`;

  details.append(name, qty);

  const price = document.createElement("div");
  price.className = "confirm-item-price";
  price.textContent = `$${(itemData.price * itemData.quantity).toFixed(2)}`;

  item.append(img, details, price);
  return item;
};

export const populateConfirmOrder = () => {
  const orderDataStr = sessionStorage.getItem("orderData");
  if (!orderDataStr) {
    window.location.href = "/";
    return null;
  }

  let orderData;
  try {
    orderData = JSON.parse(orderDataStr);
  } catch (e) {
    console.error("Failed to parse order data:", e);
    const container = document.getElementById("confirm-items-container");
    if (container) {
      container.textContent = "Your order was placed successfully. Please check your email for confirmation, or contact support if you need order details.";
    }
    return null;
  }
  sessionStorage.removeItem("orderData");

  populateOrderDetails(orderData.data);
  populateOrderItems(orderData.data);

  return true;
};

const populateOrderDetails = (data) => {
  if (!data) return null;

  const { orderNumber, orderDate, email, firstName, lastName, address, city, state, zip, subtotal, tax, shippingCost, totalCost } = data;

  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  set("confirm-order-number", orderNumber || "N/A");
  set("confirm-order-date", new Date(orderDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  }));
  set("confirm-customer-email", email);
  set("confirm-subtotal", `$${Number(subtotal).toFixed(2)}`);
  // set("confirm-tax", `$${Number(tax).toFixed(2)}`); // TAX DISABLED
  set("confirm-shipping", "FREE");
  set("confirm-total", `$${Number(totalCost).toFixed(2)}`);

  const paymentStatusEl = document.getElementById("confirm-payment-status");
  if (paymentStatusEl) {
    paymentStatusEl.textContent = "Completed";
    paymentStatusEl.style.color = "#22c55e";
    paymentStatusEl.style.fontWeight = "500";
  }

  const shippingAddressEl = document.getElementById("confirm-shipping-address");
  if (shippingAddressEl) {
    shippingAddressEl.replaceChildren();
    [`${firstName} ${lastName}`, address, `${city}, ${state} ${zip}`].forEach((line, i) => {
      if (i > 0) shippingAddressEl.appendChild(document.createElement("br"));
      shippingAddressEl.appendChild(document.createTextNode(line));
    });
  }

  return true;
};

const populateOrderItems = (data) => {
  if (!data || !data.cartData) return null;
  const itemsContainer = document.getElementById("confirm-items-container");
  if (!itemsContainer) return null;

  itemsContainer.replaceChildren();
  for (let i = 0; i < data.cartData.length; i++) {
    itemsContainer.append(buildConfirmItem(data.cartData[i]));
  }
  return true;
};
