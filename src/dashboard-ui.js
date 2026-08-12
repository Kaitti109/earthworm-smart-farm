import { checkUserLogin, sendUserControlCommand, logoutUser, sendTelegramNotification } from "./dashboard.js";
import { rtdb } from "./firebase.js";
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let currentLoggedUid = "";
let tempChartInstance = null;
let moistChartInstance = null;
let phChartInstance = null;

// 🎯 ตัวแปรควบคุมการส่งแจ้งเตือน Telegram (ป้องกันการส่งย้ำๆ ทุกครั้งที่ค่าอัปเดต)
let isTempAlertSent = false; 

checkUserLogin((userData) => {
    if (userData) {
        currentLoggedUid = userData.uid; 
        document.getElementById("userNameText").innerText = userData.username;

        if (userData.role !== "admin") {
            const adminBtn = document.getElementById("adminMenuBtn");
            if (adminBtn) adminBtn.style.display = "none";
        }

        // 1. ดักฟังค่าการ์ดเซนเซอร์ปัจจุบัน + แจ้งเตือน Telegram เมื่ออุณหภูมิสูงเกินไป
        const currentSensorRef = ref(rtdb, `users_farms/${userData.uid}/current`);
        onValue(currentSensorRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const temp = data.temp !== undefined ? data.temp : null;

                document.getElementById("tempVal").innerText = temp !== null ? temp.toFixed(1) : "--";
                document.getElementById("humidityVal").innerText = data.moist !== undefined ? data.moist.toFixed(1) : "--";
                document.getElementById("phVal").innerText = data.ph !== undefined ? data.ph : "--";

                const statusText = document.getElementById("userPumpStatus");
                if (data.pump_status === true) {
                    statusText.innerText = "🟢 บอร์ดทำงาน: เปิดปั๊มน้ำอยู่";
                    statusText.style.color = "#10b981";
                } else {
                    statusText.innerText = "🔴 บอร์ดทำงาน: ปิดปั๊มน้ำอยู่";
                    statusText.style.color = "#ef4444";
                }

                // 📲 เช็กอุณหภูมิเพื่อยิงแจ้งเตือนเข้า Telegram
                if (temp !== null) {
                    if (temp >= 32.0 && !isTempAlertSent) {
                        // แจ้งเตือนเมื่อร้อนเกิน 32°C (ตั้งค่าตัวเลขเกณฑ์อุณหภูมิได้ตามต้องการ)
                        sendTelegramNotification(
                            `🌡️ <b>[เตือนอุณหภูมิสูงเกินเกณฑ์!]</b>\n` +
                            `อุณหภูมิเบดดิ้งปัจจุบัน: <b>${temp.toFixed(1)} °C</b> ⚠️\n` +
                            `สภาพแวดล้อมเริ่มร้อนเกินไปสำหรับไส้เดือน AF กรุณาตรวจสอบหรือสั่งเปิดปั๊มพ่นหมอก`
                        );
                        isTempAlertSent = true; // ล็อกไว้ไม่ให้ยิงข้อความรัว
                    } else if (temp <= 30.0 && isTempAlertSent) {
                        // ปลดล็อกเมื่ออุณหภูมิเย็นลงมาอยู่ในระดับปกติ (ต่ำกว่า 30°C)
                        isTempAlertSent = false; 
                    }
                }
            }
        });

        // 2. ดึง Log ย้อนหลังสแตนด์บายไว้ให้พร้อมวาดกราฟ
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

// 🎯 ปุ่มควบคุมปั๊ม (แจ้งเตือน Telegram อัตโนมัติจากใน sendUserControlCommand)
document.getElementById("userPumpOnBtn")?.addEventListener("click", async () => {
    if (currentLoggedUid) await sendUserControlCommand(currentLoggedUid, true);
});
document.getElementById("userPumpOffBtn")?.addEventListener("click", async () => {
    if (currentLoggedUid) await sendUserControlCommand(currentLoggedUid, false);
});

document.getElementById("logoutBtn")?.addEventListener("click", () => logoutUser());