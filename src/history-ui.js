// 🎯 นำเข้าโมดูลจากไฟล์ระบบหลักของกัมมี่
import { checkUserLogin, logoutUser } from "./dashboard.js";
import { rtdb } from "./firebase.js";
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let tempChartInstance = null;
let moistChartInstance = null;
let phChartInstance = null;

// 1. ตรวจสอบสถานะการล็อกอินก่อนดึงข้อมูล
checkUserLogin((userData) => {
    if (userData) {
        document.getElementById("userNameText").innerText = userData.username;

        // ซ่อนปุ่มแอดมินหากยูสเซอร์ทั่วไปเข้ามา
        if (userData.role !== "admin") {
            document.getElementById("adminMenuBtn").style.display = "none";
        }

        // 🚀 เรียกดึงข้อมูลประวัติ Log ทันทีที่โหลดหน้านี้สำเร็จ
        startLoadingSensorCharts(userData.uid);
    }
});

// 📊 ฟังก์ชันดึงประวัติ Log มาพลอตกราฟและเรนเดอร์ตารางย้อนหลัง
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
                tableBody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #94a3b8;">❌ ยังไม่มีประวัติการบันทึกข้อมูลย้อนหลังในระบบ</td></tr>`;
            }
        }
    });
}

// 🎨 ฟังก์ชันจัดสเปก Chart.js
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

    // ปุ่มออกจากระบบ
    document.getElementById("logoutBtn").addEventListener("click", () => {
        logoutUser();
    });