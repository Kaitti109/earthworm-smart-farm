import { checkUserLogin, sendUserControlCommand, logoutUser } from "../dashboard.js";
import { rtdb } from "../firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let currentLoggedUid = "";

// 1. ตรวจสอบสถานะการล็อกอินและซ่อนเมนูแอดมิน
checkUserLogin((userData) => {
    if (userData) {
        currentLoggedUid = userData.uid; 
        document.getElementById("userNameText").innerText = userData.username;

        if (userData.role !== "admin") {
            document.getElementById("adminMenuBtn").style.display = "none";
        }

        // 📡 2. ดักฟังเฉพาะค่าเซนเซอร์ปัจจุบัน (Current) มาอัปเดตตัวเลขสดบนหน้าจอ
        const currentSensorRef = ref(rtdb, `users_farms/${userData.uid}/current`);
        
        onValue(currentSensorRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                document.getElementById("tempVal").innerText = data.temp !== undefined ? data.temp.toFixed(1) : "28.5";
                document.getElementById("humidityVal").innerText = data.moist !== undefined ? data.moist.toFixed(1) : "75";
                document.getElementById("phVal").innerText = data.ph !== undefined ? data.ph : "6.8";

                const statusText = document.getElementById("userPumpStatus");
                if (data.pump_status === true) {
                    statusText.innerText = "🟢 บอร์ดทำงาน: เปิดปั๊มน้ำอยู่";
                    statusText.style.color = "#10b981";
                } else {
                    statusText.innerText = "🔴 บอร์ดทำงาน: ปิดปั๊มน้ำอยู่";
                    statusText.style.color = "#ef4444";
                }
            } else {
                document.getElementById("userPumpStatus").innerText = "⏳ รอข้อมูลจากบอร์ด...";
                document.getElementById("userPumpStatus").style.color = "#64748b";
            }
        });
    }
});

// 💧 3. ผูกเหตุการณ์คลิกปุ่มควบคุมปั๊มน้ำไดอะแฟรม
document.getElementById("userPumpOnBtn").addEventListener("click", async () => {
    if (currentLoggedUid) {
        document.getElementById("userPumpStatus").innerText = "⚡ กำลังส่งคำสั่งเปิด...";
        await sendUserControlCommand(currentLoggedUid, true);
    }
});

document.getElementById("userPumpOffBtn").addEventListener("click", async () => {
    if (currentLoggedUid) {
        document.getElementById("userPumpStatus").innerText = "⚡ กำลังส่งคำสั่งปิด...";
        await sendUserControlCommand(currentLoggedUid, false);
    }
});

// 4. ปุ่มออกจากระบบ (Logout)
document.getElementById("logoutBtn").addEventListener("click", () => {
    logoutUser();
});