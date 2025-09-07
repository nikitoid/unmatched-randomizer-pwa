// Пример модуля уведомлений с кастомными стилями

import { Module } from './Module.js';

class NotificationModule extends Module {
  constructor(name, options = {}) {
    const defaultOptions = {
      position: 'top-right',
      duration: 5000,
      maxNotifications: 5,
      animations: true,
      ...options
    };

    // Определяем кастомные стили для модуля
    const styles = `
      /* Стили для модуля уведомлений */
      .notification-container {
        position: fixed;
        z-index: 10000;
        pointer-events: none;
        max-width: 400px;
      }

      .notification-container.top-right {
        top: 20px;
        right: 20px;
      }

      .notification-container.top-left {
        top: 20px;
        left: 20px;
      }

      .notification-container.bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .notification-container.bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .notification-container.top-center {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .notification-container.bottom-center {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .notification-item {
        pointer-events: auto;
        margin-bottom: 10px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        max-width: 100%;
        word-wrap: break-word;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .notification-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
      }

      .notification-item.success {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      .notification-item.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
      }

      .notification-item.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
      }

      .notification-item.info {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
      }

      .notification-item.default {
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: white;
      }

      .notification-title {
        font-weight: 600;
        margin-bottom: 4px;
        display: block;
      }

      .notification-message {
        opacity: 0.95;
        display: block;
      }

      .notification-close {
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        color: currentColor;
        opacity: 0.7;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        padding: 4px;
        border-radius: 50%;
        transition: opacity 0.2s ease;
      }

      .notification-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }

      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        transition: width linear;
      }

      /* Анимации */
      @keyframes notificationSlideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes notificationSlideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }

      @keyframes notificationFadeIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes notificationFadeOut {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.8);
        }
      }

      .notification-item.animate-slide-in {
        animation: notificationSlideIn 0.3s ease-out;
      }

      .notification-item.animate-slide-out {
        animation: notificationSlideOut 0.3s ease-in;
      }

      .notification-item.animate-fade-in {
        animation: notificationFadeIn 0.3s ease-out;
      }

      .notification-item.animate-fade-out {
        animation: notificationFadeOut 0.3s ease-in;
      }

      /* Адаптивность */
      @media (max-width: 480px) {
        .notification-container {
          left: 10px !important;
          right: 10px !important;
          max-width: none;
          transform: none !important;
        }

        .notification-item {
          margin-bottom: 8px;
          padding: 12px 16px;
          font-size: 13px;
        }
      }
    `;

    super(name, { ...defaultOptions, styles });

    this.container = null;
    this.notifications = new Map();
    this.notificationId = 0;
  }

  // Инициализация модуля
  async onInit() {
    this.createContainer();
    this.setupEventListeners();
    
    console.log(`NotificationModule: Initialized with position "${this.options.position}"`);
    
    // Демонстрационное уведомление
    setTimeout(() => {
      this.show('Модуль уведомлений готов!', 'Система уведомлений успешно инициализирована', 'success');
    }, 1000);

    // Подписываемся на системные события
    this.on('module:loaded', (data) => {
      this.show(`Модуль загружен`, `Модуль "${data.module}" успешно загружен`, 'info');
    });

    this.on('module:error', (data) => {
      this.show(`Ошибка модуля`, `Ошибка в модуле "${data.module}"`, 'error');
    });
  }

  // Уничтожение модуля
  async onDestroy() {
    this.clearAll();
    this.removeContainer();
    
    console.log('NotificationModule: Destroyed');
  }

  // Создание контейнера для уведомлений
  createContainer() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = `notification-container ${this.options.position}`;
    this.container.setAttribute('data-module', this.name);
    
