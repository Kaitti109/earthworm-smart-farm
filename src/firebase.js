import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🚀 โครงสร้างมาตรฐานระดับมืออาชีพของ Vite
// ระบบจะวิ่งไปดึงค่าเพียวๆ จาก .env (ตอนรันในคอม) หรือดึงจากเว็บ Vercel (ตอนอยู่บนลิงก์จริง) มาเสียบให้เอง
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// เริ่มต้นใช้งานแอป
const app = initializeApp(firebaseConfig);

// ส่งออกโมดูลหลักไปใช้งานในหน้า Login, Register, Dashboard
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);