import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: "tests/foundation/persistence.test.ts",
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
