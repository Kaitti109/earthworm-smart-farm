import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function handleLogin(email, password) {
  try {
    // ขั้นตอนที่ 1: ตรวจสอบอีเมลและรหัสผ่านกับ Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("เข้าสู่ระบบสำเร็จ! UID คือ:", user.uid);

    // ขั้นตอนที่ 2: นำ UID ไปค้นหาข้อมูลใน Firestore คอลเลกชัน "users"
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // ดึงข้อมูลออกมาในรูปแบบ Object
      const userData = docSnap.data();
      console.log("ดึงข้อมูลจาก Database สำเร็จ:", userData);
      
      // ส่งข้อมูลผู้ใช้กลับไปใช้งานที่หน้า UI
      return { success: true, data: userData };
    } else {
      console.log("ไม่พบข้อมูลผู้ใช้ใน Database!");
      return { success: true, data: null };
    }

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error.message);
    alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
    return { success: false, error: error.message };
  }
}