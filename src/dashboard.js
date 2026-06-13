import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ฟังก์ชันคอยตรวจจับว่าผู้ใช้คนนี้ล็อกอินอยู่ไหม และดึงข้อมูลให้ทันที
export function checkUserLogin(callback) {
  // ฟังก์ชันนี้ของ Firebase จะทำงานอัตโนมัติเมื่อสถานะผู้เปลี่ยนไปหรือตอนโหลดหน้าเว็บ
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("ยืนยันสถานะ: ผู้ใช้งานล็อกอินอยู่", user.uid);
      
      try {
        // ดึงข้อมูลผู้ใช้จากคอลเลกชัน "users" ตาม UID ของคนที่ล็อกอินอยู่ขณะนั้น
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // ส่งข้อมูลกลับไปที่หน้า UI ทาง callback
          callback(docSnap.data());
        } else {
          console.log("ไม่พบเอกสารข้อมูลผู้ใช้ในฐานข้อมูล!");
          callback(null);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      }
    } else {
      // 🔒 ความปลอดภัย: ถ้าไม่ได้เข้าสู่ระบบ ให้เด้งกลับไปหน้า login.html ทันที
      console.log("ไม่ได้ล็อกอิน! กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ...");
      window.location.href = "./login.html";
    }
  });
}

// ฟังก์ชันสำหรับกดออกจากระบบ
export function logoutUser() {
  signOut(auth).then(() => {
    alert("ออกจากระบบเรียบร้อยแล้ว!");
    window.location.href = "./login.html";
  }).catch((error) => {
    console.error("Logout Error:", error);
  });
}