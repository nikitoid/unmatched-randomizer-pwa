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
  console.log("Firebase: Начало инициализации...");
  isInitializing = true;
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    listsRef = doc(db, "lists", "main");
    console.log("Firebase: Конфигурация применена, doc ref создан.");

    await new Promise((resolve, reject) => {
      const unsubscribeAuth = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            console.log(
              "Firebase: Анонимный пользователь авторизован:",
              user.uid
            );
            isInitialized = true;
            isInitializing = false;
            unsubscribeAuth(); // Отписываемся после успешной авторизации
            resolve(user);
          }
        },
        (error) => {
          isInitializing = false;
          console.error("Firebase: Ошибка слушателя авторизации.", error);
          unsubscribeAuth();
          reject(error);
        }
      );

      if (!auth.currentUser) {
        console.log(
          "Firebase: Текущего пользователя нет, попытка анонимного входа..."
        );
        signInAnonymously(auth).catch((error) => {
          isInitializing = false;
          console.error("Firebase: Ошибка анонимного входа.", error);
          reject(error);
        });
      }
    });
    console.log("Firebase: Инициализация успешно завершена.");
  } catch (error) {
    isInitializing = false;
    console.error("Firebase: Критическая ошибка инициализации.", error);
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
    if (unsubscribe) {
      console.log("Firebase: Отписка от предыдущего слушателя.");
      unsubscribe();
    }

    console.log("Firebase: Установка нового слушателя onSnapshot...");
    unsubscribe = onSnapshot(
      listsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          console.log("Firebase: Получены данные из Firestore:", remoteData);

          const localLists = Storage.loadHeroLists() || {};
          const remoteLists = remoteData.lists || {};

          // --- НОВАЯ ЛОГИКА: Слияние списков ---
          const mergedLists = { ...localLists, ...remoteLists };

          Storage.saveHeroLists(mergedLists);
          Storage.saveSyncedListNames(Object.keys(remoteLists)); // Сохраняем имена облачных списков

          onUpdateCallback(true);
        } else {
          console.warn(
            "Firebase: Документ 'lists/main' не найден в Firestore."
          );
          Storage.saveSyncedListNames([]); // Если документа нет, то и облачных списков нет
          onUpdateCallback(false);
        }
      },
      (error) => {
        console.error("Firebase: Ошибка в слушателе onSnapshot", error);
        Toast.error("Ошибка синхронизации.");
        onUpdateCallback(false);
      }
    );
  } catch (error) {
    // Ошибка уже залогирована в initialize
    onUpdateCallback(false);
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
      console.log("Firebase: Сравнение хэшей.", {
        local: passwordHash,
        remote: remoteHash,
      });
      return passwordHash === remoteHash;
    }
    return false;
  } catch (error) {
    console.error("Firebase: Ошибка при проверке пароля.", error);
    return false;
  }
}

/**
 * Обновляет данные в Firestore.
 * @param {object} newData - Объект с новыми данными ({lists}).
 * @returns {Promise<boolean>} - true, если обновление прошло успешно.
 */
async function updateRemoteData(newData) {
  if (!isInitialized) return false;
  try {
    const docSnap = await getDoc(listsRef);
    const currentData = docSnap.exists() ? docSnap.data() : {};
    console.log(
      "Firebase: Подготовка к обновлению. Текущие данные:",
      currentData
    );

    const dataToSet = {
      lists:
        newData.lists !== undefined ? newData.lists : currentData.lists || {},
      passwordHash: currentData.passwordHash || "",
    };

    console.log("Firebase: Отправка новых данных:", dataToSet);
    await setDoc(listsRef, dataToSet);
    console.log("Firebase: Данные успешно обновлены.");
    return true;
  } catch (error) {
    console.error("Firebase: Ошибка при обновлении данных.", error);
    return false;
  }
}

export default { syncLists, verifyPassword, updateRemoteData };
