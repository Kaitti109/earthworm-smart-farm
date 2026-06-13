import { checkAdminPermission, getAllUsers, deleteUserFromDB, updateUserRole, sendControlCommand } from "./admin.js";
import { logoutUser } from "./dashboard.js";

// 1. ตรวจสิทธิ์ Admin ตอนเข้าหน้าเว็บ
checkAdminPermission((adminData) => {
    document.getElementById("adminName").innerText = adminData.username;
    renderUserTable();
});

// 2. ฟังก์ชันวาดตารางรายชื่อสมาชิก
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
                <button class="btn-delete" data-uid="${user.uid}">ลบสมาชิก</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    addTableEvents();
}

// 3. ผูก Event ภายในตาราง
function addTableEvents() {
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

// 4. ผูก Event ปุ่มควบคุมบอร์ด IoT
document.getElementById("pumpOnBtn").addEventListener("click", async () => {
    const success = await sendControlCommand(true);
    if (success) { document.getElementById("controlStatus").innerText = "ส่งคำสั่ง: เปิดปั๊มน้ำสำเร็จ"; }
});

document.getElementById("pumpOffBtn").addEventListener("click", async () => {
    const success = await sendControlCommand(false);
    if (success) { document.getElementById("controlStatus").innerText = "ส่งคำสั่ง: ปิดปั๊มน้ำสำเร็จ"; }
});

// 5. ผูก Event ปุ่มออกจากระบบ
document.getElementById("logoutBtn").addEventListener("click", () => {
    logoutUser();
});