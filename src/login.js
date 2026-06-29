import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// 🎯 เพิ่มอัปเดตบรรทัดที่ 3: เพิ่มคำว่า updateDoc เข้ามาในรายการ import
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function handleLogin(identifier, password) {
  try {
    let emailToLogin = identifier; 

    // ตรวจสอบกรณีที่ผู้ใช้กรอก Username หรือ เบอร์โทรศัพท์มา (โค้ดเดิมที่เขียนไว้ดีมาก)
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
        console.log(`พบข้อมูลบัญชี! แปลงค่าเป็นอีเมลสำหรับหลังบ้านสำเร็จ: ${emailToLogin}`);
      } else {
        throw new Error("ไม่พบข้อมูลชื่อผู้ใช้หรือเบอร์โทรศัพท์นี้ในระบบ");
      }
    }

    // ขั้นตอนที่ 1: ตรวจสอบอีเมลและรหัสผ่านกับ Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
    const user = userCredential.user;
    
    console.log("เข้าสู่ระบบสำเร็จ! UID คือ:", user.uid);

    // 🎯 🔑 จุดที่เพิ่มใหม่: จังหวะนี้ล็อกอินผ่านแปลว่ารหัสถูกต้องแล้ว 
    // สั่งให้อัปเดตค่าพาสเวิร์ดที่เขากรอกเข้ามาทับลงฟีลด์ password ใน Firestore ทันที (รองรับกรณีเขาเพิ่งรีเซ็ตรหัสผ่านมา)
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
      password: password
    });
    console.log("ซิงค์รหัสผ่านล่าสุดลง Firestore สำเร็จ!");

    // ขั้นตอนที่ 2: ดึงข้อมูลขึ้นมาแสดงผลตามปกติ (ตามโค้ดเดิมของคุณ)
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log("ดึงข้อมูลจาก Database สำเร็จ:", userData);
      return { success: true, data: userData };
    } else {
      console.log("ไม่พบข้อมูลผู้ใช้ใน Database!");
      return { success: true, data: null };
    }

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error.message);
    
    let friendlyMessage = error.message;
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
      friendlyMessage = "รหัสผ่านไม่ถูกต้อง หรือไม่มีบัญชีผู้ใช้นี้ในระบบ";
    }
    
    alert("เข้าสู่ระบบไม่สำเร็จ: " + friendlyMessage);
    return { success: false, error: friendlyMessage };
  }
}