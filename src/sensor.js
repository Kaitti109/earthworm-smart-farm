// 🎯 นำเข้าโมดูลส่งออกของกัมมี่ (บ้านหลังที่ 2 จากเซสชัน Multi-App)
import { rtdb } from "./firebase.js"; 
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/**
 * 📡 ฟังก์ชันหลักสำหรับเปิดดักฟัง (Listen) ค่าเซนเซอร์ฟาร์มไส้เดือนจาก Realtime DB
 * @param {string} userUid - UID ของผู้ใช้รายบุคคล เพื่อแยกกระถาง/แยกฟาร์ม
 */
export function startListeningToSensorData(userUid) {
  if (!userUid) {
    console.error("❌ ไม่สามารถดึงข้อมูลได้: เนื่องจากไม่มีข้อมูล UID");
    return;
  }

  // 1. ชี้เป้าตำแหน่งโฟลเดอร์ให้ตรงกับที่ ESP32 ยิงขึ้นไปคือ /users_farms/UID/current
  const currentSensorRef = ref(rtdb, `users_farms/${userUid}/current`);

  // 2. เฝ้าดักฟังการเปลี่ยนแปลงแบบ Realtime
  onValue(currentSensorRef, (snapshot) => {
    const data = snapshot.val();
    
    // ดักจับกล่องแสดงผลบนหน้าจอ HTML 
    const tempEl = document.getElementById("tempDisplay");
    const moistEl = document.getElementById("moistDisplay");
    const modeEl = document.getElementById("modeDisplay");
    const pumpEl = document.getElementById("pumpStatusDisplay");

    if (data) {
      console.log("🟢 ข้อมูลเซนเซอร์จากบอร์ด ESP32 อัปเดตล่าสุด:", data);

      if (tempEl) tempEl.innerText = data.temp !== undefined ? `${data.temp.toFixed(1)} °C` : '-- °C';
      if (moistEl) moistEl.innerText = data.moist !== undefined ? `${data.moist.toFixed(1)} %` : '-- %';
      
      if (modeEl) {
        modeEl.innerText = data.auto_status ? "🤖 โหมดอัตโนมัติ (AUTO)" : "🎮 ควบคุมเอง (MANUAL)";
        modeEl.style.color = data.auto_status ? "#3b82f6" : "#f59e0b";
      }

      if (pumpEl) {
        pumpEl.innerText = data.pump_status ? "⚡ ปั๊มน้ำกำลังทำงาน (ON)" : "💤 ปั๊มน้ำหยุดทำงาน (OFF)";
        pumpEl.style.color = data.pump_status ? "#10b981" : "#ef4444";
      }
    } else {
      console.warn("⚠️ เชื่อมต่อฐานข้อมูลได้ แต่ยังไม่มีข้อมูลของ UID นี้ส่งมาจากฮาร์ดแวร์");
      if (tempEl) tempEl.innerText = "รอการเชื่อมต่อจากบอร์ด..";
      if (moistEl) moistEl.innerText = "รอการเชื่อมต่อจากบอร์ด..";
    }
  }, (error) => {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูล Realtime DB:", error);
  });
}