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

vi.mock("../../public/js/util/define-things.js", () => ({
  FACEBOOK_ICON_SVG: "<svg data-icon='facebook'/>",
  INSTAGRAM_ICON_SVG: "<svg data-icon='instagram'/>",
  TIKTOK_ICON_SVG: "<svg data-icon='tiktok'/>",
}));

import { sendToBack } from "../../public/js/util/api-front.js";
import { buildCard, buildMainForm } from "../../public/js/forms/main-form.js";

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// buildCard
// ---------------------------------------------------------------------------

describe("buildCard", () => {
  it("returns null for null input", () => {
    expect(buildCard(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(buildCard(undefined)).toBeNull();
  });

  it("sets data-product-id attribute equal to productId", () => {
    const card = buildCard({ productId: "abc123", name: "Test Box", price: 5 });
    expect(card.getAttribute("data-product-id")).toBe("abc123");
  });

  it(".product-name contains the product name", () => {
    const card = buildCard({ productId: "p1", name: "Pretty Box", price: 5 });
    expect(card.querySelector(".product-name").textContent).toBe("Pretty Box");
  });

  it(".product-price shows $9.90 for price 9.9", () => {
    const card = buildCard({ productId: "p2", name: "Box", price: 9.9 });
    expect(card.querySelector(".product-price").textContent).toBe("$9.90");
  });

  it(".product-price shows $10.00 for price 10", () => {
    const card = buildCard({ productId: "p3", name: "Box", price: 10 });
    expect(card.querySelector(".product-price").textContent).toBe("$10.00");
  });

  it("renders an img element when picData has one entry", () => {
    const card = buildCard({
      productId: "p4",
      name: "Box",
      price: 5,
      picData: [{ path: "/images/test.jpg" }],
    });
    expect(card.querySelector("img")).not.toBeNull();
  });

  it("img.src contains the picData path", () => {
    const card = buildCard({
      productId: "p5",
      name: "Box",
      price: 5,
      picData: [{ path: "/images/test.jpg" }],
    });
    expect(card.querySelector("img").src).toContain("/images/test.jpg");
  });

  it("renders no img when picData is an empty array", () => {
    const card = buildCard({ productId: "p6", name: "Box", price: 5, picData: [] });
    expect(card.querySelector("img")).toBeNull();
  });

  it("renders no img when picData is undefined", () => {
    const card = buildCard({ productId: "p7", name: "Box", price: 5, picData: undefined });
    expect(card.querySelector("img")).toBeNull();
  });

  it("add-to-cart button has data-label='add-to-cart'", () => {
    const card = buildCard({ productId: "p8", name: "Box", price: 5 });
    const btn = card.querySelector("[data-label='add-to-cart']");
    expect(btn).not.toBeNull();
  });

  it("add-to-cart button has productId property equal to the productId", () => {
    const card = buildCard({ productId: "p9", name: "Box", price: 5 });
    const btn = card.querySelector("[data-label='add-to-cart']");
    expect(btn.productId).toBe("p9");
  });
});

// ---------------------------------------------------------------------------
// buildMainForm
// ---------------------------------------------------------------------------

describe("buildMainForm", () => {
  it("shows .no-products-msg when sendToBack returns 'FAIL'", async () => {
    sendToBack.mockResolvedValue("FAIL");
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelector(".no-products-msg")).not.toBeNull();
  });

  it("shows .no-products-msg when sendToBack returns null", async () => {
    sendToBack.mockResolvedValue(null);
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelector(".no-products-msg")).not.toBeNull();
  });

  it("renders 0 .product-card elements when all products have display:'no'", async () => {
    sendToBack.mockResolvedValue([
      { productId: "a", name: "A", price: 5, display: "no" },
      { productId: "b", name: "B", price: 5, display: "no" },
    ]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelectorAll(".product-card").length).toBe(0);
  });

  it("renders 0 .product-card elements when all products have sold:'yes'", async () => {
    sendToBack.mockResolvedValue([
      { productId: "c", name: "C", price: 5, sold: "yes" },
      { productId: "d", name: "D", price: 5, sold: "yes" },
    ]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelectorAll(".product-card").length).toBe(0);
  });

  it("excludes display:'no' products while including others", async () => {
    sendToBack.mockResolvedValue([
      { productId: "visible1", name: "Visible", price: 5 },
      { productId: "hidden1", name: "Hidden", price: 5, display: "no" },
    ]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    const cards = document.querySelectorAll(".product-card");
    expect(cards.length).toBe(1);
    expect(cards[0].getAttribute("data-product-id")).toBe("visible1");
  });

  it("excludes sold:'yes' products while including others", async () => {
    sendToBack.mockResolvedValue([
      { productId: "visible2", name: "Visible", price: 5 },
      { productId: "sold1", name: "Sold", price: 5, sold: "yes" },
    ]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    const cards = document.querySelectorAll(".product-card");
    expect(cards.length).toBe(1);
    expect(cards[0].getAttribute("data-product-id")).toBe("visible2");
  });

  it("renders a card for each visible product", async () => {
    sendToBack.mockResolvedValue([
      { productId: "x1", name: "X1", price: 5 },
      { productId: "x2", name: "X2", price: 5 },
      { productId: "x3", name: "X3", price: 5 },
    ]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelectorAll(".product-card").length).toBe(3);
  });

  it("sorts products newest-first: later dateCreated appears first in DOM", async () => {
    sendToBack.mockResolvedValue([
      { productId: "older", name: "Older", price: 5, dateCreated: "2024-01-01T00:00:00.000Z" },
      { productId: "newer", name: "Newer", price: 5, dateCreated: "2024-06-01T00:00:00.000Z" },
    ]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    const cards = document.querySelectorAll(".product-card");
    expect(cards[0].getAttribute("data-product-id")).toBe("newer");
    expect(cards[1].getAttribute("data-product-id")).toBe("older");
  });
});
