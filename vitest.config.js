import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // .claude/.tmp holds temporary git worktrees; without this their copies of
    // the suite get collected too and the run reports inflated, misleading totals
    exclude: ["**/node_modules/**", "**/dist/**", "**/.claude/**"],
    environmentMatchGlobs: [
      ["**/tests/frontend/**", "jsdom"],
      ["**/tests/backend/**", "node"],
    ],
  },
});
