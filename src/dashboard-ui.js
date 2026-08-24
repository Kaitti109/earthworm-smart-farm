import { checkUserLogin, sendUserControlCommand, setUserAutoMode, logoutUser, sendTelegramNotification } from "./dashboard.js";
import { rtdb } from "./firebase.js";
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let currentLoggedUid = "";
let tempChartInstance = null;
let moistChartInstance = null;
let phChartInstance = null;

// 🎯 ตัวแปรควบคุมการส่งแจ้งเตือน Telegram
let isTempAlertSent = false; 

checkUserLogin((userData) => {
    if (userData) {
        currentLoggedUid = userData.uid; 
        const userNameEl = document.getElementById("userNameText");
        if (userNameEl) userNameEl.innerText = userData.username;

        if (userData.role !== "admin") {
            const adminBtn = document.getElementById("adminMenuBtn");
            if (adminBtn) adminBtn.style.display = "none";
        }

        // 1. ดักฟังค่าเซนเซอร์ปัจจุบัน และสถานะปั๊ม/โหมด
        const currentSensorRef = ref(rtdb, `users_farms/${userData.uid}/current`);
        onValue(currentSensorRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const temp = data.temp !== undefined ? data.temp : null;

                const tempEl = document.getElementById("tempVal");
                const humidEl = document.getElementById("humidityVal");
                const phEl = document.getElementById("phVal");
                const pumpStatusEl = document.getElementById("userPumpStatus");

                if (tempEl) tempEl.innerText = temp !== null ? temp.toFixed(1) : "--";
                if (humidEl) humidEl.innerText = data.moist !== undefined ? data.moist.toFixed(1) : "--";
                if (phEl) phEl.innerText = data.ph !== undefined ? data.ph : "--";

                const isPumpOn = data.pump_status === true || data.pump === true;
                if (pumpStatusEl) {
                    if (isPumpOn) {
                        pumpStatusEl.innerText = "🟢 บอร์ดทำงาน: เปิดปั๊มน้ำอยู่";
                        pumpStatusEl.style.color = "#10b981";
                    } else {
                        pumpStatusEl.innerText = "🔴 บอร์ดทำงาน: ปิดปั๊มน้ำอยู่";
                        pumpStatusEl.style.color = "#ef4444";
                    }
                }

                // 📲 แจ้งเตือนเมื่ออุณหภูมิสูงเกิน 32°C
                if (temp !== null) {
                    if (temp >= 32.0 && !isTempAlertSent) {
                        sendTelegramNotification(
                            `🌡️ <b>[เตือนอุณหภูมิสูงเกินเกณฑ์!]</b>\n` +
                            `อุณหภูมิเบดดิ้งปัจจุบัน: <b>${temp.toFixed(1)} °C</b> ⚠️\n` +
                            `สภาพแวดล้อมเริ่มร้อนเกินไปสำหรับไส้เดือน AF กรุณาตรวจสอบหรือสั่งเปิดปั๊มพ่นหมอก`
                        );
                        isTempAlertSent = true;
                    } else if (temp <= 30.0 && isTempAlertSent) {
                        isTempAlertSent = false; 
                    }
                }
            }
        });

        // 2. ดักฟังสถานะโหมด Auto / Manual (อัปเดตปุ่มและข้อความสถานะ)
        const controlRef = ref(rtdb, `users_farms/${userData.uid}/controls`);
        onValue(controlRef, (snapshot) => {
            const controls = snapshot.val();
            const autoStatusEl = document.getElementById("userAutoStatus");
            const pumpOnBtn = document.getElementById("userPumpOnBtn");
            const pumpOffBtn = document.getElementById("userPumpOffBtn");

            const isAuto = controls && controls.auto_mode === true;

            if (autoStatusEl) {
                if (isAuto) {
                    autoStatusEl.innerText = "⚙️ โหมด: Auto";
                    autoStatusEl.style.color = "#2563eb";
                    if (pumpOnBtn && pumpOffBtn) {
                        pumpOnBtn.disabled = true;
                        pumpOffBtn.disabled = true;
                        pumpOnBtn.style.opacity = "0.4";
                        pumpOffBtn.style.opacity = "0.4";
                        pumpOnBtn.style.cursor = "not-allowed";
                        pumpOffBtn.style.cursor = "not-allowed";
                    }
                } else {
                    autoStatusEl.innerText = "✋ โหมด: Manual";
                    autoStatusEl.style.color = "#64748b";
                    if (pumpOnBtn && pumpOffBtn) {
                        pumpOnBtn.disabled = false;
                        pumpOffBtn.disabled = false;
                        pumpOnBtn.style.opacity = "1";
                        pumpOffBtn.style.opacity = "1";
                        pumpOnBtn.style.cursor = "pointer";
                        pumpOffBtn.style.cursor = "pointer";
                    }
                }
            }
        });

        // 3. ดึง Log ย้อนหลังสแตนด์บายไว้วาดกราฟ
        startLoadingSensorCharts(userData.uid);
    }
});

