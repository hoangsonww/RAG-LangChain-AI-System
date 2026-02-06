import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/@mui") ||
            id.includes("node_modules/@emotion")
          ) {
            return "mui-vendor";
          }
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("react-syntax-highlighter")
          ) {
            return "markdown-vendor";
          }
          if (id.includes("node_modules/socket.io-client")) {
            return "socket-vendor";
          }
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/axios") ||
            id.includes("node_modules/uuid")
          ) {
            return "core-vendor";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/readyz": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/livez": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/openapi.json": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
