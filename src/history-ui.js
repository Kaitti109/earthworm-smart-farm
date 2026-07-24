import { checkUserLogin, logoutUser } from "./dashboard.js";
import { rtdb } from "./firebase.js";
import { ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

checkUserLogin((userData) => {
    if (userData) {
        document.getElementById("userNameText").innerText = userData.username;
        if (userData.role !== "admin") {
            document.getElementById("adminMenuBtn").style.display = "none";
        }
        startLoadingTableData(userData.uid);
    }
});

function startLoadingTableData(userUid) {
    const logsRef = query(ref(rtdb, `users_farms/${userUid}/sensor_logs`), limitToLast(10));
    onValue(logsRef, (snapshot) => {
        const logsData = snapshot.val();
        let tableRowsHtml = "";

        if (logsData) {
            const logKeys = Object.keys(logsData).reverse();

            logKeys.forEach((key) => {
                const log = logsData[key];
                let fullDateTime = "ไม่ระบุเวลา";
                if (log.time) {
                    const date = new Date(log.time);
                    fullDateTime = `${date.toLocaleDateString('th-TH')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} น.`;
                }
                const tVal = log.temp !== undefined ? `${log.temp.toFixed(1)} °C` : '--';
                const mVal = log.moist !== undefined ? `${log.moist.toFixed(1)} %` : '--';
                const pVal = log.ph !== undefined ? log.ph.toFixed(1) : '7.0';

                tableRowsHtml += `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 16px; color: #334155; font-weight: 500;">${fullDateTime}</td>
                        <td style="padding: 12px 16px; color: #dc2626;">${tVal}</td>
                        <td style="padding: 12px 16px; color: #2563eb;">${mVal}</td>
                        <td style="padding: 12px 16px; color: #0d9488;">${pVal}</td>
                    </tr>
                `;
            });

            const tableBody = document.getElementById("historyTableBody");
            if (tableBody) tableBody.innerHTML = tableRowsHtml;
        }
    });
}

document.getElementById("logoutBtn").addEventListener("click", () => logoutUser());