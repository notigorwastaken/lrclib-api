import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "LrclibReact",
      fileName: (format) => `lrclib-react.${format}.js`,
    },
    rollupOptions: {
      // mark react as external so it’s not bundled
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
