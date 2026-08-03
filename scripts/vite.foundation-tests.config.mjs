import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: "tests/foundation/index.ts",
      formats: ["es"],
      fileName: () => "foundation-tests.mjs",
    },
    outDir: ".foundation-tests",
    rollupOptions: {
      external: [],
    },
    target: "node22",
  },
});
