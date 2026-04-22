import { sendToBack } from "./api-front.js";

const DEFAULT_SETTINGS = {
  capsuleCount: 10,
  spinOptions: [{ label: "1 Spin (free)", extraSpins: 0, spinCost: 0 }],
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
