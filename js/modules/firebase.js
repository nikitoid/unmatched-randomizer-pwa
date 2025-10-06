/**
 * Этот модуль отвечает за инициализацию Firebase.
 */

let firebaseApp = null;
let firebaseDatabase = null;

/**
 * Инициализирует Firebase, считывая конфигурацию из переменных окружения.
 * @returns {{app: import("firebase/app").FirebaseApp, database: import("firebase/database").Database}|null} - Инстансы Firebase app и database или null, если конфигурация отсутствует.
 */
export function initFirebase() {
  if (firebaseApp) {
    return { app: firebaseApp, database: firebaseDatabase };
  }

  // Vite предоставляет переменные окружения через import.meta.env
  // Для Netlify и других сред мы используем window.process.env, который был установлен в index.html
  const firebaseConfigRaw =
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_FIREBASE_CONFIG
      : null) ||
    (window.process && window.process.env
      ? window.process.env.FIREBASE_CONFIG
      : null);

  if (!firebaseConfigRaw) {
    console.warn("Firebase config not found. Cloud features will be disabled.");
    return null;
  }

  try {
    const firebaseConfig = JSON.parse(firebaseConfigRaw);

    // Используем compat-версии SDK, как указано в roadmap
    firebaseApp = window.firebase.initializeApp(firebaseConfig);
    firebaseDatabase = window.firebase.database();

    console.log("Firebase initialized successfully.");

    return { app: firebaseApp, database: firebaseDatabase };
  } catch (error) {
    console.error(
      "Failed to parse Firebase config or initialize Firebase:",
      error
    );
    return null;
  }
}
