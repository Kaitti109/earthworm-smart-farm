import { checkUserLogin, logoutUser } from "./dashboard.js";
// นำเข้า Firestore เพิ่มเติมเพื่อใช้อ่านข้อมูลในกรณีที่แอดมินส่องดูคนอื่น
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. ดักฟังสถานะล็อกอินของผู้ใช้ปัจจุบัน
checkUserLogin(async (currentUserData) => {
    if (currentUserData) {
        // อัปเดตข้อมูลบนเมนูบาร์ Navbar ของคนที่กำลังเปิดเว็บอยู่
        document.getElementById("navUserName").innerText = currentUserData.username;

        // 🔒 ถ้าผู้ใช้ปัจจุบันไม่ใช่ Admin ให้แอบซ่อนปุ่มเมนู Admin ออกไป
        if (currentUserData.role !== "admin") {
            document.getElementById("adminMenuBtn").style.display = "none";
        }

        // 🔍 ตรวจสอบว่ามีการส่งค่า ?uid=XXXXX มาบน URL หรือไม่ (กรณีแอดมินกดส่อง)
        const urlParams = new URLSearchParams(window.location.search);
        const targetUid = urlParams.get("uid");

        let displayData = currentUserData; // ค่าเริ่มต้นที่จะโชว์คือตัวเราเอง

        // เงื่อนไข: ถ้ามีไอดีเป้าหมายส่งมา และคนกดมีสิทธิ์เป็นแอดมิน
        if (targetUid && currentUserData.role === "admin") {
            console.log("แอดมินกำลังตรวจสอบโปรไฟล์ของ UID:", targetUid);
            
            try {
                // ดึงข้อมูลของ User คนที่เรากดจิ้มมาจากตารางตรงๆ
                const userDocRef = doc(db, "users", targetUid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    displayData = userDocSnap.data();
                    displayData.uid = targetUid; // แนบ uid เข้าไปด้วย
                    
                    // ปรับแต่ง UI เล็กน้อยให้แอดมินรู้ว่ากำลังส่องคนอื่นอยู่
                    document.querySelector(".profile-card h2").style.color = "#2563eb";
                }
            } catch (error) {
                console.error("ไม่สามารถโหลดโปรไฟล์เป้าหมายได้:", error);
            }
        }

        // 3. นำข้อมูลไปพ่นแสดงผลบนการ์ดโปรไฟล์ (รองรับทั้งดูตัวเองและส่องคนอื่น)
        document.getElementById("profileUsername").innerText = displayData.username;
        document.getElementById("profileEmail").innerText = displayData.email;
        document.getElementById("profilePhone").innerText = displayData.phone || "ยังไม่ได้ระบุ";
        document.getElementById("profileUid").innerText = displayData.uid || currentUserData.uid;

        // ตกแต่งป้ายสิทธิ์
        const roleBadge = document.getElementById("profileRole");
        roleBadge.innerText = displayData.role || "user";
        
        // ล้างคลาสเก่าออกก่อนเพื่อป้องกันการซ้อนทับ
        roleBadge.classList.remove("admin");
        if (displayData.role === "admin") {
            roleBadge.classList.add("admin");
        }
    }
});

// 2. ผูกปุ่มออกจากระบบบน Navbar
document.getElementById("logoutBtn").addEventListener("click", () => {
    logoutUser();
});