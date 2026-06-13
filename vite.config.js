import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        // 💡 ถ้ากัมมี่มีหน้าอื่นๆ อีก เช่น admin.html ให้พิมพ์เพิ่มต่อท้ายตรงนี้ได้เลยนะครับ
        // admin: resolve(__dirname, 'admin.html'),
      }
    }
  }
});