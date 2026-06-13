import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🔐 คอนฟิกของบ้านที่ 1 (Login / Register)
const authConfig = {
  apiKey: import.meta.env.VITE_AUTH_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_AUTH_PROJECT_ID,
  storageBucket: import.meta.env.VITE_AUTH_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_AUTH_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_AUTH_APP_ID
};

// 🪱 คอนฟิกของบ้านที่ 2 (รับค่าจาก ESP32)
const espConfig = {
  projectId: import.meta.env.VITE_ESP_PROJECT_ID,
  databaseURL: import.meta.env.VITE_ESP_DATABASE_URL
};

// 🚀 สั่งเปิดใช้งานพร้อมกัน 2 โปรเจกต์
const authApp = initializeApp(authConfig);              // ตัวหลักเริ่มต้น
const espApp = initializeApp(espConfig, "espProject");   // ตัวเสริม (ต้องตั้งชื่อกำกับไว้)

// 📦 ส่งออกโมดูลให้หน้าอื่นๆ ดึงไปใช้ถูกตัว
export const auth = getAuth(authApp);       // ดึง Auth จากบ้าน Login
export const db = getFirestore(authApp);    // ดึง Firestore จากบ้าน Login (ถ้ามีเก็บโปรไฟล์)
export const rtdb = getDatabase(espApp);    // 🎯 ดึง Realtime Database จากบ้าน ESP32!