import { dbGet } from "../middleware/db-config.js";

const FREE_SPIN_LABEL = "1 Spin (free)";

const DEFAULT_CAPSULE_DESCRIPTIONS = [
  "Shift Essentials",
  "Self-care items",
  "Fun off duty activities",
  "RN's pick",
  "Grab 2 extra picks",
  "Specialty Item Mystery Spins",
];

const DEFAULT_WHEEL_ITEMS = [
  "Each number on the Mystery wheel correlates to a Specialty Item",
  "Items include planners, chargers, handbags, and other sparkly accessories",
  "1 FREE spin is included in your purchase",
  "Extra spins are available for purchase",
];

const DEFAULT_SETTINGS = {
  capsuleCount: 10,
  spinOptions: [{ label: FREE_SPIN_LABEL, extraSpins: 0, spinCost: 0 }],
  capsuleDescriptions: DEFAULT_CAPSULE_DESCRIPTIONS,
  wheelItems: DEFAULT_WHEEL_ITEMS,
};

let cachedSettings = null;

export const getGameSettings = async () => {
  if (cachedSettings !== null) return cachedSettings;

  const doc = await dbGet().collection("game-settings").findOne({});

  if (doc) {
    const { _id, ...docData } = doc;
    cachedSettings = { ...DEFAULT_SETTINGS, ...docData };
  } else {
    cachedSettings = DEFAULT_SETTINGS;
  }

  return cachedSettings;
};

export const saveGameSettings = async ({ capsuleCount, spinOptions, capsuleDescriptions = [], wheelItems = [] }) => {
  if (!Array.isArray(spinOptions)) throw new Error("spinOptions must be an array");
  const spinOptionsWithLabels = spinOptions.map(({ extraSpins, spinCost }) => {
    const label =
      extraSpins === 0 && spinCost === 0
        ? FREE_SPIN_LABEL
        : `${extraSpins} Extra Spin${extraSpins !== 1 ? "s" : ""}`;
    return { label, extraSpins, spinCost };
  });

  const newSettings = { capsuleCount, spinOptions: spinOptionsWithLabels, capsuleDescriptions, wheelItems };

  await dbGet()
    .collection("game-settings")
    .updateOne({}, { $set: newSettings }, { upsert: true });

  cachedSettings = newSettings;
  return newSettings;
};
