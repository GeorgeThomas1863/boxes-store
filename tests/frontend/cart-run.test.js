/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock all external dependencies before importing the module under test
// ---------------------------------------------------------------------------

vi.mock("../../public/js/util/api-front.js", () => ({
  sendToBack: vi.fn(),
}));

vi.mock("../../public/js/forms/cart-form.js", () => ({
  buildCartItem: vi.fn(),
  buildEmptyCart: vi.fn(),
}));

vi.mock("../../public/js/util/popup.js", () => ({
  displayPopup: vi.fn().mockResolvedValue(undefined),
}));

import { sendToBack } from "../../public/js/util/api-front.js";
import { buildCartItem, buildEmptyCart } from "../../public/js/forms/cart-form.js";
import {
  displayCart,
  updateNavbarCart,
  updateCartSummary,
  updateItemTotal,
} from "../../public/js/run/cart-run.js";

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// DOM helper functions
// ---------------------------------------------------------------------------

function buildCartPageDOM() {
  const container = document.createElement("div");
  container.id = "cart-items-container";
  const btn = document.createElement("button");
  btn.id = "cart-checkout-btn";
  document.body.append(container, btn);
  return { container, btn };
}

function buildNavbarDOM() {
  const cartContainer = document.createElement("li");
  cartContainer.id = "nav-cart-container";
  cartContainer.style.display = "none";
  const cartCount = document.createElement("span");
  cartCount.id = "nav-cart-count";
  cartCount.textContent = "0";
  document.body.append(cartContainer, cartCount);
  return { cartContainer, cartCount };
}

function buildSummaryDOM() {
  const ids = [
    "cart-summary-item-count",
    "cart-summary-subtotal",
    "cart-summary-shipping",
    "cart-summary-total",
  ];
  const els = {};
  for (const id of ids) {
    const el = document.createElement("span");
    el.id = id;
    document.body.appendChild(el);
    els[id] = el;
  }
  return els;
}

function buildItemTotalDOM(productId, price) {
  const itemTotal = document.createElement("div");
  itemTotal.id = `item-total-${productId}`;
  const cartItem = document.createElement("div");
  cartItem.setAttribute("data-product-id", productId);
  cartItem.dataset.price = String(price);
  document.body.append(itemTotal, cartItem);
  return { itemTotal, cartItem };
}

// ---------------------------------------------------------------------------
// displayCart
// ---------------------------------------------------------------------------

