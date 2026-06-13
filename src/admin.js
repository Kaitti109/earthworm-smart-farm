import { auth, db, rtdb } from "./firebase.js"; // 🚀 จุดที่ 1: เพิ่ม rtdb เข้ามาเพื่อใช้กับปั๊มน้ำ
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// 🚀 จุดที่ 2: เพิ่ม updateDoc เข้ามาเพื่อใช้สำหรับเปลี่ยนสิทธิ์สมาชิก
import { doc, getDoc, collection, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// 🚀 จุดที่ 3: นำเข้าฟังก์ชันสำหรับเขียนสั่งการไปยัง Realtime Database ของตัวบอร์ด IoT
import { ref, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. ฟังก์ชันตรวจสอบสิทธิ์ Admin (โค้ดเดิมของคุณ)
export function checkAdminPermission(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
          console.log("ยินดีต้อนรับรหัส Admin:", user.uid);
          callback(userDocSnap.data()); 
        } else {
          alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับ Admin เท่านั้น)");
          window.location.href = "./login.html";
        }
      } catch (error) {
        console.error("Error Checking Admin:", error);
        window.location.href = "./login.html";
      }
    } else {
      window.location.href = "./login.html";
    }
  });
}

// 2. ฟังก์ชันดึงรายชื่อสมาชิกทั้งหมดในระบบมาแสดงผล (โค้ดเดิมของคุณ)
export async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersList = [];
    querySnapshot.forEach((doc) => {
      usersList.push({ uid: doc.id, ...doc.data() });
    });
    return usersList;
  } catch (error) {
    console.error("ไม่สามารถดึงข้อมูลสมาชิกได้:", error);
    return [];
  }
}

// 3. ฟังก์ชันลบสมาชิกออกจากฐานข้อมูล (โค้ดเดิมของคุณ)
export async function deleteUserFromDB(uid) {
  try {
    await deleteDoc(doc(db, "users", uid));
    return true;
  } catch (error) {
    console.error("ลบข้อมูลไม่สำเร็จ:", error);
    return false;
  }
}

// 🚀 4. ฟังก์ชันที่ขาดไป: อัปเดตปรับเปลี่ยนสิทธิ์ผู้ใช้ (User <-> Admin) จากหน้าเว็บ
export async function updateUserRole(uid, newRole) {
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      role: newRole
    });
    return true;
  } catch (error) {
    console.error("เปลี่ยนสิทธิ์ไม่สำเร็จ:", error);
    return false;
  }
}

// 🚀 5. ฟังก์ชันที่ขาดไป: สั่งการบอร์ด IoT (ส่งค่า true/false ไปที่ปั๊มน้ำในฐานข้อมูล)
export async function sendControlCommand(deviceState) {
  try {
    // อ้างอิงไปยัง node ที่ชื่อว่า 'control' ใน Realtime Database
    const controlRef = ref(rtdb, 'control');
    await update(controlRef, {
      pump: deviceState // สั่งงานปั๊มไดอะแฟรม
    });
    return true;
  } catch (error) {
    console.error("ส่งคำสั่งควบคุมบอร์ดไม่สำเร็จ:", error);
    return false;
  }
}