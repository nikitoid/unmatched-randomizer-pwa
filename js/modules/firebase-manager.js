/**
 * @file Этот модуль предоставляет класс FirebaseManager для взаимодействия с Firebase Realtime Database.
 */

/**
 * Управляет всеми операциями с Firebase Realtime Database.
 */
class FirebaseManager {
  /**
   * @param {import("firebase/database").Database} database - Инстанс Firebase Database.
   */
  constructor(database) {
    if (!database) {
      throw new Error("FirebaseManager requires a database instance.");
    }
    this.db = database;
    this.connected = false;
    this.mainListRef = window.firebase.database().ref(this.db, "lists/main");

    this._initConnectionListener();
  }

  /**
   * Инициализирует слушатель статуса подключения к Firebase.
   * @private
   */
  _initConnectionListener() {
    const connectedRef = window.firebase
      .database()
      .ref(this.db, ".info/connected");
    window.firebase.database().onValue(connectedRef, (snap) => {
      this.connected = snap.val() === true;
      console.log(
        `Firebase connection status: ${this.connected ? "Online" : "Offline"}`
      );
      // В будущем здесь будет событие для OfflineManager
    });
  }

  /**
   * Проверяет, подключен ли клиент к Firebase.
   * @returns {boolean} - true, если подключен.
   */
  isOnline() {
    return this.connected;
  }

  /**
   * Возвращает ссылку на конкретный список в базе данных.
   * @param {string} listId - ID списка.
   * @returns {import("firebase/database").Reference}
   */
  getListRef(listId) {
    return window.firebase
      .database()
      .ref(this.db, `lists/main/lists/${listId}`);
  }

  /**
   * Синхронизирует (записывает или обновляет) список в облаке.
   * @param {string} listId - ID списка.
   * @param {object} content - Содержимое списка (массив героев и другие метаданные).
   * @returns {Promise<void>}
   */
  syncList(listId, content) {
    const listRef = this.getListRef(listId);
    return window.firebase.database().set(listRef, content);
  }

  /**
   * Получает данные списка из облака.
   * @param {string} listId - ID списка.
   * @returns {Promise<object|null>} - Данные списка или null, если их нет.
   */
  async fetchList(listId) {
    const listRef = this.getListRef(listId);
    const snapshot = await window.firebase.database().get(listRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  /**
   * Удаляет список из облака.
   * @param {string} listId - ID списка.
   * @returns {Promise<void>}
   */
  deleteCloudList(listId) {
    const listRef = this.getListRef(listId);
    return window.firebase.database().remove(listRef);
  }
}

export default FirebaseManager;
