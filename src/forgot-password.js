import { auth } from "./firebase.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const forgotForm = document.getElementById("forgot-form");

forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("forgot-email").value.trim();

  try {
    // สั่ง Firebase Authentication ยิงอีเมลรีเซ็ตรหัสผ่านไปยังเป้าหมาย
    await sendPasswordResetEmail(auth, email);
    
    alert(`ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยัง ${email} เรียบร้อยแล้วครับ! กรุณาเช็กในกล่องจดหมายหรืออีเมลขยะ (Spam)`);
    
    // ส่งกลับไปหน้า Login เพื่อให้เขารอล็อกอินด้วยรหัสใหม่
    window.location.href = "/login.html";
    
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ต:", error.message);
    
    // แจ้งเตือนกรณีอีเมลผิด หรือไม่มีอีเมลนี้ในระบบ
    if (error.code === "auth/user-not-found") {
      alert("ไม่พบอีเมลนี้ในระบบคอมพิวเตอร์ครับ กรุณาตรวจสอบอีกครั้ง");
    } else {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  }
});