    document.body.appendChild(this.container);
  }

  // Удаление контейнера
  removeContainer() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  // Настройка обработчиков событий
  setupEventListeners() {
    // Обработка видимости страницы
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllTimers();
      } else {
        this.resumeAllTimers();
      }
    });

    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
      this.updateContainerPosition();
    });
  }

  // Показ уведомления
  show(title, message = '', type = 'default', options = {}) {
    const id = ++this.notificationId;
    const finalOptions = {
      duration: this.options.duration,
      closable: true,
      progress: true,
      ...options
    };

    // Проверяем лимит уведомлений
    if (this.notifications.size >= this.options.maxNotifications) {
      this.removeOldest();
    }

    const notification = this.createNotificationElement(id, title, message, type, finalOptions);
    
    this.notifications.set(id, {
      element: notification,
      type,
      title,
      message,
      createdAt: Date.now(),
      timer: null,
      paused: false,
      ...finalOptions
    });

    this.container.appendChild(notification);

    // Анимация появления
    if (this.options.animations) {
      notification.classList.add('animate-slide-in');
    }

    // Автоматическое удаление
    if (finalOptions.duration > 0) {
      this.setTimer(id, finalOptions.duration);
    }

    // Событие создания уведомления
    this.emit('notification:created', { id, title, message, type });

    console.log(`NotificationModule: Показано уведомление "${title}" (${type})`);
    return id;
  }

  // Создание элемента уведомления
  createNotificationElement(id, title, message, type, options) {
    const element = document.createElement('div');
    element.className = `notification-item ${type}`;
    element.setAttribute('data-notification-id', id);

    const titleElement = document.createElement('span');
    titleElement.className = 'notification-title';
    titleElement.textContent = title;

    const messageElement = document.createElement('span');
    messageElement.className = 'notification-message';
    messageElement.textContent = message;

    element.appendChild(titleElement);
    if (message) {
      element.appendChild(messageElement);
    }

    // Кнопка закрытия
    if (options.closable) {
      const closeButton = document.createElement('button');
      closeButton.className = 'notification-close';
      closeButton.innerHTML = '×';
      closeButton.onclick = () => this.hide(id);
      element.appendChild(closeButton);
    }

    // Прогресс-бар
    if (options.progress && options.duration > 0) {
      const progressElement = document.createElement('div');
      progressElement.className = 'notification-progress';
      element.appendChild(progressElement);
    }

    // Клик по уведомлению
    element.onclick = (e) => {
      if (e.target === element || e.target.classList.contains('notification-title') || e.target.classList.contains('notification-message')) {
        this.emit('notification:clicked', { id, title, message, type });
        if (options.onClick) {
          options.onClick(id);
        }
      }
    };

    return element;
  }

  // Скрытие уведомления
  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Очищаем таймер
    if (notification.timer) {
      clearTimeout(notification.timer);
    }

    // Анимация исчезновения
    if (this.options.animations) {
      notification.element.classList.add('animate-slide-out');
      setTimeout(() => {
        this.removeNotification(id);
      }, 300);
    } else {
      this.removeNotification(id);
    }

    this.emit('notification:hidden', { id });
  }

  // Удаление уведомления
  removeNotification(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.element.remove();
    this.notifications.delete(id);
    
    this.emit('notification:removed', { id });
  }

  // Удаление самого старого уведомления
  removeOldest() {
    let oldestId = null;
    let oldestTime = Date.now();

    for (const [id, notification] of this.notifications.entries()) {
      if (notification.createdAt < oldestTime) {
        oldestTime = notification.createdAt;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.hide(oldestId);
    }
  }

  // Очистка всех уведомлений
  clearAll() {
    for (const id of this.notifications.keys()) {
      this.hide(id);
    }
  }

  // Установка таймера автоудаления
  setTimer(id, duration) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.timer = setTimeout(() => {
      this.hide(id);
    }, duration);

    // Прогресс-бар
    const progressElement = notification.element.querySelector('.notification-progress');
    if (progressElement) {
      progressElement.style.width = '100%';
      progressElement.style.transition = `width ${duration}ms linear`;
      
      // Анимация прогресса
      setTimeout(() => {
        progressElement.style.width = '0%';
      }, 50);
    }
  }

  // Приостановка всех таймеров
  pauseAllTimers() {
    for (const notification of this.notifications.values()) {
      if (notification.timer && !notification.paused) {
        clearTimeout(notification.timer);
        notification.paused = true;
      }
    }
  }

  // Возобновление всех таймеров
  resumeAllTimers() {
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.paused) {
        notification.paused = false;
        this.setTimer(id, notification.duration);
      }
    }
  }

  // Обновление позиции контейнера
  updateContainerPosition() {
    if (!this.container) return;
    
    this.container.className = `notification-container ${this.options.position}`;
  }

  // Изменение позиции уведомлений
  setPosition(position) {
    this.options.position = position;
    this.updateContainerPosition();
    
    this.emit('notification:position-changed', { position });
  }

  // Вспомогательные методы для разных типов уведомлений
  success(title, message = '', options = {}) {
    return this.show(title, message, 'success', options);
  }

  error(title, message = '', options = {}) {
    return this.show(title, message, 'error', options);
  }

  warning(title, message = '', options = {}) {
    return this.show(title, message, 'warning', options);
  }

  info(title, message = '', options = {}) {
    return this.show(title, message, 'info', options);
  }

  // Получение статистики
  getStats() {
    return {
      active: this.notifications.size,
      total: this.notificationId,
      position: this.options.position
    };
  }
}

// Экспорт модуля
export default NotificationModule;
