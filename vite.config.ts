import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // static-friendly, works from GitHub Pages subpaths
  build: { outDir: "dist", assetsDir: "assets" },
  test: { exclude: ["tests/visual/**", "node_modules/**", "dist/**"] },
});
