import { auth, db, rtdb } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. ฟังก์ชันคอยตรวจจับว่าผู้ใช้คนนี้ล็อกอินอยู่ไหม และดึงข้อมูลให้ทันที
export function checkUserLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("ยืนยันสถานะ: ผู้ใช้งานล็อกอินอยู่", user.uid);
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // แนบ uid เข้าไปในก้อนข้อมูลด้วย เพื่อให้หน้าเว็บดึงไปใช้แยกโฟลเดอร์ใน Realtime DB
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

// 2. ฟังก์ชันสำหรับกดออกจากระบบ
export function logoutUser() {
  signOut(auth).then(() => {
    alert("ออกจากระบบเรียบร้อยแล้ว!");
    window.location.href = "./login.html";
  }).catch((error) => {
    console.error("Logout Error:", error);
  });
}

// 🚀 3. ฟังก์ชันสำหรับส่งคำสั่งควบคุมปั๊มน้ำฝั่ง User (มีตัวเดียวตรงนี้ ห้ามซ้ำ!)
export async function sendUserControlCommand(userUid, deviceState) {
  try {
    if (!userUid) return false;

    // ชี้เป้าไปที่โฟลเดอร์ UID ของผู้ใช้คนนั้นๆ ในโครงสร้างแบบ Multi-User
    const controlRef = ref(rtdb, `users_farms/${userUid}/controls`);
    await update(controlRef, {
      auto_mode: false,         // ปิดระบบออโต้เพื่อให้บอร์ดทำตามคำสั่งแบบ Manual
      pump_command: deviceState // ค่าจะเป็น true (เปิด) หรือ false (ปิด)
    });
    return true;
  } catch (error) {
    console.error("User สั่งงานปั๊มน้ำไม่สำเร็จ:", error);
    return false;
  }
}