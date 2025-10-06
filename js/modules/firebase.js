import { firebaseConfig } from "../firebase-config.js";

/**
 * @class FirebaseManager
 * @description Управляет инициализацией и взаимодействием с Firebase.
 * Инкапсулирует логику работы с Firestore и другими сервисами Firebase.
 */
class FirebaseManager {
  /**
   * Конструктор инициализирует состояние.
   */
  constructor() {
    /** @type {import("firebase/app").FirebaseApp | null} */
    this.app = null;
    /** @type {import("firebase/firestore").Firestore | null} */
    this.db = null;
  }

  /**
   * Инициализирует Firebase приложение и Firestore.
   * Подключается к эмулятору, если приложение запущено локально.
   * @param {object} firebaseApp - Глобальный объект firebase/app из CDN.
   * @param {object} firestore - Глобальный объект firebase/firestore из CDN.
   */
  init(firebaseApp, firestore) {
    if (this.app) {
      console.warn("Firebase уже инициализирован.");
      return;
    }

    try {
      this.app = firebaseApp.initializeApp(firebaseConfig);
      this.db = firestore.getFirestore(this.app);
      console.log("Firebase успешно инициализирован.");

      // --- Блок для локальной разработки ---
      // Подключаемся к эмулятору Firestore, если работаем на localhost.
      if (window.location.hostname === "localhost") {
        firestore.connectFirestoreEmulator(this.db, "localhost", 8080);
        console.log("Подключен эмулятор Firestore.");
      }
      // --- Конец блока для локальной разработки ---
    } catch (error) {
      console.error("Ошибка инициализации Firebase:", error);
      // Здесь можно добавить логику для обработки ошибок, например, показать Toast
    }
  }
}

/**
 * Экземпляр-синглтон FirebaseManager для использования во всем приложении.
 * @type {FirebaseManager}
 */
export const firebaseManager = new FirebaseManager();
