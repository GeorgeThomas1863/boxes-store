/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../public/js/util/api-front.js", () => ({ sendToBack: vi.fn() }));
vi.mock("../../public/js/util/loading.js", () => ({
  showLoadStatus: vi.fn(),
  hideLoadStatus: vi.fn(),
}));
vi.mock("../../public/js/util/popup.js", () => ({
  displayPopup: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../public/js/forms/cart-form.js", () => ({
  buildShippingOption: vi.fn((rate) => {
    const option = document.createElement("label");
    option.className = "shipping-option";
    option.dataset.rateId = String(rate.rateId);
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "shipping-option";
    option.append(input);
    return option;
  }),
}));
vi.mock("../../public/js/forms/checkout-form.js", () => ({
  buildCheckoutShippingOption: vi.fn((rate) => {
    const option = document.createElement("label");
    option.className = "checkout-shipping-option";
    option.dataset.rateId = String(rate.rateId);
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "checkout-shipping-option";
    option.append(input);
    return option;
  }),
}));
vi.mock("../../public/js/run/cart-run.js", () => ({ updateCartSummary: vi.fn() }));
vi.mock("../../public/js/run/checkout-run.js", () => ({ updateCheckoutSummary: vi.fn() }));

import { sendToBack } from "../../public/js/util/api-front.js";
import { hideLoadStatus } from "../../public/js/util/loading.js";
import { displayPopup } from "../../public/js/util/popup.js";
import { updateCartSummary } from "../../public/js/run/cart-run.js";
import {
  runCalculateShipping,
  runShippingOptionSelect,
  loadCheckoutShippingOptions,
} from "../../public/js/run/shipping-run.js";

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("shipping UI", () => {
  it("does not contact the backend for a malformed cart ZIP", async () => {
    document.body.innerHTML = '<input id="cart-shipping-zip-input" value="1234">';
    expect(await runCalculateShipping()).toBeNull();
    expect(sendToBack).not.toHaveBeenCalled();
  });

  it("sends only cart identity data and renders rates cheapest-first", async () => {
    document.body.innerHTML = `
      <input id="cart-shipping-zip-input" value=" 12345 ">
      <div id="shipping-calculator-result" class="hidden"></div>
      <span class="loading-text"></span>`;
    const cart = [{ productId: "p1", quantity: 2, weight: 9999 }];
    sendToBack
      .mockResolvedValueOnce({ cart })
      .mockResolvedValueOnce({
        success: true,
        rateData: [
          { rateId: 0, shipping_amount: { amount: 12 } },
          { rateId: 1, shipping_amount: { amount: 5 } },
        ],
      });

    expect(await runCalculateShipping()).toBe(true);
    expect(sendToBack).toHaveBeenNthCalledWith(2, {
      route: "/shipping/calculate",
      zip: "12345",
      productArray: cart,
    });
    const options = document.querySelectorAll(".shipping-option");
    expect(options[0].dataset.rateId).toBe("1");
    expect(options[0].querySelector("input").checked).toBe(true);
    expect(updateCartSummary).toHaveBeenCalledOnce();
    expect(hideLoadStatus).toHaveBeenCalledOnce();
  });

  it("sends only the selected rateId and restores the previous radio when selection fails", async () => {
    document.body.innerHTML = `
      <label class="shipping-option" data-rate-id="0"><input type="radio" name="shipping-option" data-confirmed="true" checked></label>
      <label class="shipping-option" data-rate-id="1"><input id="next" type="radio" name="shipping-option"></label>`;
    sendToBack.mockResolvedValue({ success: false });
    const next = document.getElementById("next");

    expect(await runShippingOptionSelect(next)).toBeNull();
    expect(sendToBack).toHaveBeenCalledWith({
      route: "/shipping/select",
      selectedRate: { rateId: 1 },
    });
    expect(document.querySelector('[data-rate-id="0"] input').checked).toBe(true);
    expect(next.checked).toBe(false);
    expect(displayPopup).toHaveBeenCalledWith("Unable to select shipping method", "error");
  });

  // The browser checks a clicked radio before the delegated handler runs, so a
  // rollback that reads :checked would restore the rejected option instead.
  it("restores the previous radio when the failing click lands on the radio itself", async () => {
    document.body.innerHTML = `
      <label class="shipping-option" data-rate-id="0"><input id="first" type="radio" name="shipping-option" data-confirmed="true" checked></label>
      <label class="shipping-option" data-rate-id="1"><input id="next" type="radio" name="shipping-option"></label>`;
    sendToBack.mockResolvedValue({ success: false });
    const next = document.getElementById("next");
    next.checked = true;

    expect(await runShippingOptionSelect(next)).toBeNull();
    expect(document.getElementById("first").checked).toBe(true);
    expect(next.checked).toBe(false);
  });

  it("marks the newly accepted rate as confirmed so the next rollback targets it", async () => {
    document.body.innerHTML = `
      <label class="shipping-option" data-rate-id="0"><input id="first" type="radio" name="shipping-option" data-confirmed="true" checked></label>
      <label class="shipping-option" data-rate-id="1"><input id="next" type="radio" name="shipping-option"></label>`;
    sendToBack.mockResolvedValue({ success: true });
    const next = document.getElementById("next");

    expect(await runShippingOptionSelect(next)).toBe(true);
    expect(next.dataset.confirmed).toBe("true");
    expect(document.getElementById("first").dataset.confirmed).toBeUndefined();
  });

  it("marks the session-selected checkout rate after sorting by price", async () => {
    document.body.innerHTML = '<div id="checkout-shipping-container"></div>';
    sendToBack.mockResolvedValue({
      success: true,
      shipping: {
        rateData: [
          { rateId: 0, shipping_amount: { amount: 10 } },
          { rateId: 1, shipping_amount: { amount: 6 } },
        ],
        selectedRate: { rateId: 0 },
      },
    });

    await loadCheckoutShippingOptions();
    const options = document.querySelectorAll(".checkout-shipping-option");
    expect(options[0].dataset.rateId).toBe("1");
    expect(options[1].querySelector("input").checked).toBe(true);
  });
});
