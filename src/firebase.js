import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// นำคีย์ firebaseConfig ที่ได้จากหน้าจอ Firebase Console มาวางแทนที่ตรงนี้ครับ
const firebaseConfig = {
  apiKey: "AIzaSyCee4qf9jxjxDl--v1asy65vVU5AeKp-vY",
  authDomain: "register-e70b5.firebaseapp.com",
  projectId: "register-e70b5",
  storageBucket: "register-e70b5.firebasestorage.app",
  messagingSenderId: "702960694852",
  appId: "1:702960694852:web:475c20235ee58993bbae11",
  measurementId: "G-1H45KKPWCS"
};

// เริ่มต้นเปิดใช้งานแอป
const app = initializeApp(firebaseConfig);

// ส่งออกโมดูลเพื่อนำไปใช้ในหน้าลงทะเบียน
export const auth = getAuth(app);
export const db = getFirestore(app);

