import { defineConfig } from "vite";
export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: "tests/foundation/index.ts",
      formats: ["es"],
      fileName: () => "foundation-tests.mjs",
    },
    outDir: "node_modules/.cache/foundation-tests",
    rollupOptions: { external: [], treeshake: false },
    target: "node22",
  },
});
