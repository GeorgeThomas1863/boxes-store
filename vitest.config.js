import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["**/tests/frontend/**", "jsdom"],
      ["**/tests/backend/**", "node"],
    ],
  },
});
