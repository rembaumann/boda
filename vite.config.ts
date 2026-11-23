import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { appConfig } from "./src/config/app.config.ts";

/** Plaster `color.bg` from the token build. Manifest and theme-color stay on this value. */
const themeColor = "#E9E9E4";

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replaceAll('"', "&quot;");
}

function supabaseProxy(url: string | undefined) {
  const target = url?.trim().replace(/\/$/, "");
  if (!target?.startsWith("https://")) return undefined;
  return {
    "/api/sb": {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/sb/, ""),
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = supabaseProxy(env.VITE_SUPABASE_URL);
  return {
    plugins: [
      react(),
      {
        name: "boda-html",
        transformIndexHtml: {
          order: "pre",
          handler(html) {
            return html
              .replaceAll("%APP_NAME%", escapeText(appConfig.name))
              .replaceAll("%APP_SHORT_NAME%", escapeAttr(appConfig.shortName))
              .replaceAll("%APP_DESCRIPTION%", escapeAttr(appConfig.description))
              .replaceAll("%APP_LANG%", escapeAttr(appConfig.uiLanguage));
          },
        },
      },
      ...(process.env.VITEST
        ? []
        : [
            VitePWA({
              registerType: "autoUpdate",
              includeAssets: [
                "favicon.svg",
                "favicon-32.png",
                "apple-touch-icon.png",
                "icon-192.png",
                "icon-512.png",
                "icon-maskable-512.png",
              ],
              manifest: {
                name: appConfig.name,
                short_name: appConfig.shortName,
                description: appConfig.description,
                lang: appConfig.uiLanguage,
                start_url: "/",
                scope: "/",
                display: "standalone",
                background_color: themeColor,
                theme_color: themeColor,
                icons: [
                  { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                  { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                  {
                    src: "icon-maskable-512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                  },
                ],
              },
              workbox: {
                globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2,ico,webmanifest}"],
                navigateFallback: "index.html",
                navigateFallbackDenylist: [/^\/api\//],
                clientsClaim: true,
                skipWaiting: true,
              },
            }),
          ]),
    ],
    server: { proxy },
    preview: { proxy },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
