import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import Auth from "./auth.js";
import Storage from "./storage.js";
import Toast from "./toast.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSvSbR_NJj7riu0HZPz3nile1X4tuxfsI",
  authDomain: "unmatched-randomizer.firebaseapp.com",
  projectId: "unmatched-randomizer",
  storageBucket: "unmatched-randomizer.firebasestorage.app",
  messagingSenderId: "168086799887",
  appId: "1:168086799887:web:3c8af51f935999b7d6c57a",
  measurementId: "G-GEQPMK68B0",
};

/**
 * Модуль для взаимодействия с Firebase.
 */
const FirebaseModule = {
  db: null,
  auth: null,
  docRef: null,
  isInitialized: false,
  isOnline: navigator.onLine,

  /**
   * Инициализация Firebase и анонимная аутентификация.
   */
  async init() {
    try {
      const app = initializeApp(firebaseConfig);
      this.db = getFirestore(app);
      this.auth = getAuth(app);
      this.docRef = doc(this.db, "lists", "main");

      await signInAnonymously(this.auth);
      this.isInitialized = true;
      console.log("Firebase initialized and user signed in anonymously.");

      window.addEventListener("online", () => {
        this.isOnline = true;
        Toast.success("Соединение с сетью восстановлено.");
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
        Toast.warning("Отсутствует соединение с сетью.");
      });
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      Toast.error("Не удалось подключиться к облаку.");
      this.isInitialized = false;
    }
  },

  /**
   * Синхронизирует списки из Firestore в localStorage.
   * @returns {Promise<boolean>} - true в случае успеха, иначе false.
   */
  async syncLists() {
    if (!this.isInitialized || !this.isOnline) return false;

    try {
      const docSnap = await getDoc(this.docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        const cloudLists = cloudData.lists || {};

        // Получаем локальные списки
        const localLists = Storage.loadHeroLists();

        // Объединяем списки: облачные имеют приоритет
        const mergedLists = { ...localLists, ...cloudLists };

        Storage.saveHeroLists(mergedLists);
        Storage.addCloudLists(Object.keys(cloudLists)); // Сохраняем информацию об облачных списках

        console.log("Lists synchronized from Firestore.");
        return true;
      } else {
        console.warn("Firestore document not found.");
        return false;
      }
    } catch (error) {
      console.error("Error syncing lists from Firestore:", error);
      Toast.error("Ошибка синхронизации списков.");
      return false;
    }
  },

  /**
   * Проверяет пароль администратора.
   * @returns {Promise<boolean>} - true, если пароль верный, иначе false.
   */
  async verifyPassword() {
    if (!this.isInitialized) return false;

    const password = await Auth.getPassword();
    if (!password) return false; // Пользователь отменил ввод

    try {
      const hashedPassword = await Auth.hashPassword(password);
      const docSnap = await getDoc(this.docRef);

      if (docSnap.exists()) {
        const remoteHash = docSnap.data().passwordHash;
        if (hashedPassword === remoteHash) {
          return true;
        } else {
          Toast.error("Неверный пароль.");
          Auth.clearPasswordCache(); // Очищаем кэш при неверном пароле
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error("Password verification failed:", error);
      Toast.error("Ошибка проверки пароля.");
      return false;
    }
  },

  /**
   * Обновляет все списки в Firestore.
   * @param {object} listsObject - Полный объект списков для сохранения.
   * @returns {Promise<boolean>} - true в случае успеха.
   */
  async updateAllLists(listsObject) {
    if (!this.isInitialized || !this.isOnline) {
      Toast.error("Нет подключения к сети для обновления облачных списков.");
      return false;
    }

    const isVerified = await this.verifyPassword();
    if (!isVerified) return false;

    try {
      await updateDoc(this.docRef, { lists: listsObject });
      console.log("Cloud lists updated.");
      Toast.success("Облачные списки обновлены.");
      return true;
    } catch (error) {
      console.error("Failed to update cloud lists:", error);
      Toast.error("Не удалось обновить облачные списки.");
      return false;
    }
  },
};

export default FirebaseModule;
