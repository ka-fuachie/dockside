import tailwindcss from "@tailwindcss/vite";
import { fileRoutes } from "filesystem-routing/vite";
import { defineConfig } from "vitest/config";
import solid from "@solidjs/vite-plugin";
import { loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, "../", "");

  return {
    // Turnkey client mode: no index.html and no mount file — the plugin generates
    // the entries around src/App.tsx (wrapped in src/Document.tsx) and `vite build`
    // prerenders the shell into a purely static dist/client.
    plugins: [
      // `extensions` makes @solidjs/vite-plugin also compile the `?pick=` route
      // modules the fileRoutes plugin emits (their ids end in a query string).
      solid({ start: true, extensions: [".jsx", ".tsx"], diagnostics: true }), // add `ssr: true` for streaming SSR
      fileRoutes({ types: true }),
      tailwindcss(),
    ],
    resolve: {
      conditions: command == "serve" ? ["source"] : [],
    },
    server: {
      port: Number(env.WEB_PORT),
    },
    define: {
      "import.meta.env.API_URL": JSON.stringify(env.API_URL),
      "import.meta.env.SITES_BASE_URL": JSON.stringify(env.SITES_BASE_URL),
    },
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: ["./vitest-setup.ts"],
      // if you have few tests, try commenting this
      // out to improve performance:
      isolate: false,
    },
    build: {
      target: "esnext",
      assetsInlineLimit: 0,
    },
  };
});
