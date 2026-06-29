// 2. อัปเดตฟังก์ชันวาดตาราง: เพิ่มคอลัมน์แสดงรหัสผ่านดิบเข้าตารางแอดมิน
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
            
            <td><strong style="color: #e11d48; font-family: monospace;">${user.password || 'ไม่มีข้อมูล'}</strong></td>
            
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