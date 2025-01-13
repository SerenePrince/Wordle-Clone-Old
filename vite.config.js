import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/Wordle-Clone-Old/",
  plugins: [react()],
  server: {
    host: true,
  },
});
