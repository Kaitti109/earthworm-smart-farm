import { checkUserLogin, logoutUser } from "./dashboard.js";

// 1. ดักฟังสถานะล็อกอินเพื่อเอาข้อมูลมาแสดงผล
checkUserLogin((userData) => {
    if (userData) {
        // อัปเดตข้อมูลบนเมนูบาร์ Navbar
        document.getElementById("navUserName").innerText = userData.username;

        // 🔒 ถ้าไม่ใช่ Admin ให้แอบซ่อนปุ่มเมนู Admin บนแถบเมนูออกไป
        if (userData.role !== "admin") {
            document.getElementById("adminMenuBtn").style.display = "none";
        }

        // นำข้อมูลผู้ใช้มาพ่นใส่การ์ดโปรไฟล์หลัก
        document.getElementById("profileUsername").innerText = userData.username;
        document.getElementById("profileEmail").innerText = userData.email;
        document.getElementById("profilePhone").innerText = userData.phone || "ยังไม่ได้ระบุ";
        document.getElementById("profileUid").innerText = userData.uid || "-";

        // ตกแต่งป้ายสิทธิ์เพิ่มเติม
        const roleBadge = document.getElementById("profileRole");
        roleBadge.innerText = userData.role || "user";
        if (userData.role === "admin") {
            roleBadge.classList.add("admin");
        }
    }
});

// 2. ผูกปุ่มออกจากระบบบน Navbar
document.getElementById("logoutBtn").addEventListener("click", () => {
    logoutUser();
});