function startLoadingSensorCharts(userUid) {
    const logsRef = query(ref(rtdb, `users_farms/${userUid}/sensor_logs`), limitToLast(10));
    onValue(logsRef, (snapshot) => {
        const logsData = snapshot.val();
        const timeLabels = [];
        const tempData = [];
        const moistData = [];
        const phData = [];

        if (logsData) {
            Object.keys(logsData).forEach((key) => {
                const log = logsData[key];
                let timeString = "รอบบันทึก";
                if (log.time) {
                    const date = new Date(log.time);
                    timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                }
                timeLabels.push(timeString);
                tempData.push(log.temp || 0);
                moistData.push(log.moist || 0);
                phData.push(log.ph !== undefined ? log.ph : 7.0);
            });

            renderCharts(timeLabels, tempData, moistData, phData);
        }
    });
}

function renderCharts(labels, tempVals, moistVals, phVals) {
    const ctxTemp = document.getElementById('tempChart')?.getContext('2d');
    const ctxMoist = document.getElementById('moistChart')?.getContext('2d');
    const ctxPh = document.getElementById('phChart')?.getContext('2d');

    if (!ctxTemp || !ctxMoist || !ctxPh) return;

    if (tempChartInstance) tempChartInstance.destroy();
    tempChartInstance = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'อุณหภูมิ (°C)', data: tempVals, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 3, tension: 0.3, fill: true }]
        },
        options: { responsive: true }
    });

    if (moistChartInstance) moistChartInstance.destroy();
    moistChartInstance = new Chart(ctxMoist, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'ความชื้น (%)', data: moistVals, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 3, tension: 0.3, fill: true }]
        },
        options: { responsive: true }
    });

    if (phChartInstance) phChartInstance.destroy();
    phChartInstance = new Chart(ctxPh, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'ค่า pH', data: phVals, borderColor: '#0d9488', backgroundColor: 'rgba(13, 148, 136, 0.1)', borderWidth: 3, tension: 0.3, fill: true }]
        },
        options: { responsive: true, scales: { y: { min: 0, max: 14 } } }
    });
}

// 🎯 ฟังก์ชัน Toggle แสดงผลกราฟนุ่มนวล
function toggleChart(sensorType) {
    const tempCard = document.getElementById("tempChartCard");
    const moistCard = document.getElementById("moistChartCard");
    const phCard = document.getElementById("phChartCard");

    let targetCard = null;
    if (sensorType === 'temp') targetCard = tempCard;
    if (sensorType === 'moist') targetCard = moistCard;
    if (sensorType === 'ph') targetCard = phCard;

    if (!targetCard) return;

    const isHidden = window.getComputedStyle(targetCard).display === "none";

    if (isHidden) {
        targetCard.style.display = "block";
        targetCard.style.opacity = "1";
        targetCard.style.transform = "translateY(0)";
        targetCard.classList.add("fade-in");
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        targetCard.classList.remove("fade-in");
        targetCard.style.opacity = "0";
        targetCard.style.transform = "translateY(-10px)";
        
        setTimeout(() => {
            targetCard.style.display = "none";
        }, 250);
    }
}

// 🎯 ผูก Event ให้การ์ดด้านบน (กดเปิด/ปิดกราฟ)
document.getElementById("clickTempCard")?.addEventListener("click", () => toggleChart('temp'));
document.getElementById("clickMoistCard")?.addEventListener("click", () => toggleChart('moist'));
document.getElementById("clickPhCard")?.addEventListener("click", () => toggleChart('ph'));

// ⚙️ ผูกปุ่มคำสั่ง Auto Mode
document.getElementById("userAutoOnBtn")?.addEventListener("click", async () => {
    if (currentLoggedUid) await setUserAutoMode(currentLoggedUid, true);
});
document.getElementById("userAutoOffBtn")?.addEventListener("click", async () => {
    if (currentLoggedUid) await setUserAutoMode(currentLoggedUid, false);
});

// 💧 ผูกปุ่มคำสั่ง Manual เปิด/ปิด ปั๊มน้ำ
document.getElementById("userPumpOnBtn")?.addEventListener("click", async () => {
    if (currentLoggedUid) await sendUserControlCommand(currentLoggedUid, true);
});
document.getElementById("userPumpOffBtn")?.addEventListener("click", async () => {
    if (currentLoggedUid) await sendUserControlCommand(currentLoggedUid, false);
});

// 🚪 ผูกปุ่มออกจากระบบ
document.getElementById("logoutBtn")?.addEventListener("click", () => logoutUser());