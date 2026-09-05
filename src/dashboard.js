import { auth, db, rtdb } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🎯 ตั้งค่า Telegram Bot
const TELEGRAM_TOKEN = "8989413719:AAEBlxePLJ03u9tmwxuXoc9QxMd7OyGL7ko";
const TELEGRAM_CHAT_ID = "8683019575";

// 🚀 ส่งแจ้งเตือน Telegram
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

// 🎯 แสดง Toast Alert
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

// 1. ตรวจสอบการล็อกอิน
export function checkUserLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("ยืนยันสถานะ: ผู้ใช้งานล็อกอินอยู่ UID =", user.uid);
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          userData.uid = user.uid; 
          callback(userData);
        } else {
          console.log("ไม่พบเอกสารข้อมูลผู้ใช้ใน Firestore!");
          // ถ้าไม่มี Firestore แต่ล็อกอิน Auth ผ่าน ยังให้ส่ง UID ไปทำงานต่อได้
          callback({ uid: user.uid, username: user.email || "ผู้ใช้งาน" });
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
        callback({ uid: user.uid, username: user.email || "ผู้ใช้งาน" });
      }
    } else {
      window.location.href = "./login.html";
    }
  });
}

// 2. ออกจากระบบ
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

// 🚀 3. สั่งงานปั๊มน้ำ (Manual)
export async function sendUserControlCommand(userUid, deviceState) {
  if (!userUid) {
    console.error("❌ ไม่พบ UID ไม่สามารถสั่งงานได้");
    showCustomAlert("เกิดข้อผิดพลาด: ไม่พบ UID", "error");
    return false;
  }

  const path = `users_farms/${userUid}/controls`;
  console.log(`📡 กำลังส่งคำสั่งไปที่: ${path}`, { pump_command: deviceState });

  try {
    const controlRef = ref(rtdb, path);
    await update(controlRef, {
      auto_mode: false,
      pump_command: deviceState
    });

    console.log("✅ Firebase อัปเดตสำเร็จ!");
    showCustomAlert(deviceState ? "เปิดปั๊มน้ำสำเร็จ" : "ปิดปั๊มน้ำสำเร็จ", "success");

    const statusText = deviceState ? "<b>เปิดปั๊มน้ำพ่นหมอก (ON)</b> 🟢" : "<b>ปิดปั๊มน้ำพ่นหมอก (OFF)</b> 🔴";
    sendTelegramNotification(`💧 <b>[Smart Earthworm Farm]</b>\nระบบได้รับการสั่งงาน: ${statusText}`);

    return true;
  } catch (error) {
    console.error("❌ Firebase Write Error:", error);
    showCustomAlert("สั่งงานไม่สำเร็จ: " + error.message, "error");
    return false;
  }
}

// ⚙️ 4. สั่งเปิด/ปิด โหมดอัตโนมัติ (Auto Mode)
export async function setUserAutoMode(userUid, isAuto) {
  if (!userUid) {
    console.error("❌ ไม่พบ UID ไม่สามารถเปลี่ยนโหมดได้");
    showCustomAlert("เกิดข้อผิดพลาด: ไม่พบ UID", "error");
    return false;
  }

  const path = `users_farms/${userUid}/controls`;
  console.log(`📡 กำลังเปลี่ยนโหมดไปที่: ${path}`, { auto_mode: isAuto });

  try {
    const controlRef = ref(rtdb, path);
    await update(controlRef, {
      auto_mode: isAuto
    });

    console.log("✅ Firebase ปรับโหมดสำเร็จ!");
    showCustomAlert(isAuto ? "เปิดระบบ Auto สำเร็จ" : "เปิดระบบ Manual สำเร็จ", "success");

    const modeText = isAuto ? "<b>เปิดโหมดอัตโนมัติ (AUTO ON)</b> ⚙️" : "<b>เปิดโหมดกำหนดเอง (MANUAL)</b> ✋";
    sendTelegramNotification(`⚙️ <b>[Smart Earthworm Farm]</b>\nเปลี่ยนโหมดการทำงาน: ${modeText}`);

    return true;
  } catch (error) {
    console.error("❌ Firebase Write Error:", error);
    showCustomAlert("เปลี่ยนโหมดไม่สำเร็จ: " + error.message, "error");
    return false;
  }
}

// ==========================================
// ⏱️ 5. ระบบนาฬิกาบอกเวลาปัจจุบัน (Live Clock)
// ==========================================
function updateLiveClock() {
    const clockElement = document.getElementById("liveClock");
    if (clockElement) {
        const now = new Date();
        // จัดรูปแบบให้เป็น ชั่วโมง:นาที:วินาที (เช่น 14:05:30)
        const timeString = now.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        clockElement.innerHTML = `⏱️ ${timeString} น.`;
    }
}

// สั่งให้ฟังก์ชันทำงานทุกๆ 1000 มิลลิวินาที (1 วินาที)
setInterval(updateLiveClock, 1000);

// เรียกใช้ครั้งแรกทันทีตอนโหลดหน้าเว็บ
updateLiveClock();