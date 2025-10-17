import { firebaseConfig } from "../firebase-config.js";
import Toast from "./toast.js";

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
    /** @type {import("firebase/firestore").Unsubscribe | null} */
    this.unsubscribe = null; // Для отписки от слушателя
    this._isConnected = false; // Статус подключения
  }

  /**
   * Инициализирует Firebase приложение и Firestore.
   * Подключается к эмулятору, если приложение запущено локально.
   * @param {object} firebaseApp - Глобальный объект firebase/app из CDN.
   * @param {object} firestore - Глобальный объект firebase/firestore из CDN.
   */
  init(firebaseApp, firestore) {
    if (this.app) {
      return; // Уже инициализирован
    }

    try {
      this.app = firebaseApp.initializeApp(firebaseConfig);
      this.db = firestore.getFirestore(this.app);
      this.firestoreFunctions = firestore;
      // console.log("Firebase успешно инициализирован.");

      if (window.location.hostname === "localhost") {
        firestore.connectFirestoreEmulator(this.db, "localhost", 8080);
        console.log("Подключен эмулятор Firestore.");
      }
    } catch (error) {
      console.error("Ошибка инициализации Firebase:", error);
      Toast.error("Не удалось инициализировать облачные функции.");
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
   * Возвращает текущий статус подключения к Firestore.
   * @returns {boolean}
   */
  isConnected() {
    return this._isConnected;
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
   * Переименовывает облачный список в Firestore.
   * @param {string} listId - ID документа в Firestore.
   * @param {string} newName - Новое имя списка.
   * @returns {Promise<boolean>} - true в случае успеха.
   */
  async renameCloudList(listId, newName) {
    if (!this.db || !this.isOnline()) return false;
    try {
      const { doc, updateDoc } = this.firestoreFunctions;
      const listRef = doc(this.db, "lists", listId);
      await updateDoc(listRef, {
        name: newName,
      });
      return true;
    } catch (error) {
      console.error("Ошибка переименования облачного списка:", error);
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
   * Подключается к Firestore и начинает слушать изменения.
   */
  connect() {
    if (!this.isOnline()) {
      Toast.info("Нет подключения к сети. Облачные функции недоступны.");
      this._setStatus(false); // Устанавливаем статус "отключено"
      return;
    }
    if (!this.app || !this.db) {
      console.error(
        "Firebase не инициализирован. Вызовите init() перед connect()."
      );
      return;
    }
    if (this.unsubscribe) {
      console.warn("Слушатель Firestore уже активен.");
      return;
    }
    this.subscribeToChanges();
  }

  /**
   * Отключается от Firestore, прекращая слушать изменения.
   */
  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this._setStatus(false);
      console.log("Слушатель Firestore отключен.");
    }
  }

  /**
   * Подписывается на изменения в коллекции 'lists' и уведомляет приложение.
   */
  subscribeToChanges() {
    if (!this.db) return;
    const { collection, onSnapshot } = this.firestoreFunctions;

    this.unsubscribe = onSnapshot(
      collection(this.db, "lists"),
      (querySnapshot) => {
        const cloudLists = new Map();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name && data.heroes) {
            cloudLists.set(doc.id, {
              id: doc.id,
              name: data.name,
              heroes: data.heroes,
              type: "cloud",
            });
          } else {
            console.warn(
              `Документ с ID ${doc.id} в Firestore имеет неверную структуру.`
            );
          }
        });

        const cloudListsObject = {};
        cloudLists.forEach((list) => {
          cloudListsObject[list.name] = list;
        });

        const event = new CustomEvent("cloud-lists-updated", {
          detail: { cloudLists: cloudListsObject, source: "cloud" },
        });
        window.dispatchEvent(event);
      },
      (error) => {
        console.error("Ошибка при получении облачных списков:", error);
        Toast.error("Ошибка синхронизации с облаком.");
        this._setStatus(false); // Статус "отключено" при ошибке
        this.disconnect(); // Отключаемся при ошибке
      }
    );
    console.log("Слушатель Firestore активирован.");
    this._setStatus(true);
  }

  /**
   * Устанавливает статус подключения и уведомляет приложение.
   * @param {boolean} isConnected - Новый статус подключения.
   * @private
   */
  _setStatus(isConnected) {
    if (this._isConnected === isConnected) return; // Ничего не делаем, если статус не изменился

    this._isConnected = isConnected;
    const event = new CustomEvent("firebase-status-changed", {
      detail: { isConnected: this._isConnected },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Экземпляр-синглтон FirebaseManager для использования во всем приложении.
 * @type {FirebaseManager}
 */
export const firebaseManager = new FirebaseManager();
