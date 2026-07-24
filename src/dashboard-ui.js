import { checkUserLogin, sendUserControlCommand, logoutUser } from "./dashboard.js";
import { rtdb } from "./firebase.js";
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let currentLoggedUid = "";
let tempChartInstance = null;
let moistChartInstance = null;
let phChartInstance = null;

checkUserLogin((userData) => {
    if (userData) {
        currentLoggedUid = userData.uid; 
        document.getElementById("userNameText").innerText = userData.username;

        if (userData.role !== "admin") {
            document.getElementById("adminMenuBtn").style.display = "none";
        }

        // 1. ดักฟังค่าการ์ดเซนเซอร์ปัจจุบัน
        const currentSensorRef = ref(rtdb, `users_farms/${userData.uid}/current`);
        onValue(currentSensorRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                document.getElementById("tempVal").innerText = data.temp !== undefined ? data.temp.toFixed(1) : "--";
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

// 🎯 ฟังก์ชัน Toggle แสดงผลทันทีเมื่อกด และค่อยๆ จางหาย (Fade Out) เมื่อกดซ่อน
function toggleChart(sensorType) {
    const tempCard = document.getElementById("tempChartCard");
    const moistCard = document.getElementById("moistChartCard");
    const phCard = document.getElementById("phChartCard");

    let targetCard = null;
    if (sensorType === 'temp') targetCard = tempCard;
    if (sensorType === 'moist') targetCard = moistCard;
    if (sensorType === 'ph') targetCard = phCard;

    if (!targetCard) return;

    // เช็คว่าปัจจุบันซ่อนอยู่ หรือเปิดอยู่
    const isHidden = window.getComputedStyle(targetCard).display === "none";

    if (isHidden) {
        // 🟢 เปิดกราฟทันที พร้อมใส่ Animation จางขึ้นมาอย่างนุ่มนวล
        targetCard.style.display = "block";
        targetCard.style.opacity = "1";
        targetCard.style.transform = "translateY(0)";
        targetCard.classList.add("fade-in");
        
        // เลื่อนหน้าจอลงมาดูอย่างสมูท
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // 🔴 ปิดซ่อน: ค่อยๆ จางลง (Fade Out) ก่อนที่จะสั่ง display = "none"
        targetCard.classList.remove("fade-in");
        targetCard.style.opacity = "0";
        targetCard.style.transform = "translateY(-10px)";
        
        setTimeout(() => {
            targetCard.style.display = "none";
        }, 250); // รอเล่น Animation ให้จบ 0.25 วินาทีแล้วค่อยซ่อน
    }
}

// 🎯 ผูก Event ให้การ์ดด้านบน (กดครั้งแรกเปิด กดซ้ำปิด)
document.getElementById("clickTempCard")?.addEventListener("click", () => toggleChart('temp'));
document.getElementById("clickMoistCard")?.addEventListener("click", () => toggleChart('moist'));
document.getElementById("clickPhCard")?.addEventListener("click", () => toggleChart('ph'));

// ปุ่มควบคุมปั๊ม
document.getElementById("userPumpOnBtn").addEventListener("click", async () => {
    if (currentLoggedUid) await sendUserControlCommand(currentLoggedUid, true);
});
document.getElementById("userPumpOffBtn").addEventListener("click", async () => {
    if (currentLoggedUid) await sendUserControlCommand(currentLoggedUid, false);
});

document.getElementById("logoutBtn").addEventListener("click", () => logoutUser());