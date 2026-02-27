import { defineConfig } from "vite";
import { coffee } from "vite-plugin-coffee3";

export default defineConfig({
  base: "/88etag/",
  plugins: [
    coffee({
      jsx: false,
    }),
  ],
});
