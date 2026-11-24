import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("src/data/workshopData.json")) return "workshop-data";
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("d3-")) return "vendor-d3";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("\\react\\")) {
            return "vendor-react";
          }
          if (id.includes("lucide-react") || id.includes("qrcode") || id.includes("sonner")) {
            return "vendor-icons";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:3777",
    },
  },
});
