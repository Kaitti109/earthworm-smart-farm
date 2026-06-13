import { checkAdminPermission, getAllUsers, deleteUserFromDB, updateUserRole, sendControlCommand } from "./admin.js";
import { logoutUser } from "./dashboard.js";

// สร้างตัวแปรส่วนกลางสำหรับเก็บ UID ของแอดมินเอง (กรณีเปิดเข้ามาดูฟาร์มตัวเอง)
let adminUid = "";

// 1. ตรวจสิทธิ์ Admin ตอนเข้าหน้าเว็บ
checkAdminPermission((adminData) => {
    // 💡 เก็บ UID ของแอดมินเอาไว้ใช้งาน
    adminUid = adminData.uid; 
    document.getElementById("adminName").innerText = adminData.username;
    renderUserTable();
});

// 2. อัปเดตฟังก์ชันวาดตาราง: เพิ่มปุ่ม "ดูโปรไฟล์" เข้าไปในคอลัมน์การจัดการ (คงเดิม)
async function renderUserTable() {
    const users = await getAllUsers();
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";

    users.forEach(user => {
        const tr = document.createElement("tr");
        const isAdmin = user.role === 'admin';
        const roleSelect = `
            <select class="role-select" data-uid="${user.uid}">
                <option value="user" ${!isAdmin ? 'selected' : ''}>User</option>
                <option value="admin" ${isAdmin ? 'selected' : ''}>Admin</option>
            </select>
        `;

        tr.innerHTML = `
            <td>${user.username || 'ไม่ระบุ'}</td>
            <td>${user.email}</td>
            <td>${user.phone || '-'}</td>
            <td>${roleSelect}</td>
            <td>
                <button class="btn-view-profile" data-uid="${user.uid}" style="background-color: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 5px;">ดูโปรไฟล์</button>
                <button class="btn-delete" data-uid="${user.uid}">ลบสมาชิก</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    addTableEvents();
}

// 3. อัปเดตการผูก Event: ดักฟังปุ่มกดดูโปรไฟล์ (คงเดิม)
function addTableEvents() {
    document.querySelectorAll(".btn-view-profile").forEach(button => {
        button.addEventListener("click", (e) => {
            const uid = e.target.getAttribute("data-uid");
            window.location.href = `./profile.html?uid=${uid}`;
        });
    });

    document.querySelectorAll(".role-select").forEach(select => {
        select.addEventListener("change", async (e) => {
            const uid = e.target.getAttribute("data-uid");
            const newRole = e.target.value;
            const success = await updateUserRole(uid, newRole);
            if (success) { alert("อัปเดตสิทธิ์ผู้ใช้เรียบร้อยแล้ว!"); }
        });
    });

    document.querySelectorAll(".btn-delete").forEach(button => {
        button.addEventListener("click", async (e) => {
            const uid = e.target.getAttribute("data-uid");
            if (confirm("คุณแน่ใจใช่ไหมที่จะลบสมาชิกคนนี้?")) {
                const success = await deleteUserFromDB(uid);
                if (success) { renderUserTable(); }
            }
        });
    });
}

// 🚀 4. ปรับปรุงใหม่: ผูก Event ปุ่มควบคุมบอร์ด IoT โดยส่ง UID แนบไปด้วยให้ตรงกับฟังก์ชันใหม่
document.getElementById("pumpOnBtn").addEventListener("click", async () => {
    // ดึงค่า UID จาก URL (กรณีแอดมินส่องโปรไฟล์คนอื่นอยู่แล้วเปิดหน้าควบคุมมา) ถ้าไม่มีให้ใช้ UID แอดมินเอง
    const urlParams = new URLSearchParams(window.location.search);
    const targetUid = urlParams.get("uid") || adminUid;

    if (targetUid) {
        document.getElementById("controlStatus").innerText = "⚡ กำลังส่งคำสั่งเปิด...";
        const success = await sendControlCommand(targetUid, true); // 💡 ส่ง targetUid พ่วงไปด้วย
        if (success) { document.getElementById("controlStatus").innerText = "ส่งคำสั่ง: เปิดปั๊มน้ำสำเร็จ"; }
    }
});

document.getElementById("pumpOffBtn").addEventListener("click", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUid = urlParams.get("uid") || adminUid;

    if (targetUid) {
        document.getElementById("controlStatus").innerText = "⚡ กำลังส่งคำสั่งปิด...";
        const success = await sendControlCommand(targetUid, false); // 💡 ส่ง targetUid พ่วงไปด้วย
        if (success) { document.getElementById("controlStatus").innerText = "ส่งคำสั่ง: ปิดปั๊มน้ำสำเร็จ"; }
    }
});

// 5. ผูก Event ปุ่มออกจากระบบ (คงเดิม)
document.getElementById("logoutBtn").addEventListener("click", () => {
    logoutUser();
});