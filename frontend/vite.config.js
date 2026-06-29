import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve:{
    alias:{
       "@": path.resolve(__dirname, "./src"),
    },
  },
   build: {
    cssMinify: 'esbuild', // 👈 This overrides LightningCSS and allows Tailwind v4 to compile smoothly
  },
})
