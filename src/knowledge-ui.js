import { checkUserLogin, logoutUser } from "./dashboard.js";

// 🎯 ตรวจสอบการล็อกอินและซ่อนเมนู Admin หากไม่มีสิทธิ์
checkUserLogin((userData) => {
    if (userData) {
        document.getElementById("userNameText").innerText = userData.username;
        if (userData.role !== "admin") {
            const adminBtn = document.getElementById("adminMenuBtn");
            if (adminBtn) adminBtn.style.display = "none";
        }
    }
});

// 🎯 ผูกปุ่ม Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => logoutUser());