import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/portfolio/', 
  plugins: [react()],
  build: {
    outDir: 'docs',  // 出力ディレクトリを`docs`に設定
  }
});
