import { checkUserLogin, sendUserControlCommand, logoutUser } from "./dashboard.js";
import { rtdb } from "./firebase.js";
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let currentLoggedUid = "";

let tempChartInstance = null;
let moistChartInstance = null;
let phChartInstance = null;

// 1. ตรวจสอบสถานะการล็อกอินและซ่อนเมนูแอดมิน
checkUserLogin((userData) => {
    if (userData) {
        currentLoggedUid = userData.uid; 
        document.getElementById("userNameText").innerText = userData.username;

        if (userData.role !== "admin") {
            document.getElementById("adminMenuBtn").style.display = "none";
        }

        // 🚀 2. ดักฟังค่าการ์ดปัจจุบัน (Current Card)
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

        // 📊 🚀 3. ดักฟังประวัติการบันทึก Log ย้อนหลังเพื่อรอวาดกราฟและตาราง
        startLoadingSensorCharts(userData.uid);
    }
});

// 📊 ฟังก์ชันดึงประวัติ Log จาก Firebase
function startLoadingSensorCharts(userUid) {
    const logsRef = query(ref(rtdb, `users_farms/${userUid}/sensor_logs`), limitToLast(10));

    onValue(logsRef, (snapshot) => {
        const logsData = snapshot.val();
        
        const timeLabels = [];
        const tempData = [];
        const moistData = [];
        const phData = []; 

        let tableRowsHtml = "";

        if (logsData) {
            const logKeys = Object.keys(logsData).reverse();

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

            logKeys.forEach((key) => {
                const log = logsData[key];
                let fullDateTime = "ไม่ระบุเวลา";
                if (log.time) {
                    const date = new Date(log.time);
                    fullDateTime = `${date.toLocaleDateString('th-TH')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} น.`;
                }

                const tVal = log.temp !== undefined ? `${log.temp.toFixed(1)} °C` : '--';
                const mVal = log.moist !== undefined ? `${log.moist.toFixed(1)} %` : '--';
                const pVal = log.ph !== undefined ? log.ph.toFixed(1) : '7.0';

                tableRowsHtml += `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 16px; color: #334155; font-weight: 500;">${fullDateTime}</td>
                        <td style="padding: 12px 16px; color: #dc2626;">${tVal}</td>
                        <td style="padding: 12px 16px; color: #2563eb;">${mVal}</td>
                        <td style="padding: 12px 16px; color: #0d9488;">${pVal}</td>
                    </tr>
                `;
            });

            renderCharts(timeLabels, tempData, moistData, phData);

            const tableBody = document.getElementById("historyTableBody");
            if (tableBody) {
                tableBody.innerHTML = tableRowsHtml;
            }
        } else {
            const tableBody = document.getElementById("historyTableBody");
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #94a3b8;">❌ ยังไม่มีประวัติการบันทึกข้อมูลย้อนหลัง</td></tr>`;
            }
        }
    });
}

// 🎨 ฟังก์ชันจัดการโครงสร้างเส้นกราฟ Chart.js
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
            datasets: [{
                label: 'อุณหภูมิ (°C)',
                data: tempVals,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: { responsive: true }
    });

    if (moistChartInstance) moistChartInstance.destroy();
    moistChartInstance = new Chart(ctxMoist, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ความชื้น (%)',
                data: moistVals,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: { responsive: true }
    });

    if (phChartInstance) phChartInstance.destroy();
    phChartInstance = new Chart(ctxPh, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ค่า pH (กรด-ด่าง)',
                data: phVals,
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { min: 0, max: 14 }
            }
        }
    });
}

// 🎯 🚀 ฟังก์ชันเปิดโชว์กราฟแยกทีละชิ้นตามตัวที่คลิกเลือก
function showSpecificChart(sensorType) {
    const chartsSection = document.getElementById("chartsSection");
    const historySection = document.getElementById("history");
    
    const tempCard = document.getElementById("tempChartCard");
    const moistCard = document.getElementById("moistChartCard");
    const phCard = document.getElementById("phChartCard");

    if (chartsSection && historySection) {
        chartsSection.style.display = "grid";
        historySection.style.display = "block";

        tempCard.style.display = "none";
        moistCard.style.display = "none";
        phCard.style.display = "none";

        if (sensorType === 'temp') {
            tempCard.style.display = "block";
        } else if (sensorType === 'moist') {
            moistCard.style.display = "block";
        } else if (sensorType === 'ph') {
            phCard.style.display = "block";
        } else if (sensorType === 'all') {
            tempCard.style.display = "block";
            moistCard.style.display = "block";
            phCard.style.display = "block";
        }

        chartsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ผูก Event
document.getElementById("historyMenuBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showSpecificChart('all');
});

document.getElementById("clickTempCard")?.addEventListener("click", () => showSpecificChart('temp'));
document.getElementById("clickMoistCard")?.addEventListener("click", () => showSpecificChart('moist'));
document.getElementById("clickPhCard")?.addEventListener("click", () => showSpecificChart('ph'));

// 🚀 4. ผูกเหตุการณ์คลิกปุ่มควบคุมปั๊มน้ำ
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

// 5. ตั้งค่าปุ่มออกจากระบบ (Logout)
document.getElementById("logoutBtn").addEventListener("click", () => {
    logoutUser();
});