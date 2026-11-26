import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function getAvailableAssets(subdir: string, ext: string): string[] {
  const dir = path.resolve(__dirname, "public", subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith(ext))
    .sort();
}

export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    __GUIDE_WEBP_FILES__: JSON.stringify(getAvailableAssets("guides", ".webp")),
    __AUDIO_GUIDE_FILES__: JSON.stringify(getAvailableAssets("audio", ".mp3")),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const norm = id.replace(/\\/g, "/");
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
