import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const builtAt = new Date().toISOString();
export default defineConfig({
  plugins: [
    react(),
    {
      name: "release-version",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ builtAt }),
        });
      },
    },
  ],
  define: {
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(builtAt),
  },
  server: { host: "0.0.0.0" },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) =>
          id.includes("node_modules/phaser") ? "phaser" : undefined,
      },
    },
  },
});