describe("displayCart", () => {
  it("returns null when #cart-items-container not in DOM", async () => {
    const result = await displayCart([]);
    expect(result).toBeNull();
  });

  it("calls buildEmptyCart and appends result when cartItems is []", async () => {
    const { container } = buildCartPageDOM();
    const emptyEl = document.createElement("div");
    buildEmptyCart.mockResolvedValue(emptyEl);

    await displayCart([]);

    expect(buildEmptyCart).toHaveBeenCalledTimes(1);
    expect(container.contains(emptyEl)).toBe(true);
  });

  it("disables #cart-checkout-btn when cart is empty", async () => {
    const { btn } = buildCartPageDOM();
    buildEmptyCart.mockResolvedValue(document.createElement("div"));

    await displayCart([]);

    expect(btn.disabled).toBe(true);
  });

  it("clears previous content before rendering", async () => {
    const { container } = buildCartPageDOM();
    const staleEl = document.createElement("p");
    staleEl.id = "stale";
    container.appendChild(staleEl);

    buildEmptyCart.mockResolvedValue(document.createElement("div"));

    await displayCart([]);

    expect(container.querySelector("#stale")).toBeNull();
  });

  it("calls buildCartItem once per item in the array", async () => {
    buildCartPageDOM();
    buildCartItem.mockResolvedValue(document.createElement("div"));

    const items = [
      { productId: "a", name: "A", price: 1, quantity: 1 },
      { productId: "b", name: "B", price: 2, quantity: 2 },
      { productId: "c", name: "C", price: 3, quantity: 3 },
    ];

    await displayCart(items);

    expect(buildCartItem).toHaveBeenCalledTimes(3);
  });

  it("enables #cart-checkout-btn when items are present", async () => {
    const { btn } = buildCartPageDOM();
    btn.disabled = true;
    buildCartItem.mockResolvedValue(document.createElement("div"));

    await displayCart([{ productId: "x", name: "X", price: 5, quantity: 1 }]);

    expect(btn.disabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateNavbarCart
// ---------------------------------------------------------------------------

describe("updateNavbarCart", () => {
  it("returns null when sendToBack returns null", async () => {
    sendToBack.mockResolvedValue(null);

    const result = await updateNavbarCart();

    expect(result).toBeNull();
  });

  it("sets #nav-cart-container display to 'none' when itemCount is 0", async () => {
    sendToBack.mockResolvedValue({ success: true, itemCount: 0, total: 0 });
    const { cartContainer } = buildNavbarDOM();

    await updateNavbarCart();

    expect(cartContainer.style.display).toBe("none");
  });

  it("sets #nav-cart-container display to 'block' when itemCount > 0", async () => {
    sendToBack.mockResolvedValue({ success: true, itemCount: 3, total: 15.0 });
    const { cartContainer } = buildNavbarDOM();
    cartContainer.style.display = "none";

    await updateNavbarCart();

    expect(cartContainer.style.display).toBe("block");
  });

  it("sets #nav-cart-count text to the itemCount value", async () => {
    sendToBack.mockResolvedValue({ success: true, itemCount: 5, total: 25.0 });
    const { cartCount } = buildNavbarDOM();

    await updateNavbarCart();

    expect(cartCount.textContent).toBe("5");
  });

  it("returns null without throwing when DOM elements not present", async () => {
    sendToBack.mockResolvedValue({ success: true, itemCount: 2, total: 10.0 });
    // DOM elements intentionally absent

    const result = await updateNavbarCart();

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateCartSummary
// ---------------------------------------------------------------------------

describe("updateCartSummary", () => {
  it("returns null when required DOM elements absent", async () => {
    sendToBack.mockResolvedValue({ success: true, itemCount: 2, total: 10.0 });

    const result = await updateCartSummary();

    expect(result).toBeNull();
  });

  it("sets #cart-summary-item-count to itemCount from API", async () => {
    sendToBack.mockResolvedValue({ success: true, itemCount: 4, total: 20.0 });
    const els = buildSummaryDOM();

    await updateCartSummary();

    expect(els["cart-summary-item-count"].textContent).toBe("4");
  });

  it("sets #cart-summary-subtotal to $X.XX format", async () => {
    sendToBack.mockResolvedValue({ success: true, itemCount: 2, total: 19.99 });
    const els = buildSummaryDOM();

    await updateCartSummary();

    expect(els["cart-summary-subtotal"].textContent).toBe("$19.99");
  });

});

// ---------------------------------------------------------------------------
// updateItemTotal
// ---------------------------------------------------------------------------

describe("updateItemTotal", () => {
  it("updates #item-total-{productId} text to price * quantity as $X.XX", async () => {
    const { itemTotal } = buildItemTotalDOM("prod1", 4.5);

    await updateItemTotal("prod1", 3);

    expect(itemTotal.textContent).toBe("$13.50");
  });

  it("returns null when #item-total-{productId} not in DOM", async () => {
    // Only build the cart item element, not the total display element
    const cartItem = document.createElement("div");
    cartItem.setAttribute("data-product-id", "prod2");
    cartItem.dataset.price = "5.00";
    document.body.appendChild(cartItem);

    const result = await updateItemTotal("prod2", 2);

    expect(result).toBeNull();
  });

  it("returns null when cart item element with data-product-id not in DOM", async () => {
    // Only build the total display element, not the cart item
    const itemTotal = document.createElement("div");
    itemTotal.id = "item-total-prod3";
    document.body.appendChild(itemTotal);

    const result = await updateItemTotal("prod3", 1);

    expect(result).toBeNull();
  });
});
