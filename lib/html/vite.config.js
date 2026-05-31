import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
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
  plugins: [
    dts({ rollupTypes: true, outDir: "dist", tsconfigPath: "./tsconfig.json" }),
  ],
});
