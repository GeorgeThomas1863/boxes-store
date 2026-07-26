/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../public/js/util/collapse.js", () => ({
  buildCollapseContainer: vi.fn(),
}));

import { buildProductDetailModal, buildInfoRowDisplayToggle } from "../../public/js/forms/admin-form.js";

const baseProduct = {
  productId: "prod-1",
  name: "Pretty Box",
  price: 12.5,
  picData: [{ path: "/images/test.jpg" }],
  description: "A lovely handmade box.",
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("buildProductDetailModal", () => {
  it("returns an element with class product-detail-overlay", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    expect(modal.classList.contains("product-detail-overlay")).toBe(true);
  });

  it("overlay has data-label='close-product-modal'", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    expect(modal.getAttribute("data-label")).toBe("close-product-modal");
  });

  it("wrapper exists and has class product-detail-wrapper", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    expect(modal.querySelector(".product-detail-wrapper")).not.toBeNull();
  });

  it("wrapper does NOT have a data-label", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const wrapper = modal.querySelector(".product-detail-wrapper");
    expect(wrapper.getAttribute("data-label")).toBeNull();
  });

  it("close button has data-label='close-product-modal'", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const closeBtn = modal.querySelector(".product-detail-close");
    expect(closeBtn).not.toBeNull();
    expect(closeBtn.getAttribute("data-label")).toBe("close-product-modal");
  });

  it("renders product name in .product-detail-name", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const nameEl = modal.querySelector(".product-detail-name");
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toBe("Pretty Box");
  });

  it("formats price correctly as $12.50", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const priceEl = modal.querySelector(".product-detail-price");
    expect(priceEl).not.toBeNull();
    expect(priceEl.textContent).toBe("$12.50");
  });

  it("formats whole-number price with two decimals as $10.00", async () => {
    const modal = await buildProductDetailModal({ ...baseProduct, price: 10 });
    expect(modal.querySelector(".product-detail-price").textContent).toBe("$10.00");
  });

  it("renders img when picData has one entry", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    expect(modal.querySelector(".product-detail-image")).not.toBeNull();
  });

  it("img src contains the picData path", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    expect(modal.querySelector(".product-detail-image").src).toContain("/images/test.jpg");
  });

  it("renders no img when picData is an empty array", async () => {
    const modal = await buildProductDetailModal({ ...baseProduct, picData: [] });
    expect(modal.querySelector(".product-detail-image")).toBeNull();
  });

  it("renders no img when picData is undefined", async () => {
    const modal = await buildProductDetailModal({ ...baseProduct, picData: undefined });
    expect(modal.querySelector(".product-detail-image")).toBeNull();
  });

  it("renders .product-detail-description when description exists", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const desc = modal.querySelector(".product-detail-description");
    expect(desc).not.toBeNull();
    expect(desc.textContent).toBe("A lovely handmade box.");
  });

  it("renders no description element when description is absent", async () => {
    const modal = await buildProductDetailModal({ ...baseProduct, description: undefined });
    expect(modal.querySelector(".product-detail-description")).toBeNull();
  });

  it("renders no description element when description is empty string", async () => {
    const modal = await buildProductDetailModal({ ...baseProduct, description: "" });
    expect(modal.querySelector(".product-detail-description")).toBeNull();
  });

  it("add-to-cart button has data-label='add-to-cart'", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const btn = modal.querySelector("[data-label='add-to-cart']");
    expect(btn).not.toBeNull();
  });

  it("add-to-cart button has productId property matching productId", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const btn = modal.querySelector("[data-label='add-to-cart']");
    expect(btn.productId).toBe("prod-1");
  });

  it("add-to-cart button has class add-to-cart-btn", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const btn = modal.querySelector("[data-label='add-to-cart']");
    expect(btn.classList.contains("add-to-cart-btn")).toBe(true);
  });

  it("add-to-cart button has class product-detail-cart-btn", async () => {
    const modal = await buildProductDetailModal(baseProduct);
    const btn = modal.querySelector("[data-label='add-to-cart']");
    expect(btn.classList.contains("product-detail-cart-btn")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildInfoRowDisplayToggle
// ---------------------------------------------------------------------------

describe("buildInfoRowDisplayToggle", () => {
  it("returns a row with class info-row", async () => {
    const row = await buildInfoRowDisplayToggle("add");
    expect(row.classList.contains("info-row")).toBe(true);
  });

  it("checkbox id is 'display-toggle' in add mode", async () => {
    const row = await buildInfoRowDisplayToggle("add");
    expect(row.querySelector("#display-toggle")).not.toBeNull();
  });

  it("checkbox id is 'edit-display-toggle' in edit mode", async () => {
    const row = await buildInfoRowDisplayToggle("edit");
    expect(row.querySelector("#edit-display-toggle")).not.toBeNull();
  });

  it("checkbox is checked by default", async () => {
    const row = await buildInfoRowDisplayToggle("add");
    expect(row.querySelector(".discount-toggle-checkbox").checked).toBe(true);
  });

  it("checkbox is disabled in edit mode and enabled in add mode", async () => {
    const editRow = await buildInfoRowDisplayToggle("edit");
    const addRow = await buildInfoRowDisplayToggle("add");
    expect(editRow.querySelector(".discount-toggle-checkbox").disabled).toBe(true);
    expect(addRow.querySelector(".discount-toggle-checkbox").disabled).toBe(false);
  });

  it("text reads 'Visible' when checked and 'Hidden' when unchecked", async () => {
    const row = await buildInfoRowDisplayToggle("add");
    const checkbox = row.querySelector(".discount-toggle-checkbox");
    const text = row.querySelector(".discount-toggle-text");
    expect(text.textContent).toBe("Visible");
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change"));
    expect(text.textContent).toBe("Hidden");
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change"));
    expect(text.textContent).toBe("Visible");
  });
});
