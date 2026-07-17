import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  envDir: "../..",
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("workbox-window")) return "pwa";
        }
      }
    }
  },
  plugins: [react(), VitePWA({ registerType: "prompt", includeAssets: ["offline.html"], manifest: { name: "AccPocket", short_name: "AccPocket", description: "Personal finance and small bookkeeping", theme_color: "#0f766e", background_color: "#f8fafc", display: "standalone", start_url: "/", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }, { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] }, workbox: { cleanupOutdatedCaches: true, navigateFallback: "/index.html", navigateFallbackDenylist: [/^\/api\//], runtimeCaching: [] } })]
});
