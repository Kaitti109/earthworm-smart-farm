import { checkUserLogin, sendUserControlCommand, logoutUser } from "./dashboard.js";
// 🎯 ดึงบ้าน rtdb และ SDK เพื่อเปิดการส่องข้อมูลเซนเซอร์แบบสดๆ (Realtime)
import { rtdb } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// สเต็ปที่ 1: ตรวจสอบล็อกอิน เมื่อผ่านแล้วให้เริ่มกระบวนการส่องบอร์ด ESP32
checkUserLogin((userData) => {
    if (userData) {
        // แปะชื่อผู้ใช้ฟาร์มไส้เดือนโชว์บนหน้าจอ
        if (document.getElementById("usernameDisplay")) {
            document.getElementById("usernameDisplay").innerText = userData.username;
        }

        // 🚀 🎯 เปิดสวิตช์เฝ้าส่องเซนเซอร์ ESP32 ผ่าน UID ของยูสเซอร์คนนี้ทันที!
        startListeningToSensorData(userData.uid);
        
        // ผูก Event ให้ปุ่มกดสั่งงานปั๊มน้ำ (Manual) บนหน้าเว็บฝั่ง User
        setupControlButtons(userData.uid);
    }
});

// สเต็ปที่ 2: ฟังก์ชันดักฟังค่าจาก Realtime DB ยิงโชว์บนหน้ากาก HTML
function startListeningToSensorData(userUid) {
    console.log("📡 ระบบเริ่มติดตามบอร์ด ESP32 ของ UID:", userUid);
    const currentSensorRef = ref(rtdb, `users_farms/${userUid}/current`);

    onValue(currentSensorRef, (snapshot) => {
        const data = snapshot.val();
        
        const tempEl = document.getElementById("tempDisplay");
        const moistEl = document.getElementById("moistDisplay");
        const modeEl = document.getElementById("modeDisplay");
        const pumpEl = document.getElementById("pumpStatusDisplay");

        if (data) {
            console.log("🟢 ข้อมูลเซนเซอร์ปัจจุบันขยับตัวล่าสุด:", data);

            if (tempEl) tempEl.innerText = data.temp !== undefined ? `${data.temp.toFixed(1)} °C` : '-- °C';
            if (moistEl) moistEl.innerText = data.moist !== undefined ? `${data.moist.toFixed(1)} %` : '-- %';
            
            if (modeEl) {
                modeEl.innerText = data.auto_status ? "🤖 อัตโนมัติ (AUTO)" : "🎮 ควบคุมเอง (MANUAL)";
                modeEl.style.color = data.auto_status ? "#3b82f6" : "#f59e0b";
            }

            if (pumpEl) {
                pumpEl.innerText = data.pump_status ? "⚡ กำลังทำงาน (ON)" : "💤 หยุดทำงาน (OFF)";
                pumpEl.style.color = data.pump_status ? "#10b981" : "#ef4444";
            }
        } else {
            console.warn("⚠️ บอร์ด ESP32 ของกัมมี่ยังไม่ได้เปิดเครื่อง หรือยังไม่เคยยิงค่าขึ้นมาครั้งแรก");
            if (tempEl) tempEl.innerText = "รอบอร์ดส่งข้อมูล..";
            if (moistEl) moistEl.innerText = "รอบอร์ดส่งข้อมูล..";
        }
    });
}

// สเต็ปที่ 3: ผูกสิทธิ์ปุ่มสั่งการ เปิด/ปิด ปั๊มน้ำ
function setupControlButtons(userUid) {
    const btnOn = document.getElementById("userPumpOnBtn");
    const btnOff = document.getElementById("userPumpOffBtn");
    const statusText = document.getElementById("userControlStatus");

    if (btnOn) {
        btnOn.addEventListener("click", async () => {
            if (statusText) statusText.innerText = "⚡ กำลังส่งคำสั่งเปิด...";
            const success = await sendUserControlCommand(userUid, true); // สั่งเปิด (true)
            if (success && statusText) statusText.innerText = "ส่งคำสั่ง: เปิดปั๊มน้ำสำเร็จ";
        });
    }

    if (btnOff) {
        btnOff.addEventListener("click", async () => {
            if (statusText) statusText.innerText = "⚡ กำลังส่งคำสั่งปิด...";
            const success = await sendUserControlCommand(userUid, false); // สั่งปิด (false)
            if (success && statusText) statusText.innerText = "ส่งคำสั่ง: ปิดปั๊มน้ำสำเร็จ";
        });
    }
}

// ผูกปุ่มออกจากระบบ (ถ้ามี)
if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
        logoutUser();
    });
}