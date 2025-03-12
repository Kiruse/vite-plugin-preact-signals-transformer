import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import preactSignalsTransformer from '@kiruse/vite-plugin-preact-signals-transformer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    preactSignalsTransformer(),
  ],
});
