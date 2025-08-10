import { defineConfig } from "vite";

export default defineConfig({
  // Build configuration
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        visualize: "./js/visualize-modern.ts",
        render: "./js/render-modern.ts",
        index: "./js/visualize-modern.ts",
      },
      output: {
        entryFileNames: "[name].bundle.js",
        chunkFileNames: "[name].chunk.js",
        assetFileNames: "[name].[ext]",
      },
    },
    target: "es2020",
    minify: false,
  },

  // Development server
  server: {
    port: 8004,
    host: "0.0.0.0",
  },

  // Resolve configuration
  resolve: {
    alias: {
      "@": "/js",
    },
  },

  // Asset handling
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.gif", "**/*.ico"],

  // CSS processing
  css: {
    modules: false,
  },
});
