import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🎯 ฟังก์ชันแสดง Custom Alert ป๊อปอัพสีมนๆ สดใส
export function showCustomAlert(message, type = "error", duration = 3000) {
    const alertBox = document.getElementById("customAlert");
    const alertMessage = document.getElementById("alertMessage");
    const alertIcon = document.getElementById("alertIcon");

    if (alertBox && alertMessage) {
        alertMessage.innerText = message;
        alertBox.classList.remove("error-theme", "success-theme");

        if (type === "error") {
            alertBox.classList.add("error-theme");
            if (alertIcon) alertIcon.innerText = "⚠️";
        } else {
            alertBox.classList.add("success-theme");
            if (alertIcon) alertIcon.innerText = "🟢";
        }

        alertBox.classList.add("show");

        setTimeout(() => {
            alertBox.classList.remove("show");
        }, duration);
    }
}

export async function handleLogin(identifier, password) {
  try {
    let emailToLogin = identifier; 

    if (!identifier.includes("@")) {
      console.log("กำลังค้นหาบัญชีจาก Username หรือ เบอร์โทรศัพท์...");

      const usersRef = collection(db, "users");
      let q = query(usersRef, where("username", "==", identifier));
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        q = query(usersRef, where("phone", "==", identifier));
        querySnapshot = await getDocs(q);
      }

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        emailToLogin = userDoc.email; 
        console.log(`พบข้อมูลบัญชี! แปลงค่าเป็นอีเมลสำเร็จ: ${emailToLogin}`);
      } else {
        throw new Error("ไม่พบข้อมูลชื่อผู้ใช้หรือเบอร์โทรศัพท์นี้ในระบบ");
      }
    }

    // ขั้นตอนที่ 1: ตรวจสอบอีเมลและรหัสผ่านกับ Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
    const user = userCredential.user;
    
    console.log("เข้าสู่ระบบสำเร็จ! UID คือ:", user.uid);

    // ซิงค์รหัสผ่านทับ Firestore
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, { password: password });

    // ขั้นตอนที่ 2: ดึงข้อมูลผู้ใช้
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      userData.password = password; 
      return { success: true, data: userData };
    } else {
      return { success: true, data: null };
    }

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error.message);
    
    let friendlyMessage = error.message;
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
      friendlyMessage = "ชื่อผู้ใช้ไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง!";
    }
    
    // 🎯 เรียกใช้ Custom Alert แทน alert() เดิม
    showCustomAlert(friendlyMessage, "error");
    return { success: false, error: friendlyMessage };
  }
}