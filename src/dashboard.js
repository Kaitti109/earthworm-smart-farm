import { auth, db, rtdb } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🎯 ตั้งค่า Telegram Bot
const TELEGRAM_TOKEN = "8989413719:AAEBlxePLJ03u9tmwxuXoc9QxMd7OyGL7ko";
const TELEGRAM_CHAT_ID = "8683019575";

// 🚀 ฟังก์ชันยิงข้อความเข้า Telegram
export async function sendTelegramNotification(message) {
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "HTML"
            })
        });
        console.log("ส่งแจ้งเตือน Telegram สำเร็จ!");
    } catch (error) {
        console.error("ส่ง Telegram ไม่สำเร็จ:", error);
    }
}

// 🎯 ฟังก์ชันแสดง Custom Toast Alert ทรงแคปซูล
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

// 1. ฟังก์ชันคอยตรวจจับว่าผู้ใช้คนนี้ล็อกอินอยู่ไหม
export function checkUserLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("ยืนยันสถานะ: ผู้ใช้งานล็อกอินอยู่", user.uid);
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
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
    showCustomAlert("ออกจากระบบเรียบร้อยแล้ว!", "success");

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1200);

  }).catch((error) => {
    console.error("Logout Error:", error);
    showCustomAlert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "error");
  });
}

// 🚀 3. ฟังก์ชันสั่งงานปั๊มน้ำ + แจ้งเตือน Telegram อัตโนมัติ
export async function sendUserControlCommand(userUid, deviceState) {
  try {
    if (!userUid) return false;

    const controlRef = ref(rtdb, `users_farms/${userUid}/controls`);
    await update(controlRef, {
      auto_mode: false,         // ปิดระบบออโต้เพื่อสั่งงานแบบ Manual
      pump_command: deviceState // true = เปิด, false = ปิด
    });

    // 📲 ส่งแจ้งเตือน Telegram ทันทีที่อัปเดตคำสั่งสำเร็จ
    const statusText = deviceState ? "<b>เปิดปั๊มน้ำพ่นหมอก (ON)</b> 🟢" : "<b>ปิดปั๊มน้ำพ่นหมอก (OFF)</b> 🔴";
    sendTelegramNotification(`💧 <b>[Smart Earthworm Farm]</b>\nระบบได้รับการสั่งงาน: ${statusText}`);

    return true;
  } catch (error) {
    console.error("User สั่งงานปั๊มน้ำไม่สำเร็จ:", error);
    return false;
  }
}