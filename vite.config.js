import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // มัดรวมหน้าเว็บทั้งหมดที่มีในโปรเจกต์ของกัมมี่ส่งขึ้น Vercel
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        admin: resolve(__dirname, 'admin.html'),       // 👈 เพิ่มหน้านี้เข้าไป
        dashboard: resolve(__dirname, 'dashboard.html') // 👈 ถ้ามีหน้าแดชบอร์ดคุมปั๊มน้ำ ใส่เข้าไปด้วยครับ
      }
    }
  }
});