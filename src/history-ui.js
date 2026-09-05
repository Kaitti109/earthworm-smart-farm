import { checkUserLogin, logoutUser } from "./dashboard.js";
import { rtdb } from "./firebase.js";
import { ref, get, query, orderByKey } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let currentLoggedUid = "";
const dateInput = document.getElementById("historyDateInput");
const countTag = document.getElementById("dataCountTag");
const tableBody = document.getElementById("historyTableBody");

// 📅 กำหนดวันที่เริ่มต้นในช่อง Input เป็นวันปัจจุบัน
const todayStr = new Date().toISOString().split("T")[0];
if (dateInput) dateInput.value = todayStr;

checkUserLogin((userData) => {
    if (userData) {
        currentLoggedUid = userData.uid;
        
        const userNameEl = document.getElementById("userNameText");
        if (userNameEl) userNameEl.innerText = userData.username;

        if (userData.role !== "admin") {
            const adminBtn = document.getElementById("adminMenuBtn");
            if (adminBtn) adminBtn.style.display = "none";
        }

        // โหลดข้อมูลประวัติของวันปัจจุบันเริ่มต้นทันที
        loadHistoryByDate(dateInput.value);
    }
});

// 🔍 ฟังก์ชันดึงและกรองประวัติตามวันที่เลือก
async function loadHistoryByDate(selectedDate) {
    if (!currentLoggedUid || !selectedDate) return;

    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8;">⏳ กำลังค้นหาข้อมูลวันที่ ${selectedDate}...</td></tr>`;
    }

    try {
        const logsRef = query(ref(rtdb, `users_farms/${currentLoggedUid}/sensor_logs`), orderByKey());
        const snapshot = await get(logsRef);

        if (!snapshot.exists()) {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8;">ไม่พบข้อมูลประวัติในระบบ</td></tr>`;
            if (countTag) countTag.innerText = "พบ 0 รายการ";
            return;
        }

        const logs = snapshot.val();
        const filteredLogs = [];

        // คำนวณช่วงเวลาเริ่มต้นและสิ้นสุดของวันที่เลือก (00:00:00 - 23:59:59)
        const targetStart = new Date(`${selectedDate}T00:00:00`).getTime();
        const targetEnd = new Date(`${selectedDate}T23:59:59.999`).getTime();

        Object.keys(logs).forEach((key) => {
            const item = logs[key];
            const itemTime = typeof item.time === "number" ? item.time : new Date(item.time).getTime();

            if (itemTime >= targetStart && itemTime <= targetEnd) {
                filteredLogs.push({ ...item, timestamp: itemTime });
            }
        });

        if (countTag) countTag.innerText = `พบ ${filteredLogs.length} รายการ`;

        if (filteredLogs.length === 0) {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8;">ไม่มีบันทึกข้อมูลในวันที่ ${selectedDate}</td></tr>`;
            return;
        }

        // เรียงจากเวลาล่าสุดลงไปล่างสุด (เวลาใหม่สุดอยู่บน)
        filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

        let tableRowsHtml = "";
        filteredLogs.forEach((log) => {
            const d = new Date(log.timestamp);
            const dateStr = d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
            const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')} น.`;

            const tVal = log.temp !== undefined ? `${Number(log.temp).toFixed(1)} °C` : "--";
            const mVal = log.moist !== undefined ? `${Number(log.moist).toFixed(1)} %` : "--";
            const pVal = log.ph !== undefined ? Number(log.ph).toFixed(2) : "7.00";
            
            const pumpText = log.pump 
                ? "<span style='color: #16a34a; font-weight: 600; background: #dcfce7; padding: 2px 8px; border-radius: 12px;'>🟢 เปิด</span>" 
                : "<span style='color: #dc2626; font-weight: 600; background: #fee2e2; padding: 2px 8px; border-radius: 12px;'>🔴 ปิด</span>";
            const modeText = log.mode || "AUTO";

            tableRowsHtml += `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;">
                    <td style="padding: 12px 16px; color: #334155;">${dateStr} <strong>${timeStr}</strong></td>
                    <td style="padding: 12px 16px; font-weight: 600; color: #dc2626;">${tVal}</td>
                    <td style="padding: 12px 16px; font-weight: 600; color: #2563eb;">${mVal}</td>
                    <td style="padding: 12px 16px; font-weight: 600; color: #0d9488;">pH ${pVal}</td>
                    <td style="padding: 12px 16px; color: #64748b;">[${modeText}] ${pumpText}</td>
                </tr>
            `;
        });

        if (tableBody) tableBody.innerHTML = tableRowsHtml;

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลประวัติ:", error);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #ef4444;">เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
    }
}

// 🎯 ผูก Event ปุ่มกดเลือกวัน
document.getElementById("fetchHistoryBtn")?.addEventListener("click", () => {
    if (dateInput) loadHistoryByDate(dateInput.value);
});

document.getElementById("todayHistoryBtn")?.addEventListener("click", () => {
    if (dateInput) {
        dateInput.value = todayStr;
        loadHistoryByDate(todayStr);
    }
});

document.getElementById("historyDateInput")?.addEventListener("change", (e) => {
    loadHistoryByDate(e.target.value);
});

document.getElementById("logoutBtn")?.addEventListener("click", () => logoutUser());

// ==========================================
// ⏱️ ระบบนาฬิกาบอกเวลาปัจจุบัน (Live Clock)
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