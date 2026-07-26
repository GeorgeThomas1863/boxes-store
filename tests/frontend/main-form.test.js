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
  CAROUSEL_PREV_SVG: "<svg data-icon='carousel-prev'/>",
  CAROUSEL_NEXT_SVG: "<svg data-icon='carousel-next'/>",
}));

vi.mock("../../public/js/util/game-settings-cache.js", () => ({
  getGameSettings: vi.fn().mockResolvedValue({
    capsuleCount: 10,
    spinOptions: [{ label: "1 Spin (free)", extraSpins: 0, spinCost: 0 }],
    capsuleDescriptions: ["Shift Essentials", "Self-care items", "Fun off duty activities", "RN's pick", "Grab 2 extra picks", "Specialty Item Mystery Spins"],
    wheelItems: [
      "Each number on the Mystery wheel correlates to a Specialty Item",
      "Items include planners, chargers, handbags, and other sparkly accessories",
      "1 FREE spin is included in your purchase",
      "Extra spins are available for purchase",
    ],
  }),
}));

vi.mock("../../public/js/util/spin-options.js", () => ({
  buildSpinSelector: vi.fn().mockReturnValue(null),
}));

vi.mock("../../public/js/util/collapse.js", () => ({
  buildCollapseContainer: vi.fn().mockResolvedValue(document.createElement("div")),
}));

import { sendToBack } from "../../public/js/util/api-front.js";
import { buildCard, buildMainForm, buildOutOfStockBanner } from "../../public/js/forms/main-form.js";

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// buildCard
// ---------------------------------------------------------------------------

describe("buildCard", () => {
  it("returns null for null input", async () => {
    expect(await buildCard(null)).toBeNull();
  });

  it("returns null for undefined input", async () => {
    expect(await buildCard(undefined)).toBeNull();
  });

  it("sets data-product-id attribute equal to productId", async () => {
    const card = await buildCard({ productId: "abc123", name: "Test Box", price: 5 });
    expect(card.getAttribute("data-product-id")).toBe("abc123");
  });

  it(".product-name contains the product name", async () => {
    const card = await buildCard({ productId: "p1", name: "Pretty Box", price: 5 });
    expect(card.querySelector(".product-name").textContent).toBe("Pretty Box");
  });

  it(".product-price shows $9.90 for price 9.9", async () => {
    const card = await buildCard({ productId: "p2", name: "Box", price: 9.9 });
    expect(card.querySelector(".product-price").textContent).toBe("$9.90");
  });

  it(".product-price shows $10.00 for price 10", async () => {
    const card = await buildCard({ productId: "p3", name: "Box", price: 10 });
    expect(card.querySelector(".product-price").textContent).toBe("$10.00");
  });

  it("renders an img element when picData has one entry", async () => {
    const card = await buildCard({
      productId: "p4",
      name: "Box",
      price: 5,
      picData: [{ path: "/images/test.jpg" }],
    });
    expect(card.querySelector("img")).not.toBeNull();
  });

  it("img.src contains the picData path", async () => {
    const card = await buildCard({
      productId: "p5",
      name: "Box",
      price: 5,
      picData: [{ path: "/images/test.jpg" }],
    });
    expect(card.querySelector("img").src).toContain("/images/test.jpg");
  });

  it("renders no img when picData is an empty array", async () => {
    const card = await buildCard({ productId: "p6", name: "Box", price: 5, picData: [] });
    expect(card.querySelector("img")).toBeNull();
  });

  it("renders no img when picData is undefined", async () => {
    const card = await buildCard({ productId: "p7", name: "Box", price: 5, picData: undefined });
    expect(card.querySelector("img")).toBeNull();
  });

  it("add-to-cart button has data-label='add-to-cart'", async () => {
    const card = await buildCard({ productId: "p8", name: "Box", price: 5 });
    const btn = card.querySelector("[data-label='add-to-cart']");
    expect(btn).not.toBeNull();
  });

  it("add-to-cart button has productId property equal to the productId", async () => {
    const card = await buildCard({ productId: "p9", name: "Box", price: 5 });
    const btn = card.querySelector("[data-label='add-to-cart']");
    expect(btn.productId).toBe("p9");
  });

  it("stores productData on the card element", async () => {
    const productData = { productId: "p10", name: "Box", price: 5 };
    const card = await buildCard(productData);
    expect(card.productData).toBe(productData);
  });

  it("img has data-label='product-card-click' when picData exists", async () => {
    const card = await buildCard({
      productId: "p11",
      name: "Box",
      price: 5,
      picData: [{ path: "/images/test.jpg" }],
    });
    const img = card.querySelector("img");
    expect(img.getAttribute("data-label")).toBe("product-card-click");
  });

  it("product-name element has data-label='product-card-click'", async () => {
    const card = await buildCard({ productId: "p12", name: "Box", price: 5 });
    const nameEl = card.querySelector(".product-name");
    expect(nameEl.getAttribute("data-label")).toBe("product-card-click");
  });

  it("product-price element has data-label='product-card-click'", async () => {
    const card = await buildCard({ productId: "p13", name: "Box", price: 5 });
    const priceEl = card.querySelector(".product-price");
    expect(priceEl.getAttribute("data-label")).toBe("product-card-click");
  });

  it("product-description has data-label='product-card-click' when description present", async () => {
    const card = await buildCard({ productId: "p14", name: "Box", price: 5, description: "Nice" });
    const descEl = card.querySelector(".product-description");
    expect(descEl.getAttribute("data-label")).toBe("product-card-click");
  });
});

