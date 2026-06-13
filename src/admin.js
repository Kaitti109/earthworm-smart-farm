import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. ฟังก์ชันตรวจสอบสิทธิ์ Admin (ถ้าไม่ใช่ Admin ให้เด้งออกทันที)
export function checkAdminPermission(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
          console.log("ยินดีต้อนรับรหัส Admin:", user.uid);
          callback(userDocSnap.data()); // สิทธิ์ถูกต้อง ส่งข้อมูลกลับไปหน้าเว็บ
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

// 2. ฟังก์ชันดึงรายชื่อสมาชิกทั้งหมดในระบบมาแสดงผล
export async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersList = [];
    querySnapshot.forEach((doc) => {
      // ดึงข้อมูลผู้ใช้พร้อมกับแนบ UID (doc.id) ไปด้วย
      usersList.push({ uid: doc.id, ...doc.data() });
    });
    return usersList;
  } catch (error) {
    console.error("ไม่สามารถดึงข้อมูลสมาชิกได้:", error);
    return [];
  }
}

// 3. ฟังก์ชันลบสมาชิกออกจากฐานข้อมูล (ตัวอย่างการจัดการระบบ)
export async function deleteUserFromDB(uid) {
  try {
    await deleteDoc(doc(db, "users", uid));
    return true;
  } catch (error) {
    console.error("ลบข้อมูลไม่สำเร็จ:", error);
    return false;
  }
}