import { sendToBack } from "./api-front.js";

const DEFAULT_SETTINGS = {
  capsuleCount: 10,
  spinOptions: [{ label: "1 Spin (free)", extraSpins: 0, spinCost: 0 }],
  capsuleDescriptions: [
    "Shift Essentials",
    "Self-care items",
    "Fun off duty activities",
    "RN's pick",
    "Grab 2 extra picks",
    "Specialty Item Mystery Spins",
  ],
  wheelItems: [
    "Each number on the Mystery wheel correlates to a Specialty Item",
    "Items include planners, chargers, handbags, and other sparkly accessories",
    "1 FREE spin is included in your purchase",
    "Extra spins are available for purchase",
  ],
};

let settingsPromise = null;

export const getGameSettings = async () => {
  if (!settingsPromise) {
    settingsPromise = sendToBack({ route: "/game-settings-route" }, "GET")
      .then((result) => result || DEFAULT_SETTINGS);
  }
  return settingsPromise;
};

export const invalidateGameSettingsCache = () => {
  settingsPromise = null;
};