// ---------------------------------------------------------------------------
// buildMainForm
// ---------------------------------------------------------------------------

describe("buildMainForm", () => {
  it("shows .no-products-msg when sendToBack returns null", async () => {
    sendToBack.mockResolvedValue(null);
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelector(".no-products-msg")).not.toBeNull();
  });

  it("renders 0 .product-card elements and shows out-of-stock banner when all products have display:'no'", async () => {
    sendToBack.mockResolvedValue([
      { productId: "a", name: "A", price: 5, display: "no" },
      { productId: "b", name: "B", price: 5, display: "no" },
    ]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelectorAll(".product-card").length).toBe(0);
    expect(document.querySelector(".out-of-stock-banner")).not.toBeNull();
  });

  it("renders 0 .product-card elements and shows out-of-stock banner when all products have sold:'yes'", async () => {
    sendToBack.mockResolvedValue([
      { productId: "c", name: "C", price: 5, sold: "yes" },
      { productId: "d", name: "D", price: 5, sold: "yes" },
    ]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelectorAll(".product-card").length).toBe(0);
    expect(document.querySelector(".out-of-stock-banner")).not.toBeNull();
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

  it("does NOT show out-of-stock banner when visible products exist", async () => {
    sendToBack.mockResolvedValue([{ productId: "v1", name: "Visible", price: 5 }]);
    const form = await buildMainForm();
    document.body.appendChild(form);
    expect(document.querySelector(".out-of-stock-banner")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildOutOfStockBanner
// ---------------------------------------------------------------------------

describe("buildOutOfStockBanner", () => {
  it("returns an element with class out-of-stock-banner", async () => {
    const banner = await buildOutOfStockBanner();
    expect(banner.classList.contains("out-of-stock-banner")).toBe(true);
  });

  it("contains an element with class out-of-stock-title", async () => {
    const banner = await buildOutOfStockBanner();
    expect(banner.querySelector(".out-of-stock-title")).not.toBeNull();
  });

  it("contains a link with href='/contact'", async () => {
    const banner = await buildOutOfStockBanner();
    const link = banner.querySelector("a.out-of-stock-link");
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("/contact");
  });

  it("contains at least two body paragraphs with class out-of-stock-body", async () => {
    const banner = await buildOutOfStockBanner();
    expect(banner.querySelectorAll(".out-of-stock-body").length).toBeGreaterThanOrEqual(2);
  });

  it("contains an icon element with class out-of-stock-icon", async () => {
    const banner = await buildOutOfStockBanner();
    expect(banner.querySelector(".out-of-stock-icon")).not.toBeNull();
  });
});
