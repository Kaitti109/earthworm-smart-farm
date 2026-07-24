import { checkUserLogin, logoutUser } from "./dashboard.js";

// 🎯 เช็คการล็อกอินและซ่อนเมนูแอดมินถ้าสิทธิ์ไม่ใช่ admin
checkUserLogin((userData) => {
    if (userData) {
        document.getElementById("userNameText").innerText = userData.username;
        if (userData.role !== "admin") {
            const adminBtn = document.getElementById("adminMenuBtn");
            if (adminBtn) adminBtn.style.display = "none";
        }
    }
});

// 🎯 ตั้งค่าปุ่ม Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => logoutUser());