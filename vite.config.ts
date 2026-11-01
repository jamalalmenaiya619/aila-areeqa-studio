import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Two pages: the app (behind the login check) and the login page.
// Everything the login page needs is written to /assets/public/, the only asset folder served without a login.
const isPublic = (name?: string) => !!name && (name.startsWith("login") || name.startsWith("public-"));
export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: { app: resolve(__dirname, "index.html"), login: resolve(__dirname, "login.html") },
      output: {
        manualChunks: (id) => (/node_modules\/(@supabase|tslib|cookie)/.test(id) ? "public-supabase" : /src\/styles\/tokens\.css/.test(id) ? "public-tokens" : /src\/lib\/(theme|config)\.ts/.test(id) ? "public-shared" : undefined),
        entryFileNames: (c) => (isPublic(c.name) ? "assets/public/[name]-[hash].js" : "assets/[name]-[hash].js"),
        chunkFileNames: (c) => (isPublic(c.name) ? "assets/public/[name]-[hash].js" : "assets/[name]-[hash].js"),
        assetFileNames: (a) => (isPublic(a.names?.[0]) ? "assets/public/[name]-[hash][extname]" : "assets/[name]-[hash][extname]"),
      },
    },
  },
  test: { environment: "node", include: ["tests/unit/**/*.test.{ts,tsx}"] },
});
