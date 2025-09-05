import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import Storage from "./storage.js";
import Auth from "./auth.js";
import Toast from "./toast.js";

// --- Конфигурация Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyBSvSbR_NJj7riu0HZPz3nile1X4tuxfsI",
  authDomain: "unmatched-randomizer.firebaseapp.com",
  projectId: "unmatched-randomizer",
  storageBucket: "unmatched-randomizer.firebasestorage.app",
  messagingSenderId: "168086799887",
  appId: "1:168086799887:web:3c8af51f935999b7d6c57a",
  measurementId: "G-GEQPMK68B0",
};

// --- Глобальные переменные модуля ---
let db;
let auth;
let listsRef;
let isInitialized = false;
let isInitializing = false;
let unsubscribe; // Для отписки от onSnapshot

/**
 * Инициализирует Firebase и выполняет анонимную авторизацию.
 */
async function initialize() {
  if (isInitialized || isInitializing) return;
  isInitializing = true;
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    listsRef = doc(db, "lists", "main");

    await new Promise((resolve, reject) => {
      onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            console.log(
              "Firebase: Анонимный пользователь авторизован:",
              user.uid
            );
            isInitialized = true;
            isInitializing = false;
            resolve(user);
          }
        },
        (error) => {
          isInitializing = false;
          reject(error);
        }
      );

      if (!auth.currentUser) {
        signInAnonymously(auth).catch((error) => {
          isInitializing = false;
          reject(error);
        });
      }
    });
  } catch (error) {
    isInitializing = false;
    console.error("Firebase: Ошибка инициализации", error);
    Toast.error("Не удалось подключиться к облаку.");
    throw error;
  }
}

/**
 * Подписывается на изменения в Firestore и синхронизирует их с localStorage.
 * @param {Function} onUpdateCallback - Колбэк, вызываемый при обновлении данных.
 */
async function syncLists(onUpdateCallback) {
  try {
    await initialize();
    if (unsubscribe) unsubscribe(); // Отписываемся от старого слушателя, если он есть

    unsubscribe = onSnapshot(
      listsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data();

          // Синхронизация списков героев
          if (remoteData.lists) {
            Storage.saveHeroLists(remoteData.lists);
          }
          // Синхронизация выбранных списков (по умолчанию и активного)
          if (remoteData.selected) {
            if (remoteData.selected.default) {
              Storage.saveDefaultList(remoteData.selected.default);
            }
            if (remoteData.selected.active) {
              Storage.saveActiveList(remoteData.selected.active);
            }
          }
          onUpdateCallback(true); // Сигнал об успешном обновлении
        } else {
          console.warn("Firebase: Документ 'lists/main' не найден.");
          onUpdateCallback(false);
        }
      },
      (error) => {
        console.error("Firebase: Ошибка при прослушивании обновлений", error);
        Toast.error("Ошибка синхронизации.");
        onUpdateCallback(false);
      }
    );
  } catch (error) {
    // Ошибка уже обработана в initialize
  }
}

/**
 * Проверяет пароль, сравнивая его хэш с хэшем в Firestore.
 * @param {string} password - Пароль в открытом виде.
 * @returns {Promise<boolean>} - true, если пароль верен.
 */
async function verifyPassword(password) {
  if (!isInitialized) return false;
  try {
    const passwordHash = await Auth.hashPassword(password);
    const docSnap = await getDoc(listsRef);
    if (docSnap.exists()) {
      const remoteHash = docSnap.data().passwordHash;
      return passwordHash === remoteHash;
    }
    return false;
  } catch (error) {
    console.error("Firebase: Ошибка при проверке пароля", error);
    return false;
  }
}

/**
 * Обновляет данные в Firestore, сохраняя существующий хэш пароля.
 * @param {object} newData - Объект с новыми данными ({lists, selected}).
 * @returns {Promise<boolean>} - true, если обновление прошло успешно.
 */
async function updateRemoteData(newData) {
  if (!isInitialized) return false;
  try {
    const docSnap = await getDoc(listsRef);
    const currentData = docSnap.exists() ? docSnap.data() : {};

    const dataToSet = {
      lists:
        newData.lists !== undefined ? newData.lists : currentData.lists || {},
      selected:
        newData.selected !== undefined
          ? newData.selected
          : currentData.selected || {},
      passwordHash: currentData.passwordHash || "", // Сохраняем существующий хэш
    };

    await setDoc(listsRef, dataToSet);
    return true;
  } catch (error) {
    console.error("Firebase: Ошибка при обновлении данных", error);
    return false;
  }
}

export default { syncLists, verifyPassword, updateRemoteData };
