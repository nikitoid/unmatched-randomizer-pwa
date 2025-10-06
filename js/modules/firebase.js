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

  // Временная прямая конфигурация для локального тестирования (закомментировать при деплое)
  const localFirebaseConfig = {
    apiKey: "AIzaSyBSvSbR_NJj7riu0HZPz3nile1X4tuxfsI",
    authDomain: "unmatched-randomizer.firebaseapp.com",
    projectId: "unmatched-randomizer",
    storageBucket: "unmatched-randomizer.firebasestorage.app",
    messagingSenderId: "168086799887",
    appId: "1:168086799887:web:3c8af51f935999b7d6c57a",
    measurementId: "G-GEQPMK68B0",
  };

  let firebaseConfig = null;

  if (firebaseConfigRaw) {
    try {
      firebaseConfig = JSON.parse(firebaseConfigRaw);
    } catch (error) {
      console.error("Failed to parse Firebase config:", error);
      return null;
    }
  } else {
    // Используем локальную конфигурацию для тестирования
    firebaseConfig = localFirebaseConfig;
    console.log("Using local Firebase configuration for testing");
  }

  // Используем compat-версии SDK, как указано в roadmap
  firebaseApp = window.firebase.initializeApp(firebaseConfig);
  firebaseDatabase = window.firebase.database();

  console.log("Firebase initialized successfully.");

  return { app: firebaseApp, database: firebaseDatabase };
}
