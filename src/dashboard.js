import { auth, db, rtdb } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🎯 ฟังก์ชันแสดง Custom Toast Alert ทรงแคปซูลสวยงาม
export function showCustomAlert(message, type = "success", duration = 3000) {
    const alertBox = document.getElementById("customAlert");
    const alertMessage = document.getElementById("alertMessage");
    const alertIcon = document.getElementById("alertIcon");

    if (alertBox && alertMessage) {
        alertMessage.innerText = message;
        alertBox.classList.remove("error-theme", "success-theme");

        if (type === "error") {
            alertBox.classList.add("error-theme");
            if (alertIcon) alertIcon.innerText = "⚠️";
        } else {
            alertBox.classList.add("success-theme");
            if (alertIcon) alertIcon.innerText = "🟢";
        }

        alertBox.classList.add("show");

        setTimeout(() => {
            alertBox.classList.remove("show");
        }, duration);
    }
}

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

// 2. ฟังก์ชันสำหรับกดออกจากระบบ (เปลี่ยนจาก alert เดิมเป็น Custom Alert)
export function logoutUser() {
  signOut(auth).then(() => {
    // 🟢 แสดงป๊อปอัพสีเขียวฟาร์มแทน alert() เดิม
    showCustomAlert("ออกจากระบบเรียบร้อยแล้ว!", "success");

    // หน่วงเวลา 1.2 วินาทีเพื่อให้ป๊อปอัพสไลด์โชว์ก่อนเปลี่ยนหน้า
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1200);

  }).catch((error) => {
    console.error("Logout Error:", error);
    showCustomAlert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "error");
  });
}

// 🚀 3. ฟังก์ชันสำหรับส่งคำสั่งควบคุมปั๊มน้ำฝั่ง User
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