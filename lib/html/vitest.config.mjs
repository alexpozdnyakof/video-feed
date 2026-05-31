import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.mjs"],
    environment: "happy-dom",
    includeSource: ["src/**/*.{mjs}"],
    silent: false,
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
