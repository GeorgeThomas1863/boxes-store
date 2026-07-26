import { describe, it, expect, vi, beforeEach } from "vitest";

// Uses vi.resetModules() + dynamic import per test so the module-level
// `cachedSettings` in game-settings.js is reset to null on each test.

let mockCollection;
let getGameSettings;
let saveGameSettings;

beforeEach(async () => {
  vi.resetModules();

  mockCollection = {
    findOne: vi.fn().mockResolvedValue(null),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  vi.doMock("../../middleware/db-config.js", () => ({
    dbGet: vi.fn().mockReturnValue({ collection: vi.fn().mockReturnValue(mockCollection) }),
  }));

  const mod = await import("../../src/game-settings.js");
  getGameSettings = mod.getGameSettings;
  saveGameSettings = mod.saveGameSettings;
});

// ---------------------------------------------------------------------------
// getGameSettings
// ---------------------------------------------------------------------------

describe("getGameSettings", () => {
  it("returns DEFAULT_SETTINGS when no doc exists in DB", async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const result = await getGameSettings();
    expect(result.capsuleCount).toBe(10);
    expect(result.spinOptions).toHaveLength(1);
    expect(result.spinOptions[0]).toMatchObject({ extraSpins: 0, spinCost: 0 });
  });

  it("returns doc data (without _id) when doc exists", async () => {
    mockCollection.findOne.mockResolvedValue({ _id: "mongo-id", capsuleCount: 5, spinOptions: [] });
    const result = await getGameSettings();
    expect(result.capsuleCount).toBe(5);
    expect(result._id).toBeUndefined();
  });

  it("does not call DB on second call — returns cached value", async () => {
    mockCollection.findOne.mockResolvedValue(null);
    await getGameSettings();
    await getGameSettings();
    expect(mockCollection.findOne).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// saveGameSettings
// ---------------------------------------------------------------------------

describe("saveGameSettings", () => {
  it("throws when spinOptions is not an array", async () => {
    await expect(saveGameSettings({ capsuleCount: 10, spinOptions: "bad" })).rejects.toThrow("spinOptions must be an array");
  });

  it("generates 'X Extra Spins' label for paid multi-spin options", async () => {
    const result = await saveGameSettings({
      capsuleCount: 10,
      spinOptions: [{ extraSpins: 3, spinCost: 30 }],
    });
    expect(result.spinOptions[0].label).toBe("3 Extra Spins");
  });

  it("uses singular 'Extra Spin' when extraSpins is 1", async () => {
    const result = await saveGameSettings({
      capsuleCount: 10,
      spinOptions: [{ extraSpins: 1, spinCost: 10 }],
    });
    expect(result.spinOptions[0].label).toBe("1 Extra Spin");
  });

  it("generates '1 Spin (free)' label when extraSpins=0 and spinCost=0", async () => {
    const result = await saveGameSettings({
      capsuleCount: 10,
      spinOptions: [{ extraSpins: 0, spinCost: 0 }],
    });
    expect(result.spinOptions[0].label).toBe("1 Spin (free)");
  });

  it("calls updateOne with upsert: true", async () => {
    await saveGameSettings({ capsuleCount: 10, spinOptions: [] });
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ $set: expect.any(Object) }),
      { upsert: true }
    );
  });

  it("updates in-memory cache so subsequent getGameSettings returns new value", async () => {
    await saveGameSettings({ capsuleCount: 7, spinOptions: [] });
    const result = await getGameSettings();
    expect(result.capsuleCount).toBe(7);
    expect(mockCollection.findOne).not.toHaveBeenCalled();
  });

  it("returns the saved settings with generated labels", async () => {
    const result = await saveGameSettings({
      capsuleCount: 8,
      spinOptions: [
        { extraSpins: 0, spinCost: 0 },
        { extraSpins: 2, spinCost: 20 },
      ],
    });
    expect(result).toMatchObject({
      capsuleCount: 8,
      spinOptions: [
        { extraSpins: 0, spinCost: 0, label: "1 Spin (free)" },
        { extraSpins: 2, spinCost: 20, label: "2 Extra Spins" },
      ],
    });
  });
});
