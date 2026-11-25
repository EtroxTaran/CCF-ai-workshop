import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function getAvailableGuideWebps(): string[] {
  const dir = path.resolve(__dirname, "public/guides");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith(".webp"))
    .sort();
}

export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    __GUIDE_WEBP_FILES__: JSON.stringify(getAvailableGuideWebps()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const norm = id.replace(/\\/g, "/");
          if (norm.includes("/src/data/searchIndex.json")) return "search-index";
          if (norm.includes("/src/data/workshopData.json")) return "workshop-data";
          if (!norm.includes("node_modules")) return undefined;
          if (norm.includes("framer-motion")) return "vendor-motion";
          if (norm.includes("d3-")) return "vendor-d3";
          if (norm.includes("@radix-ui")) return "vendor-radix";
          if (norm.includes("react-dom") || norm.includes("/react/")) {
            return "vendor-react";
          }
          if (
            norm.includes("lucide-react") ||
            norm.includes("qrcode") ||
            norm.includes("sonner")
          ) {
            return "vendor-icons";
          }
          return undefined;
        },
      },
    },
  },
});
