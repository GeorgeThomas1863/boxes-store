/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../public/js/forms/main-form.js", () => ({
  buildNavBar: vi.fn(async () => {
    const nav = document.createElement("nav");
    nav.setAttribute("data-testid", "navbar");
    return nav;
  }),
}));

import { buildNavBar } from "../../public/js/forms/main-form.js";
import { buildAboutForm } from "../../public/js/forms/about-form.js";

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// Container structure
// ---------------------------------------------------------------------------

describe("buildAboutForm — container", () => {
  it("returns a div with class about-container", async () => {
    const container = await buildAboutForm();
    expect(container.tagName).toBe("DIV");
    expect(container.className).toBe("about-container");
  });

  it("calls buildNavBar once", async () => {
    await buildAboutForm();
    expect(buildNavBar).toHaveBeenCalledTimes(1);
  });

  it("appends the nav returned by buildNavBar into the container", async () => {
    const container = await buildAboutForm();
    const nav = container.querySelector("[data-testid='navbar']");
    expect(nav).not.toBeNull();
  });

  it("contains an .about-page child", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-page")).not.toBeNull();
  });

  it("contains the background mesh as a direct child", async () => {
    const container = await buildAboutForm();
    const mesh = container.querySelector(".about-bg-mesh");
    expect(mesh).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Background orbs
// ---------------------------------------------------------------------------

describe("buildAboutForm — orbs", () => {
  it("renders exactly three .about-orb elements", async () => {
    const container = await buildAboutForm();
    expect(container.querySelectorAll(".about-orb").length).toBe(3);
  });

  it("orb 1 has class about-orb-1", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-orb-1")).not.toBeNull();
  });

  it("orb 2 has class about-orb-2", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-orb-2")).not.toBeNull();
  });

  it("orb 3 has class about-orb-3", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-orb-3")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------

describe("buildAboutForm — hero", () => {
  it("renders an .about-hero section", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-hero")).not.toBeNull();
  });

  it(".about-hero-sub mentions 'PRN & Pretty Things Co.'", async () => {
    const container = await buildAboutForm();
    const sub = container.querySelector(".about-hero-sub");
    expect(sub).not.toBeNull();
    expect(sub.textContent).toContain("PRN & Pretty Things Co.");
  });

  it(".about-hero-sub mentions 'Blue Ridge Mountains'", async () => {
    const container = await buildAboutForm();
    const sub = container.querySelector(".about-hero-sub");
    expect(sub.textContent).toContain("Blue Ridge Mountains");
  });

  it(".about-hero-emoji row is rendered", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-hero-emoji")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Content cards
// ---------------------------------------------------------------------------

describe("buildAboutForm — cards", () => {
  it("renders exactly three .about-g-card elements", async () => {
    const container = await buildAboutForm();
    expect(container.querySelectorAll(".about-g-card").length).toBe(3);
  });

  it("first card in DOM is the nursing card (page.append order: card2, card1, card3)", async () => {
    const container = await buildAboutForm();
    const cards = container.querySelectorAll(".about-g-card");
    expect(cards[0].querySelector("h2").textContent).toBe(
      "A Decade of Nursing, Called to Comfort"
    );
  });

  it("second card in DOM is the journey card", async () => {
    const container = await buildAboutForm();
    const cards = container.querySelectorAll(".about-g-card");
    expect(cards[1].querySelector("h2").textContent).toBe("Finding Our Forever Home in the Blue Ridge");
  });

  it("card 3 heading is 'Every Girl Deserves a Hug in a Box'", async () => {
    const container = await buildAboutForm();
    const cards = container.querySelectorAll(".about-g-card");
    expect(cards[2].querySelector("h2").textContent).toBe("Every Girl Deserves a Hug in a Box");
  });

  it("first DOM card (nursing) has animationDelay of '0.2s'", async () => {
    const container = await buildAboutForm();
    const cards = container.querySelectorAll(".about-g-card");
    expect(cards[0].style.animationDelay).toBe("0.2s");
  });

  it("second DOM card (journey) has animationDelay of '0.1s'", async () => {
    const container = await buildAboutForm();
    const cards = container.querySelectorAll(".about-g-card");
    expect(cards[1].style.animationDelay).toBe("0.1s");
  });

  it("card 3 has animationDelay of '0.3s'", async () => {
    const container = await buildAboutForm();
    const cards = container.querySelectorAll(".about-g-card");
    expect(cards[2].style.animationDelay).toBe("0.3s");
  });

  it("first DOM card (nursing) has accent bar with class about-purple-bar", async () => {
    const container = await buildAboutForm();
    const card = container.querySelectorAll(".about-g-card")[0];
    expect(card.querySelector(".about-purple-bar")).not.toBeNull();
  });

  it("second DOM card (journey) has accent bar with class about-pink-bar", async () => {
    const container = await buildAboutForm();
    const card = container.querySelectorAll(".about-g-card")[1];
    expect(card.querySelector(".about-pink-bar")).not.toBeNull();
  });

  it("card 3 has accent bar with class about-mint-bar", async () => {
    const container = await buildAboutForm();
    const card = container.querySelectorAll(".about-g-card")[2];
    expect(card.querySelector(".about-mint-bar")).not.toBeNull();
  });

  it("each card has at least one .about-card-tag element", async () => {
    const container = await buildAboutForm();
    const cards = container.querySelectorAll(".about-g-card");
    cards.forEach((card) => {
      expect(card.querySelector(".about-card-tag")).not.toBeNull();
    });
  });

  it("first DOM card (nursing) has a highlighted span with 'special kind of honor'", async () => {
    const container = await buildAboutForm();
    const card = container.querySelectorAll(".about-g-card")[0];
    const highlights = card.querySelectorAll(".about-inline-hl");
    const texts = Array.from(highlights).map((el) => el.textContent);
    expect(texts).toContain("special kind of honor");
  });

  it("second DOM card (journey) has a highlighted span with '\u201Cforever home\u201D'", async () => {
    const container = await buildAboutForm();
    const card = container.querySelectorAll(".about-g-card")[1];
    const highlights = card.querySelectorAll(".about-inline-hl");
    const texts = Array.from(highlights).map((el) => el.textContent);
    expect(texts).toContain("\u201Cforever home\u201D");
  });

  it("card 3 has a highlighted span with 'hug in a box'", async () => {
    const container = await buildAboutForm();
    const card = container.querySelectorAll(".about-g-card")[2];
    const highlights = card.querySelectorAll(".about-inline-hl");
    const texts = Array.from(highlights).map((el) => el.textContent);
    expect(texts).toContain("hug in a box");
  });

  it("each card has paragraph content (at least one p element)", async () => {
    const container = await buildAboutForm();
    const cards = container.querySelectorAll(".about-g-card");
    cards.forEach((card) => {
      expect(card.querySelectorAll("p").length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Quote card
// ---------------------------------------------------------------------------

describe("buildAboutForm — quote", () => {
  it("renders .about-quote-glass element", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-quote-glass")).not.toBeNull();
  });

  it("blockquote contains the founder quote", async () => {
    const container = await buildAboutForm();
    const blockquote = container.querySelector(".about-quote-glass blockquote");
    expect(blockquote).not.toBeNull();
    expect(blockquote.textContent).toContain("smallest comforts make the biggest difference");
  });

  it("cite contains '\u2014 Rachel, RN'", async () => {
    const container = await buildAboutForm();
    const cite = container.querySelector(".about-quote-glass cite");
    expect(cite).not.toBeNull();
    expect(cite.textContent).toBe("\u2014 Rachel, RN");
  });

  it(".about-big-q opening mark is present", async () => {
    const container = await buildAboutForm();
    const bigQ = container.querySelector(".about-big-q");
    expect(bigQ).not.toBeNull();
    expect(bigQ.textContent).toBe("\u201C");
  });

  it(".about-quote-line divider is present", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-quote-line")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Footer card
// ---------------------------------------------------------------------------

describe("buildAboutForm — footer", () => {
  it("renders .about-footer-glass element", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-footer-glass")).not.toBeNull();
  });

  it("footer has class about-glass", async () => {
    const container = await buildAboutForm();
    const footer = container.querySelector(".about-footer-glass");
    expect(footer.classList.contains("about-glass")).toBe(true);
  });

  it("renders exactly two .about-footer-row elements", async () => {
    const container = await buildAboutForm();
    expect(container.querySelectorAll(".about-footer-row").length).toBe(2);
  });

  it("first row label is 'Based In'", async () => {
    const container = await buildAboutForm();
    const rows = container.querySelectorAll(".about-footer-row");
    const label = rows[0].querySelector(".about-f-label");
    expect(label.textContent).toBe("Based In");
  });

  it("first row value is 'Western North Carolina'", async () => {
    const container = await buildAboutForm();
    const rows = container.querySelectorAll(".about-footer-row");
    const value = rows[0].querySelector(".about-f-value");
    expect(value.textContent).toBe("Western North Carolina");
  });

  it("second row label is 'Ownership'", async () => {
    const container = await buildAboutForm();
    const rows = container.querySelectorAll(".about-footer-row");
    const label = rows[1].querySelector(".about-f-label");
    expect(label.textContent).toBe("Ownership");
  });

  it("second row value mentions 'Registered Nurse'", async () => {
    const container = await buildAboutForm();
    const rows = container.querySelectorAll(".about-footer-row");
    const value = rows[1].querySelector(".about-f-value");
    expect(value.textContent).toContain("Registered Nurse");
  });

  it("copyright contains '2026 PRN & Pretty Things Co.'", async () => {
    const container = await buildAboutForm();
    const copyright = container.querySelector(".about-copyright");
    expect(copyright).not.toBeNull();
    expect(copyright.textContent).toContain("2026 PRN & Pretty Things Co.");
  });

  it(".about-footer-divider is present", async () => {
    const container = await buildAboutForm();
    expect(container.querySelector(".about-footer-divider")).not.toBeNull();
  });

  it(".about-footer-items container holds the rows", async () => {
    const container = await buildAboutForm();
    const items = container.querySelector(".about-footer-items");
    expect(items).not.toBeNull();
    expect(items.querySelectorAll(".about-footer-row").length).toBe(2);
  });

  it("each footer row has an .about-f-icon-wrap element", async () => {
    const container = await buildAboutForm();
    const rows = container.querySelectorAll(".about-footer-row");
    rows.forEach((row) => {
      expect(row.querySelector(".about-f-icon-wrap")).not.toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// DOM order — container children
// ---------------------------------------------------------------------------

describe("buildAboutForm — DOM order", () => {
  it("first child of container is .about-bg-mesh", async () => {
    const container = await buildAboutForm();
    expect(container.children[0].classList.contains("about-bg-mesh")).toBe(true);
  });

  it("orbs precede the nav in container children", async () => {
    const container = await buildAboutForm();
    const children = Array.from(container.children);
    const orbIndices = children
      .map((el, i) => (el.classList.contains("about-orb") ? i : -1))
      .filter((i) => i !== -1);
    const navIndex = children.findIndex((el) => el.tagName === "NAV");
    expect(orbIndices.every((i) => i < navIndex)).toBe(true);
  });

  it(".about-page is the last child of container", async () => {
    const container = await buildAboutForm();
    const children = container.children;
    expect(children[children.length - 1].classList.contains("about-page")).toBe(true);
  });

  it("hero is the first child of .about-page", async () => {
    const container = await buildAboutForm();
    const page = container.querySelector(".about-page");
    expect(page.children[0].classList.contains("about-hero")).toBe(true);
  });

  it("footer is the last child of .about-page", async () => {
    const container = await buildAboutForm();
    const page = container.querySelector(".about-page");
    const last = page.children[page.children.length - 1];
    expect(last.classList.contains("about-footer-glass")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// XSS safety — no innerHTML usage
// ---------------------------------------------------------------------------

describe("buildAboutForm — XSS safety", () => {
  it("blockquote textContent does not contain raw HTML tags", async () => {
    const container = await buildAboutForm();
    const blockquote = container.querySelector("blockquote");
    expect(blockquote.textContent).not.toMatch(/<[^>]+>/);
  });

  it("highlight spans use textContent not innerHTML (no embedded tags)", async () => {
    const container = await buildAboutForm();
    const spans = container.querySelectorAll(".about-inline-hl");
    spans.forEach((span) => {
      expect(span.textContent).not.toMatch(/<[^>]+>/);
    });
  });
});

// ---------------------------------------------------------------------------
// buildAboutForm is idempotent — calling twice returns independent trees
// ---------------------------------------------------------------------------

describe("buildAboutForm — multiple calls", () => {
  it("two calls return distinct container elements", async () => {
    const a = await buildAboutForm();
    const b = await buildAboutForm();
    expect(a).not.toBe(b);
  });

  it("each call invokes buildNavBar independently", async () => {
    await buildAboutForm();
    await buildAboutForm();
    expect(buildNavBar).toHaveBeenCalledTimes(2);
  });
});
