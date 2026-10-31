import tailwindcss from "@tailwindcss/vite";
import { fileRoutes } from "filesystem-routing/vite";
import { defineConfig } from "vitest/config";
import solid from "@solidjs/vite-plugin";
import { loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, "../", "");

  // prod nginx serves the app under /app (see nginx/templates/default.conf.template);
  // dev keeps the root so vite iteration is unchanged. Set VITE_BASE_PATH=/app in
  // Dockerfile.web for the prod build.
  const basePath = (env.VITE_BASE_PATH || "/").replace(/\/+$/, "");

  return {
    base: basePath === "/" ? "/" : `${basePath}/`,
    // Turnkey client mode: no index.html and no mount file — the plugin generates
    // the entries around src/App.tsx (wrapped in src/Document.tsx) and `vite build`
    // prerenders the shell into a purely static dist/client.
    plugins: [
      // `extensions` makes @solidjs/vite-plugin also compile the `?pick=` route
      // modules the fileRoutes plugin emits (their ids end in a query string).
      solid({
        start: { node: true, middleware: "./src/middleware.ts" },
        ssr: true,
        serverFunctions: true,
        extensions: [".jsx", ".tsx"],
        diagnostics: true,
      }), // add `ssr: true` for streaming SSR
      fileRoutes({ types: true }),
      tailwindcss(),
    ],
    resolve: {
      conditions: command == "serve" ? ["source"] : [],
      tsconfigPaths: true,
    },
    server: {
      port: Number(env.WEB_PORT),
    },
    envDir: "..",
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
