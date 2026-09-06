import { checkUserLogin, logoutUser } from "./dashboard.js";
import { db } from "./firebase.js";
// 📌 นำเข้า updateDoc เพิ่มเติม สำหรับบันทึกข้อมูลใหม่ลงฐานข้อมูล
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ดึง Element สำหรับระบบแก้ไขชื่อ
const profileUsername = document.getElementById("profileUsername");
const editNameInput = document.getElementById("editNameInput");
const editNameBtn = document.getElementById("editNameBtn");
const saveNameBtn = document.getElementById("saveNameBtn");
const navUserName = document.getElementById("navUserName");

let currentDisplayUid = null; // ตัวแปรเก็บ UID ปัจจุบันที่กำลังแสดงผลหน้าจอ

// 1. ดักฟังสถานะล็อกอินของผู้ใช้ปัจจุบัน
checkUserLogin(async (currentUserData) => {
    if (currentUserData) {
        // อัปเดตข้อมูลบนเมนูบาร์ Navbar ของคนที่กำลังเปิดเว็บอยู่
        navUserName.innerText = currentUserData.username;

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

        // เก็บค่า UID ของคนที่กำลังแสดงผลหน้าโปรไฟล์ไว้สำหรับใช้อัปเดตชื่อ
        currentDisplayUid = displayData.uid || currentUserData.uid;

        // 3. นำข้อมูลไปพ่นแสดงผลบนการ์ดโปรไฟล์ (รองรับทั้งดูตัวเองและส่องคนอื่น)
        profileUsername.innerText = displayData.username;
        document.getElementById("profileEmail").innerText = displayData.email;
        document.getElementById("profilePhone").innerText = displayData.phone || "ยังไม่ได้ระบุ";
        document.getElementById("profileUid").innerText = currentDisplayUid;

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

// ==========================================
// 🚀 ระบบแก้ไขชื่อผู้ใช้งาน (บันทึกลง Firestore)
// ==========================================
editNameBtn.addEventListener("click", () => {
    editNameInput.value = profileUsername.innerText; 
    
    // สลับการแสดงผล
    profileUsername.style.display = "none";
    editNameBtn.style.display = "none";
    editNameInput.style.display = "block";
    saveNameBtn.style.display = "flex"; 
    
    editNameInput.focus();
});

saveNameBtn.addEventListener("click", async () => {
    const newName = editNameInput.value.trim();
    
    if (newName === "") {
        alert("กรุณากรอกชื่อให้ครบถ้วน");
        return;
    }

    if (!currentDisplayUid) return;

    try {
        // อัปเดตข้อมูล field 'username' ลงใน Document ของผู้ใช้นั้นๆ
        const userRef = doc(db, "users", currentDisplayUid);
        await updateDoc(userRef, { 
            username: newName 
        });

        // อัปเดตข้อมูลบนหน้าจอ
        profileUsername.innerText = newName;
        
        // ถ้านี่คือโปรไฟล์ตัวเอง ให้เปลี่ยนชื่อบน Navbar ด้วย
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get("uid")) {
            navUserName.innerText = newName;
        }
        
        // สลับกลับสู่โหมดแสดงผลปกติ
        editNameInput.style.display = "none";
        saveNameBtn.style.display = "none";
        profileUsername.style.display = "block";
        editNameBtn.style.display = "flex";
        
    } catch (error) {
        console.error("Error updating name:", error);
        alert("ไม่สามารถบันทึกชื่อได้ โปรดตรวจสอบสิทธิ์การแก้ไข (Firestore Rules)");
    }
});

// 2. ผูกปุ่มออกจากระบบบน Navbar
document.getElementById("logoutBtn").addEventListener("click", () => {
    logoutUser();
});