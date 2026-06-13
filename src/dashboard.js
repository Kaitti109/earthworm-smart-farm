// 🚀 จุดที่ 1: เพิ่มการนำเข้า rtdb เข้ามาจากไฟล์คอนฟิกหลัก
import { auth, db, rtdb } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// 🚀 จุดที่ 2: นำเข้าฟังก์ชัน ref และ update เพื่อส่งค่าไปยัง Realtime Database
import { ref, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. ฟังก์ชันคอยตรวจจับว่าผู้ใช้คนนี้ล็อกอินอยู่ไหม (โค้ดเดิมของคุณ)
export function checkUserLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("ยืนยันสถานะ: ผู้ใช้งานล็อกอินอยู่", user.uid);
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // 💡 แอบแนบ uid เข้าไปในก้อนข้อมูลด้วย เพื่อให้หน้า profile ดึงไปใช้ได้ง่ายๆ
          const userData = docSnap.data();
          userData.uid = user.uid; 
          callback(userData);
        } else {
          console.log("ไม่พบเอกสารข้อมูลผู้ใช้ในฐานข้อมูล!");
          callback(null);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      }
    } else {
      console.log("ไม่ได้ล็อกอิน! กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ...");
      window.location.href = "./login.html";
    }
  });
}

// 2. ฟังก์ชันสำหรับกดออกจากระบบ (โค้ดเดิมของคุณ)
export function logoutUser() {
  signOut(auth).then(() => {
    alert("ออกจากระบบเรียบร้อยแล้ว!");
    window.location.href = "./login.html";
  }).catch((error) => {
    console.error("Logout Error:", error);
  });
}

// 🚀 3. ฟังก์ชันที่เพิ่มเข้ามาใหม่: ให้ User ทั่วไปสั่งเปิด-ปิดปั๊มน้ำน้ำจากหน้าแดชบอร์ดได้
export async function sendUserControlCommand(deviceState) {
  try {
    // ชี้ไปที่ Node 'control' ในฐานข้อมูล Realtime Database ตัวเดียวกับที่บอร์ดฟังค่าอยู่
    const controlRef = ref(rtdb, 'control');
    await update(controlRef, {
      pump: deviceState // สั่งงานปั๊มไดอะแฟรม (รับค่า true หรือ false)
    });
    return true;
  } catch (error) {
    console.error("User สั่งงานปั๊มน้ำไม่สำเร็จ:", error);
    return false;
  }
}