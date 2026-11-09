import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  root: 'src',
  plugins: [react(), svgr()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/tenant-probe': {
        target: env.API_BASE_URL || 'http://localhost:3000/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/tenant-probe/, ''),
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  base: "./",
  build: {
    outDir: "../dist/renderer",
    emptyOutDir: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'http://localhost:3000/api'),
  },
  optimizeDeps: {
    include: ['react/jsx-dev-runtime'],
  },
};
});
