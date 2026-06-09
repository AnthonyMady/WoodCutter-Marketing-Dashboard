import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set base to your GitHub repo name: https://<user>.github.io/<repo>/
// Change "marketing-dashboard" to match your actual repo name.
export default defineConfig({
  plugins: [react()],
  base: "/WoodCutter-Marketing-Dashboard/",
});
