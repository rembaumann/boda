import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { appConfig, THEME_COLORS } from "./src/config/app.config.ts";

function cssVarName(key: string): string {
  return `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function cssColor(value: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`Theme colors must be 6-digit hex values. Received "${value}".`);
  }
  return value;
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replaceAll('"', "&quot;");
}

const themeVars = THEME_COLORS.map((name) => `${cssVarName(name)}:${cssColor(appConfig.colors[name])}`).join(";");

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
        name: "boda-theme",
        enforce: "pre",
        transform(code, id) {
          if (!id.replaceAll("\\", "/").endsWith("/src/styles.css")) return null;
          return { code: `:root{${themeVars}}\n${code}`, map: null };
        },
        transformIndexHtml: {
          order: "pre",
          handler(html) {
            return html
              .replaceAll("%APP_NAME%", escapeText(appConfig.name))
              .replaceAll("%APP_SHORT_NAME%", escapeAttr(appConfig.shortName))
              .replaceAll("%APP_DESCRIPTION%", escapeAttr(appConfig.description))
              .replaceAll("%APP_LANG%", escapeAttr(appConfig.uiLanguage))
              .replaceAll("%THEME_COLOR%", cssColor(appConfig.colors.background));
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
                background_color: appConfig.colors.background,
                theme_color: appConfig.colors.background,
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
