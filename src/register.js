import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ฟังก์ชันสำหรับเรียกใช้งานตอนกด Submit ฟอร์มลงทะเบียน
export async function handleRegister(email, password, username, phone) {
  try {
    // 1. สมัครสมาชิกผ่าน Firebase Authentication (ระบบตรวจสอบสิทธิ์)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("สร้างบัญชีผู้ใช้ใน Auth สำเร็จ! UID คือ:", user.uid);

    // 2. นำข้อมูลส่วนตัวอื่นๆ ไปบันทึกลง Firestore โดยใช้ UID เป็นชื่อ Document เพื่อให้ผูกกัน
    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      phone: phone,
      createdAt: new Date().toISOString(),
      role: "user" // สามารถนำไปใช้แบ่งสิทธิ์ผู้ใช้งานได้ในอนาคต
    });

    alert("ลงทะเบียนและบันทึกข้อมูลเรียบร้อยแล้วครับ!");
    return true;

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลงทะเบียน:", error.message);
    alert("เกิดข้อผิดพลาด: " + error.message);
    return false;
  }
}