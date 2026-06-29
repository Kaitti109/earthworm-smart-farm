import { auth, db, rtdb } from "./firebase.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
          
          // 💡 แนบ uid ของแอดมินเข้าไปด้วย เพื่อให้หน้า UI ดึงสิทธิ์ไปใช้ดูโปรเจกต์ของตัวเองได้
          const adminData = userDocSnap.data();
          adminData.uid = user.uid;
          callback(adminData); 
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
    // สร้างเงื่อนไข: ไปที่คอลเลกชัน "users" และค้นหาเฉพาะคนที่มี role เท่ากับ "user"
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("role", "==", "user")); 
    
    const querySnapshot = await getDocs(q); // รันคำสั่งสแกนตามเงื่อนไขที่กรองไว้
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

// 4. ฟังก์ชันอัปเดตปรับเปลี่ยนสิทธิ์ผู้ใช้ (User <-> Admin) จากหน้าเว็บ (โค้ดเดิมของคุณ)
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

// 🚀 5. แก้ไขใหม่: สั่งการบอร์ด IoT ของแอดมินให้ตรงกับระบบ Multi-User (UID)
// เราเพิ่มตัวแปร targetUid เข้ามา เพื่อให้แอดมินสั่งเปิดปิดปั๊มของ User คนที่กำลังเลือกดูอยู่ได้ด้วย!
export async function sendControlCommand(targetUid, deviceState) {
  try {
    if (!targetUid) return false;

    // เปลี่ยนเส้นทางจาก 'control' เฉยๆ ให้กลายเป็นเจาะเข้าโฟลเดอร์ UID ของฟาร์มเป้าหมายเป๊ะๆ
    const controlRef = ref(rtdb, `users_farms/${targetUid}/controls`);
    await update(controlRef, {
      auto_mode: false,         // ปล่อยคำสั่ง Manual เข้าไปคุมบอร์ด
      pump_command: deviceState // ส่งค่าสั่งงานปั๊มน้ำ (true/false)
    });
    return true;
  } catch (error) {
    console.error("ส่งคำสั่งควบคุมบอร์ดจากสิทธิ์ Admin ไม่สำเร็จ:", error);
    return false;
  }
}