/**
 * @file Этот модуль предоставляет класс OfflineManager для управления состоянием сети и очередями синхронизации.
 */

/**
 * Управляет состоянием сети (онлайн/офлайн) и очередью действий для синхронизации.
 */
class OfflineManager {
  /**
   * @param {FirebaseManager} firebaseManager - Экземпляр FirebaseManager.
   */
  constructor(firebaseManager) {
    if (!firebaseManager) {
      throw new Error("OfflineManager requires a FirebaseManager instance.");
    }
    this.firebaseManager = firebaseManager;
    this.isOnlineStatus = true; // Предполагаем, что изначально онлайн, статус будет обновлен FirebaseManager
    this.syncQueue = [];
    this.loadSyncQueueFromStorage();
    this.statusChangeCallbacks = []; // Массив для хранения колбэков

    this.onlineHandler = this.onOnline.bind(this);
    this.offlineHandler = this.onOffline.bind(this);
  }

  /**
   * Инициализирует слушатели событий online/offline.
   */
  init() {
    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);
    // Также слушаем событие от FirebaseManager (предполагается, что оно будет реализовано)
    // Для простоты пока полагаемся на нативные события и статус FirebaseManager
    this.checkConnection(); // Обновляем статус при инициализации
  }

  /**
   * Проверяет текущий статус сети через FirebaseManager.
   * @returns {boolean} - true, если онлайн.
   */
  checkConnection() {
    this.isOnlineStatus = this.firebaseManager.isOnline();
    if (this.isOnlineStatus) {
      this.enableOnlineMode();
    } else {
      this.enableOfflineMode();
    }
    return this.isOnlineStatus;
  }

  /**
   * Обработчик события 'online'.
   */
  onOnline() {
    console.log("Network: Online");
    this.checkConnection(); // Уточняем статус через FirebaseManager
  }

  /**
   * Обработчик события 'offline'.
   */
  onOffline() {
    console.log("Network: Offline");
    this.checkConnection(); // Уточняем статус через FirebaseManager
  }

  /**
   * Включает режим онлайн, разблокирует UI, запускает синхронизацию очереди.
   */
  enableOnlineMode() {
    if (!this.isOnlineStatus) {
      this.isOnlineStatus = true;
      console.log("OfflineManager: Switched to Online Mode.");
      // Разблокировать UI для облачных операций
      // Toast.success("Соединение с облаком восстановлено. Запуск синхронизации...");
      // Запустить синхронизацию очереди
      this.processSyncQueue();
      this.notifyStatusChange(true); // Уведомляем подписчиков
    }
  }

  /**
   * Включает режим офлайн, блокирует UI для облачных операций, показывает уведомление.
   */
  enableOfflineMode() {
    if (this.isOnlineStatus) {
      this.isOnlineStatus = false;
      console.log("OfflineManager: Switched to Offline Mode.");
      // Блокировать UI для облачных операций
      // Toast.info("Нет подключения к облаку. Изменения будут синхронизированы при восстановлении соединения.");
      this.notifyStatusChange(false); // Уведомляем подписчиков
    }
  }

  /**
   * Подписывает колбэк на изменение статуса подключения.
   * @param {Function} callback - Функция, которая будет вызвана при изменении статуса. Принимает boolean (isOnline).
   */
  onStatusChange(callback) {
    if (typeof callback === "function") {
      this.statusChangeCallbacks.push(callback);
    }
  }

  /**
   * Уведомляет все подписанные колбэки об изменении статуса.
   * @private
   */
  notifyStatusChange(isOnline) {
    this.statusChangeCallbacks.forEach((callback) => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error("Error in status change callback:", error);
      }
    });
  }

  /**
   * Добавляет действие в очередь синхронизации и сохраняет в localStorage.
   * @param {{type: string, listId: string, content: object}} action - Действие для синхронизации.
   */
  queueAction(action) {
    this.syncQueue.push(action);
    console.log(`Action queued: ${action.type} for list ${action.listId}`);
    this.saveSyncQueueToStorage();
  }

  /**
   * Сохраняет очередь синхронизации в localStorage.
   * @private
   */
  saveSyncQueueToStorage() {
    try {
      localStorage.setItem(
        "firebase_sync_queue",
        JSON.stringify(this.syncQueue)
      );
    } catch (e) {
      console.error("Failed to save sync queue to localStorage:", e);
    }
  }

  /**
   * Загружает очередь синхронизации из localStorage.
   * @private
   */
  loadSyncQueueFromStorage() {
    try {
      const queueStr = localStorage.getItem("firebase_sync_queue");
      if (queueStr) {
        this.syncQueue = JSON.parse(queueStr);
        console.log(`Loaded ${this.syncQueue.length} actions from sync queue.`);
      }
    } catch (e) {
      console.error("Failed to load sync queue from localStorage:", e);
      this.syncQueue = []; // Сбрасываем очередь в случае ошибки
    }
  }

  /**
   * Обрабатывает очередь синхронизации, когда соединение восстановлено.
   * @private
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) {
      console.log("Sync queue is empty, nothing to process.");
      return;
    }

    console.log(
      `Processing ${this.syncQueue.length} actions from sync queue...`
    );
    const actionsToRetry = [];

    for (const action of this.syncQueue) {
      try {
        console.log(
          `Processing action: ${action.type} for list ${action.listId}`
        );
        switch (action.type) {
          case "sync":
            await this.firebaseManager.syncList(action.listId, action.content);
            break;
          case "delete":
            await this.firebaseManager.deleteCloudList(action.listId);
            break;
          default:
            console.warn(`Unknown action type in queue: ${action.type}`);
            continue; // Пропускаем неизвестные типы
        }
        console.log(
          `Successfully processed action: ${action.type} for list ${action.listId}`
        );
      } catch (error) {
        console.error(
          `Failed to process action: ${action.type} for list ${action.listId}, reason:`,
          error
        );
        // В случае ошибки, добавляем действие обратно в очередь для повторной попытки
        actionsToRetry.push(action);
      }
    }

    // Обновляем очередь: оставляем только те действия, которые не удалось обработать
    this.syncQueue = actionsToRetry;
    this.saveSyncQueueToStorage(); // Сохраняем обновленную очередь

    if (this.syncQueue.length === 0) {
      console.log("Sync queue processed successfully, all actions completed.");
    } else {
      console.log(
        `Sync queue processing completed, ${this.syncQueue.length} actions remain for retry.`
      );
    }
  }
}

export default OfflineManager;
