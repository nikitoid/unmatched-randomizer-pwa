/**
 * @file Модуль для интеграции облачных списков с ListManager.
 * Этот модуль расширяет функциональность ListManager для работы с облачными списками.
 */

import ListManager from "./listManager.js";
import Storage from "./storage.js";
import Toast from "./toast.js";
import FirebaseManager from "./firebase-manager.js";
import OfflineManager from "./offline-manager.js";

// Предположим, что FirebaseManager и OfflineManager инициализированы где-то в app.js
// и передаются сюда или доступны глобально. Пока что будем передавать их как зависимости.

/**
 * Класс для управления облачными списками через ListManager.
 */
class CloudListManager {
  /**
   * @param {FirebaseManager} firebaseManager - Экземпляр FirebaseManager.
   * @param {OfflineManager} offlineManager - Экземпляр OfflineManager.
   */
  constructor(firebaseManager, offlineManager) {
    if (!firebaseManager || !offlineManager) {
      throw new Error(
        "CloudListManager requires FirebaseManager and OfflineManager instances."
      );
    }
    this.firebaseManager = firebaseManager;
    this.offlineManager = offlineManager;
    this.cloudLists = {};
    this.isInitialized = false;
  }

  /**
   * Инициализирует CloudListManager, загружая кэшированные списки.
   */
  init() {
    if (this.isInitialized) return;
    this.cloudLists = Storage.loadCloudListsFromCache();
    this.isInitialized = true;
  }

  /**
   * Проверяет, является ли список облачным.
   * @param {string} listName - Имя списка.
   * @returns {boolean} - true, если список облачный.
   */
  isCloudList(listName) {
    // Простая проверка: если список есть в кэше облачных списков, считаем его облачным.
    // В реальности может быть более сложная логика (например, префикс в имени).
    return this.cloudLists.hasOwnProperty(listName);
  }

  /**
   * Синхронизирует список с облаком.
   * @param {string} listId - ID списка.
   * @param {object} content - Содержимое списка.
   */
  async syncListToCloud(listId, content) {
    if (!this.offlineManager.checkConnection()) {
      // Если офлайн, добавляем в очередь
      this.offlineManager.queueAction({ type: "sync", listId, content });
      Toast.info(
        `Список "${listId}" изменен. Синхронизация отложена до подключения.`
      );
      return;
    }

    try {
      await this.firebaseManager.syncList(listId, content);
      Toast.success(`Список "${listId}" синхронизирован с облаком.`);
      // Обновляем кэш
      this.cloudLists[listId] = content;
      Storage.cacheCloudLists(this.cloudLists);
    } catch (error) {
      console.error(`Failed to sync list ${listId} to cloud:`, error);
      Toast.error(`Ошибка синхронизации списка "${listId}".`);
      // В случае ошибки сети, добавляем в очередь
      if (
        error.code === "network_error" ||
        !this.offlineManager.checkConnection()
      ) {
        this.offlineManager.queueAction({ type: "sync", listId, content });
        Toast.info(`Синхронизация "${listId}" отложена до подключения.`);
      }
    }
  }

  /**
   * Удаляет список из облака.
   * @param {string} listId - ID списка.
   */
  async deleteCloudList(listId) {
    if (!this.offlineManager.checkConnection()) {
      // Если офлайн, добавляем в очередь
      this.offlineManager.queueAction({ type: "delete", listId });
      Toast.info(`Удаление списка "${listId}" отложено до подключения.`);
      return;
    }

    try {
      await this.firebaseManager.deleteCloudList(listId);
      Toast.success(`Список "${listId}" удален из облака.`);
      // Удаляем из кэша
      delete this.cloudLists[listId];
      Storage.cacheCloudLists(this.cloudLists);
    } catch (error) {
      console.error(`Failed to delete cloud list ${listId}:`, error);
      Toast.error(`Ошибка удаления списка "${listId}" из облака.`);
      // В случае ошибки сети, добавляем в очередь
      if (
        error.code === "network_error" ||
        !this.offlineManager.checkConnection()
      ) {
        this.offlineManager.queueAction({ type: "delete", listId });
        Toast.info(`Удаление "${listId}" отложено до подключения.`);
      }
    }
  }

  /**
   * Помечает список как облачный в кэше.
   * @param {string} listId - ID списка.
   * @param {object} content - Содержимое списка.
   */
  markListAsCloud(listId, content) {
    this.cloudLists[listId] = content;
    Storage.cacheCloudLists(this.cloudLists);
  }

  /**
   * Убирает пометку облачного списка из кэша.
   * @param {string} listId - ID списка.
   */
  unmarkListAsCloud(listId) {
    delete this.cloudLists[listId];
    Storage.cacheCloudLists(this.cloudLists);
  }

  /**
   * Возвращает список облачных списков.
   * @returns {object} - Объект с облачными списками.
   */
  getCloudLists() {
    return this.cloudLists;
  }
}

export default CloudListManager;
