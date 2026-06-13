import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🔒 ดึงค่าความลับจากไฟล์ .env (หรือจากหน้าตั้งค่า Environment Variables ของ Vercel)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL // 💡 ท่อหลักสำหรับคุยกับบอร์ด ESP32
};

// เริ่มต้นเปิดใช้งาน Firebase App
const app = initializeApp(firebaseConfig);

// 🚀 ส่งออกโมดูลหลัก (Export) ไปใช้งานในหน้าเว็บต่างๆ (Dashboard, Admin, Register)
export const auth = getAuth(app);       // ระบบล็อกอิน / สมัครสมาชิก
export const db = getFirestore(app);     // ฐานข้อมูลเก็บโปรไฟล์สมาชิก (สิทธิ์ User/Admin)
export const rtdb = getDatabase(app);   // ฐานข้อมูลเรียลไทม์ (ค่าเซนเซอร์ และ ปุ่มควบคุมปั๊มน้ำ)