/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";

import { buildConfirmOrderForm, populateConfirmOrder } from "../../public/js/forms/confirm-form.js";

const sampleOrder = {
  success: true,
  data: {
    orderNumber: 1042,
    orderDate: "2026-09-09T12:00:00.000Z",
    email: "buyer@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    address: "1 Main St",
    city: "Washington",
    state: "DC",
    zip: "20001",
    subtotal: 10,
    tax: 0,
    shippingCost: 5,
    shippingDetails: null,
    totalCost: 15,
    cartData: [],
  },
};

beforeEach(async () => {
  sessionStorage.clear();
  document.body.innerHTML = "";
  document.body.append(await buildConfirmOrderForm());
});

describe("confirm order — order number", () => {
  it("renders an Order Number row in the details card", () => {
    const el = document.getElementById("confirm-order-number");
    expect(el).not.toBeNull();
    expect(el.textContent).toBe("\u2014");
  });

  it("populates the order number from sessionStorage order data", () => {
    sessionStorage.setItem("orderData", JSON.stringify(sampleOrder));
    const result = populateConfirmOrder();
    expect(result).toBe(true);
    expect(document.getElementById("confirm-order-number").textContent).toBe("#1042");
    expect(document.getElementById("confirm-customer-email").textContent).toBe("buyer@example.com");
  });

  it("shows a dash when the order number is missing", () => {
    const noNumber = { ...sampleOrder, data: { ...sampleOrder.data, orderNumber: undefined } };
    sessionStorage.setItem("orderData", JSON.stringify(noNumber));
    populateConfirmOrder();
    expect(document.getElementById("confirm-order-number").textContent).toBe("\u2014");
  });
});
