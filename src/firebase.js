import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const authConfig = {
  apiKey: import.meta.env.VITE_AUTH_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_AUTH_PROJECT_ID,
  storageBucket: import.meta.env.VITE_AUTH_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_AUTH_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_AUTH_APP_ID
};

const espConfig = {
  projectId: import.meta.env.VITE_ESP_PROJECT_ID,
  databaseURL: import.meta.env.VITE_ESP_DATABASE_URL
};

const authApp = initializeApp(authConfig);
const espApp = initializeApp(espConfig, "espProject");

export const auth = getAuth(authApp);

// 🛠️ ปิดการใช้ QUIC/HTTP3 สตรีมเพื่อลบ Network Timeout Error
export const db = initializeFirestore(authApp, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

export const rtdb = getDatabase(espApp);