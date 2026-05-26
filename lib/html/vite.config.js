import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.mjs"),
      name: "html",
      fileName: "index",
      formats: ["es"],
    },
  },
  test: {
    environment: "happy-dom",
    test: {
      includeSource: ["src/**/*.{mjs}"],
    },
  },
});
