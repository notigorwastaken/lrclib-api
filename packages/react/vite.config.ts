import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(packageDirectory, "src/index.ts"),
      name: "LrclibReact",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    sourcemap: true,
    rollupOptions: {
      external: ["react", "react-dom", "lrclib-api"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "lrclib-api": "LrcLibApi",
        },
      },
    },
  },
});
