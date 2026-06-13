import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// 🛠️ จุดที่ 1: เพิ่มคำสั่งเกี่ยวกับ Query ข้อมูลเพิ่มเติมในบรรทัดนี้
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🛠️ จุดที่ 2: เปลี่ยนชื่อจาก email เป็น identifier เพื่อให้สื่อความหมายว่ารับค่าได้หลากหลาย
export async function handleLogin(identifier, password) {
  try {
    let emailToLogin = identifier; // ตั้งค่าเริ่มต้นไว้ก่อนว่าผู้ใช้อาจจะพิมพ์เป็น Email ตรงๆ

    // 🛠️ จุดที่ 3: เพิ่มเงื่อนไขตรวจสอบและค้นหาข้อมูลผู้ใช้ในตาราง Firestore
    // ถ้าข้อความที่กรอกเข้ามา ไม่มีเครื่องหมาย @ แสดงว่าผู้ใช้กรอก Username หรือ เบอร์โทรศัพท์มา
    if (!identifier.includes("@")) {
      console.log("กำลังค้นหาบัญชีจาก Username หรือ เบอร์โทรศัพท์...");

      const usersRef = collection(db, "users");
      
      // ลองค้นหาจากฟิลด์ "username" ก่อน
      let q = query(usersRef, where("username", "==", identifier));
      let querySnapshot = await getDocs(q);

      // ถ้าค้นหาจาก username แล้วไม่เจอเอกสารอะไรเลย ให้เปลี่ยนไปค้นหาจากฟิลด์ "phone" แทน
      if (querySnapshot.empty) {
        q = query(usersRef, where("phone", "==", identifier));
        querySnapshot = await getDocs(q);
      }

      // ถ้าผลลัพธ์การค้นหาเจอข้อมูลในตาราง
      if (!querySnapshot.empty) {
        // ดึงข้อมูลในเอกสารอันแรกขึ้นมา แล้วสอยเอา Email ของบัญชีนั้นมาใช้ล็อกอิน
        const userDoc = querySnapshot.docs[0].data();
        emailToLogin = userDoc.email; 
        console.log(`พบข้อมูลบัญชี! แปลงค่าเป็นอีเมลสำหรับหลังบ้านสำเร็จ: ${emailToLogin}`);
      } else {
        // ถ้าเช็กทั้งสองทางแล้วยังไม่พบข้อมูลผู้ใช้รายนี้เลย ให้เด้งไปที่พาร์ทจับ Error ด้านล่าง
        throw new Error("ไม่พบข้อมูลชื่อผู้ใช้หรือเบอร์โทรศัพท์นี้ในระบบ");
      }
    }

    // ขั้นตอนที่ 1: ตรวจสอบอีเมลและรหัสผ่านกับ Firebase Auth (ใช้ตัวแปร emailToLogin ที่แปลงค่าเสร็จแล้ว)
    const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
    const user = userCredential.user;
    
    console.log("เข้าสู่ระบบสำเร็จ! UID คือ:", user.uid);

    // ขั้นตอนที่ 2: นำ UID ไปค้นหาข้อมูลใน Firestore คอลเลกชัน "users" (ตามโค้ดเดิมของคุณ)
    const docRef = doc(db, "users", user.uid);
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
    
    // 💡 เสริมดักจับข้อความแจ้งเตือน Error ของ Firebase ให้ยูสเซอร์อ่านเข้าใจง่ายขึ้น
    let friendlyMessage = error.message;
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
      friendlyMessage = "รหัสผ่านไม่ถูกต้อง หรือไม่มีบัญชีผู้ใช้นี้ในระบบ";
    }
    
    alert("เข้าสู่ระบบไม่สำเร็จ: " + friendlyMessage);
    return { success: false, error: friendlyMessage };
  }
}