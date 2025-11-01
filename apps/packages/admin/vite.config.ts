import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: "dist",
  },
  define: {
    "process.env": process.env,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
