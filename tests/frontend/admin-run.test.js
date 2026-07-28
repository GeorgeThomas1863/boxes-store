/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../public/js/util/api-front.js", () => ({
  sendToBack: vi.fn(),
}));

vi.mock("../../public/js/forms/admin-form.js", () => ({
  buildModal: vi.fn(),
}));

vi.mock("../../public/js/run/admin-products.js", () => ({
  populateAdminProductSelector: vi.fn(),
  changeAdminProductSelector: vi.fn(),
}));

import { sendToBack } from "../../public/js/util/api-front.js";
import { updateAdminStats, updateSoldStat } from "../../public/js/run/admin-run.js";

const buildStatTiles = () => {
  document.body.innerHTML = `
    <div id="total-products-stat">0</div>
    <div id="displayed-products-stat">0</div>
    <div id="sold-products-stat">0</div>
  `;
};

beforeEach(() => {
  vi.clearAllMocks();
  buildStatTiles();
});

describe("updateSoldStat", () => {
  it("writes soldUnits into the sold tile", async () => {
    await updateSoldStat({ soldUnits: 12 });
    expect(document.getElementById("sold-products-stat").textContent).toBe("12");
  });

  it("returns null and leaves the tile unchanged when soldUnits is not a number", async () => {
    expect(await updateSoldStat({ soldUnits: null })).toBeNull();
    expect(document.getElementById("sold-products-stat").textContent).toBe("0");
  });

  it("returns null when orderStats is null", async () => {
    expect(await updateSoldStat(null)).toBeNull();
  });
});

describe("updateAdminStats", () => {
  it("fills all three tiles from product data and order stats", async () => {
    sendToBack.mockImplementation(async ({ route }) => {
      if (route === "/get-product-data-route") return [{ display: "yes" }, { display: "no" }];
      if (route === "/get-order-stats-route") return { soldUnits: 7 };
      return null;
    });

    await updateAdminStats();

    expect(document.getElementById("total-products-stat").textContent).toBe("2");
    expect(document.getElementById("displayed-products-stat").textContent).toBe("1");
    expect(document.getElementById("sold-products-stat").textContent).toBe("7");
  });

  it("still updates product tiles when the order stats fetch fails", async () => {
    sendToBack.mockImplementation(async ({ route }) => {
      if (route === "/get-product-data-route") return [{ display: "yes" }];
      return null;
    });

    await updateAdminStats();

    expect(document.getElementById("total-products-stat").textContent).toBe("1");
    expect(document.getElementById("sold-products-stat").textContent).toBe("0");
  });
});
