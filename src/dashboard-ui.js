import { checkUserLogin, sendUserControlCommand, logoutUser } from "./dashboard.js";
// 🎯 ดึงบ้าน rtdb และ SDK เพื่อเปิดการส่องข้อมูลเซนเซอร์แบบสดๆ (Realtime)
import { rtdb } from "./firebase.js";
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// สร้างตัวแปรส่วนกลางสำหรับเก็บอินสแตนซ์ของกราฟ (ป้องกันบั๊กกราฟซ้อนซ่อนเงื่อนเวลาอัปเดต)
let tempChartInstance = null;
let moistChartInstance = null;
let phChartInstance = null;

// สเต็ปที่ 1: ตรวจสอบล็อกอิน เมื่อผ่านแล้วให้เริ่มกระบวนการส่องบอร์ด ESP32
checkUserLogin((userData) => {
    if (userData) {
        // แปะชื่อผู้ใช้ฟาร์มไส้เดือนโชว์บนหน้าจอ
        if (document.getElementById("usernameDisplay")) {
            document.getElementById("usernameDisplay").innerText = userData.username;
        }

        // 🚀 เปิดสวิตช์เฝ้าส่องเซนเซอร์ ESP32 ค่าปัจจุบัน ทันที!
        startListeningToSensorData(userData.uid);
        
        // 📊 สั่งดึงข้อมูลประวัติ Log มาพลอตกราฟทั้ง 3 ตัวพร้อมกัน
        startLoadingSensorCharts(userData.uid);
        
        // ผูก Event ให้ปุ่มกดสั่งงานปั๊มน้ำ (Manual) บนหน้าเว็บฝั่ง User
        setupControlButtons(userData.uid);
    }
});

// สเต็ปที่ 2: ฟังก์ชันดักฟังค่าปัจจุบันจาก Realtime DB ยิงโชว์บนกล่องข้อความ HTML
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

// 📊 สเต็ปเสริม: ฟังก์ชันดึงประวัติ Log จาก Firebase มาวาดกราฟแบบ Realtime
function startLoadingSensorCharts(userUid) {
    if (!userUid) return;

    // ชี้เป้าไปที่โฟลเดอร์ sensor_logs ดึงมาแค่ 10 ค่าล่าสุดเพื่อไม่ให้กราฟแน่นเกินไป
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
                
                // แปลงเวลาเซิร์ฟเวอร์ Timestamp เป็นเวลาชั่วโมง:นาทีให้อ่านง่าย
                let timeString = "รอบบันทึก";
                if (log.time) {
                    const date = new Date(log.time);
                    timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                }
                
                timeLabels.push(timeString);
                tempData.push(log.temp || 0);
                moistData.push(log.moist || 0);
                
                // 🧪 ถ้าบอร์ดยังไม่ส่งค่า pH สกอร์ในโค้ดจะโยน 7.0 สแตนด์บายไว้ให้กราฟโชว์เส้นรอก่อนครับ
                phData.push(log.ph !== undefined ? log.ph : 7.0); 
            });

            // ส่งอาเรย์ข้อมูลไปวาดกราฟลงหน้าจอ
            renderCharts(timeLabels, tempData, moistData, phData);
        }
    });
}

// 🎨 ฟังก์ชันตั้งค่าและประกอบเส้นกราฟด้วย Chart.js
function renderCharts(labels, tempVals, moistVals, phVals) {
    const ctxTemp = document.getElementById('tempChart')?.getContext('2d');
    const ctxMoist = document.getElementById('moistChart')?.getContext('2d');
    const ctxPh = document.getElementById('phChart')?.getContext('2d'); 

    if (!ctxTemp || !ctxMoist || !ctxPh) return;

    // --- กราฟที่ 1: อุณหภูมิ ---
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

    // --- กราฟที่ 2: ความชื้น ---
    if (moistChartInstance) moistChartInstance.destroy();
    moistChartInstance = new Chart(ctxMoist, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ความชื้นมูลไส้เดือน (%)',
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

    // --- กราฟที่ 3: ค่า pH (สแตนด์บายรออุปกรณ์ในอนาคต) ---
    if (phChartInstance) phChartInstance.destroy();
    phChartInstance = new Chart(ctxPh, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ค่าความเป็นกรด-ด่าง (pH)',
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
                y: { min: 0, max: 14 } // บังคับสเกล pH ให้สวยงามตามหลักวิทยาศาสตร์ 0 - 14
            }
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
            const success = await sendUserControlCommand(userUid, true); 
            if (success && statusText) statusText.innerText = "ส่งคำสั่ง: เปิดปั๊มน้ำสำเร็จ";
        });
    }

    if (btnOff) {
        btnOff.addEventListener("click", async () => {
            if (statusText) statusText.innerText = "⚡ กำลังส่งคำสั่งปิด...";
            const success = await sendUserControlCommand(userUid, false); 
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