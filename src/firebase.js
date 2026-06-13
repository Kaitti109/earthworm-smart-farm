import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// เช็กว่าระบบมีคำสั่งดึงค่าความลับไหม ถ้าไม่มี (เช่นรันบน Live Server) ให้สลับไปใช้ค่าในคอมแทนอัตโนมัติ
const isVercel = typeof import.meta.env !== 'undefined';

const firebaseConfig = {
  apiKey: isVercel ? import.meta.env.VITE_FIREBASE_API_KEY : "AIzaSyCee4qf9jxjxDl--v1asy65vVU5AeKp-vY",
  authDomain: isVercel ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : "preproject-87b69.firebaseapp.com",
  projectId: isVercel ? import.meta.env.VITE_FIREBASE_PROJECT_ID : "preproject-87b69",
  storageBucket: isVercel ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : "preproject-87b69.appspot.com",
  messagingSenderId: isVercel ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : "702960694852",
  appId: isVercel ? import.meta.env.VITE_FIREBASE_APP_ID : "1:702960694852:web:475c20235ee58993bbae11",
  databaseURL: isVercel ? import.meta.env.VITE_FIREBASE_DATABASE_URL : "https://preproject-87b69-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// เริ่มต้นเปิดใช้งาน Firebase App
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);