import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🔐 คอนฟิกของบ้านที่ 1 (Login / Register / Firestore Profile)
const authConfig = {
  apiKey: import.meta.env.VITE_AUTH_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_AUTH_PROJECT_ID,
  storageBucket: import.meta.env.VITE_AUTH_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_AUTH_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_AUTH_APP_ID
};

// 🪱 คอนฟิกของบ้านที่ 2 (รับค่าจาก ESP32 / Realtime DB)
const espConfig = {
  projectId: import.meta.env.VITE_ESP_PROJECT_ID,
  databaseURL: import.meta.env.VITE_ESP_DATABASE_URL
};

// 🚀 สั่งเปิดใช้งานพร้อมกัน 2 โปรเจกต์
const authApp = initializeApp(authConfig);              // ตัวหลักเริ่มต้น
const espApp = initializeApp(espConfig, "espProject");   // ตัวเสริม

// 📦 ส่งออกโมดูลให้หน้าอื่นๆ ดึงไปใช้งาน
export const auth = getAuth(authApp);

// 🛠️ บังคับเชื่อมต่อ Firestore ด้วย Long-Polling แก้ปัญหา QUIC Timeout
export const db = initializeFirestore(authApp, {
  experimentalForceLongPolling: true
});

export const rtdb = getDatabase(espApp);                 // 🎯 Realtime Database จากบ้าน ESP32