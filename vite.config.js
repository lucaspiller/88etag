import { defineConfig } from "vite";
import { coffee } from "vite-plugin-coffee3";

export default defineConfig({
  plugins: [
    coffee({
      jsx: false,
    }),
  ],
});
