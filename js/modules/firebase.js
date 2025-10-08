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
    this.firestoreFunctions = null;
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
      this.firestoreFunctions = firestore; // Сохраняем функции firestore
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

  /**
   * Проверяет, был ли уже инициализирован Firebase.
   * @returns {boolean}
   */
  isInitialized() {
    return !!this.app;
  }

  /**
   * Проверяет, есть ли подключение к сети.
   * @returns {boolean}
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Загружает локальный список в Firestore.
   * @param {string} listName - Имя списка.
   * @param {object} listData - Данные списка ({heroes: [], type: 'local'}).
   * @returns {Promise<string|null>} - ID созданного документа или null в случае ошибки.
   */
  async uploadList(listName, listData) {
    if (!this.db || !this.isOnline()) return null;
    try {
      const { collection, addDoc } = this.firestoreFunctions;
      const docRef = await addDoc(collection(this.db, "lists"), {
        name: listName,
        heroes: listData.heroes,
      });
      return docRef.id;
    } catch (error) {
      console.error("Ошибка загрузки списка в Firestore:", error);
      return null;
    }
  }

  /**
   * Синхронизирует (обновляет) облачный список в Firestore.
   * @param {string} listId - ID документа в Firestore.
   * @param {object} listData - Обновленные данные списка ({heroes: []}).
   * @returns {Promise<boolean>} - true в случае успеха.
   */
  async syncList(listId, listData) {
    if (!this.db || !this.isOnline()) return false;
    try {
      const { doc, updateDoc } = this.firestoreFunctions;
      const listRef = doc(this.db, "lists", listId);
      await updateDoc(listRef, {
        heroes: listData.heroes,
      });
      return true;
    } catch (error) {
      console.error("Ошибка синхронизации списка:", error);
      return false;
    }
  }

  /**
   * Удаляет облачный список из Firestore.
   * @param {string} listId - ID документа в Firestore.
   * @returns {Promise<boolean>} - true в случае успеха.
   */
  async deleteCloudList(listId) {
    if (!this.db || !this.isOnline()) return false;
    try {
      const { doc, deleteDoc } = this.firestoreFunctions;
      await deleteDoc(doc(this.db, "lists", listId));
      return true;
    } catch (error) {
      console.error("Ошибка удаления облачного списка:", error);
      return false;
    }
  }

  /**
   * Подписывается на изменения в коллекции 'lists' и уведомляет приложение.
   */
  fetchAllCloudLists() {
    if (!this.db) return;
    const { collection, onSnapshot } = this.firestoreFunctions;
    onSnapshot(
      collection(this.db, "lists"),
      (querySnapshot) => {
        const cloudLists = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Проверяем, что в документе есть и имя, и герои
          if (data.name && data.heroes) {
            cloudLists[data.name] = {
              id: doc.id,
              heroes: data.heroes,
              type: "cloud",
            };
          } else {
            console.warn(
              `Документ с ID ${doc.id} в Firestore имеет неверную структуру и был проигнорирован.`
            );
          }
        });

        // Отправляем событие с новыми данными
        const event = new CustomEvent("cloud-lists-updated", {
          detail: { cloudLists },
        });
        window.dispatchEvent(event);
      },
      (error) => {
        console.error("Ошибка при получении облачных списков:", error);
      }
    );
  }

  /**
   * Отключает сеть для Firestore и уведомляет приложение.
   */
  goOffline() {
    if (!this.db || !this.firestoreFunctions) return;
    const { disableNetwork } = this.firestoreFunctions;
    disableNetwork(this.db);
    console.log("[Firebase] Сеть для Firestore отключена.");
    this.broadcastNetworkStatus(false);
  }

  /**
   * Включает сеть для Firestore и уведомляет приложение.
   */
  goOnline() {
    if (!this.db || !this.firestoreFunctions) return;
    const { enableNetwork } = this.firestoreFunctions;
    enableNetwork(this.db);
    console.log("[Firebase] Сеть для Firestore включена.");
    this.broadcastNetworkStatus(true);
  }

  /**
   * Отправляет событие об изменении статуса сети.
   * @param {boolean} isOnline - Текущий статус сети.
   */
  broadcastNetworkStatus(isOnline) {
    const event = new CustomEvent("network-status-changed", {
      detail: { isOnline },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Экземпляр-синглтон FirebaseManager для использования во всем приложении.
 * @type {FirebaseManager}
 */
export const firebaseManager = new FirebaseManager();
