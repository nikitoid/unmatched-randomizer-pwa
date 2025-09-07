// Продвинутый модуль Toast уведомлений

import { Module } from './Module.js';

class ToastModule extends Module {
  constructor(name, options = {}) {
    const defaultOptions = {
      position: 'top-right',
      maxVisible: 3,
      defaultDuration: 5000,
      animations: true,
      animationType: 'slide', // 'slide' или 'fade'
      closeOnSwipe: true,
      showProgress: true,
      showIcons: true,
      allowHtml: false,
      preventDuplicates: true,
      ...options
    };

    // Определяем стили для модуля
    const styles = `
      /* Контейнеры для разных позиций */
      .toast-container {
        position: fixed;
        z-index: 10001;
        pointer-events: none;
        max-width: 420px;
        width: 100%;
      }

      .toast-container.top {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .toast-container.bottom {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .toast-container.top-right {
        top: 20px;
        right: 20px;
      }

      .toast-container.top-left {
        top: 20px;
        left: 20px;
      }

      .toast-container.bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .toast-container.bottom-left {
        bottom: 20px;
        left: 20px;
      }

      /* Базовые стили toast */
      .toast-item {
        pointer-events: auto;
        margin-bottom: 12px;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 6px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        max-width: 100%;
        word-wrap: break-word;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-height: 64px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        touch-action: pan-x pan-y;
      }

      .toast-item:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12);
      }

      .toast-item:active {
        transform: translateY(-1px) scale(1.01);
      }

      /* Типы toast */
      .toast-item.success {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
        color: white;
      }

      .toast-item.error {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
        color: white;
      }

      .toast-item.warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95));
        color: white;
      }

      .toast-item.info {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
        color: white;
      }

      .toast-item.custom {
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.95), rgba(75, 85, 99, 0.95));
        color: white;
      }

      /* Иконки */
      .toast-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        font-size: 14px;
        font-weight: bold;
        margin-top: 2px;
      }

      /* Контент */
      .toast-content {
        flex: 1;
        min-width: 0;
      }

      .toast-title {
        font-weight: 600;
        margin-bottom: 4px;
        font-size: 15px;
        line-height: 1.3;
      }

      .toast-message {
        opacity: 0.9;
        font-size: 13px;
        line-height: 1.4;
      }

      /* Кнопка закрытия */
      .toast-close {
        position: absolute;
        top: 8px;
        right: 10px;
        background: none;
        border: none;
        color: currentColor;
        opacity: 0.7;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 6px;
        border-radius: 50%;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
      }

      .toast-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.15);
        transform: scale(1.1);
      }

      /* Прогресс-бар */
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.4);
        transition: width linear;
        border-radius: 0 0 12px 12px;
      }

      /* Анимации slide */
      .toast-item.animate-slide-in-right {
        animation: toastSlideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toast-item.animate-slide-out-right {
        animation: toastSlideOutRight 0.3s cubic-bezier(0.4, 0, 0.6, 1);
      }

      .toast-item.animate-slide-in-left {
        animation: toastSlideInLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toast-item.animate-slide-out-left {
        animation: toastSlideOutLeft 0.3s cubic-bezier(0.4, 0, 0.6, 1);
      }

      .toast-item.animate-slide-in-up {
        animation: toastSlideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toast-item.animate-slide-out-up {
        animation: toastSlideOutUp 0.3s cubic-bezier(0.4, 0, 0.6, 1);
      }

      .toast-item.animate-slide-in-down {
        animation: toastSlideInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toast-item.animate-slide-out-down {
        animation: toastSlideOutDown 0.3s cubic-bezier(0.4, 0, 0.6, 1);
      }

      /* Анимации fade */
      .toast-item.animate-fade-in {
        animation: toastFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toast-item.animate-fade-out {
        animation: toastFadeOut 0.3s cubic-bezier(0.4, 0, 0.6, 1);
      }

      /* Keyframes для slide анимаций */
      @keyframes toastSlideInRight {
        from {
          opacity: 0;
          transform: translateX(100%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes toastSlideOutRight {
        from {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateX(100%) scale(0.8);
        }
      }

      @keyframes toastSlideInLeft {
        from {
          opacity: 0;
          transform: translateX(-100%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes toastSlideOutLeft {
        from {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateX(-100%) scale(0.8);
        }
      }

      @keyframes toastSlideInUp {
        from {
          opacity: 0;
          transform: translateY(-100%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes toastSlideOutUp {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(-100%) scale(0.8);
        }
      }

      @keyframes toastSlideInDown {
        from {
          opacity: 0;
          transform: translateY(100%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes toastSlideOutDown {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(100%) scale(0.8);
        }
      }

      /* Keyframes для fade анимаций */
      @keyframes toastFadeIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes toastFadeOut {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.8);
        }
      }

      /* Темная тема */
      @media (prefers-color-scheme: dark) {
        .toast-item {
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      }

      /* Адаптивность */
      @media (max-width: 480px) {
        .toast-container {
          left: 12px !important;
          right: 12px !important;
          max-width: none;
          transform: none !important;
          width: auto;
        }

        .toast-item {
          margin-bottom: 10px;
          padding: 14px 16px;
          font-size: 13px;
          min-height: 56px;
          gap: 10px;
        }

        .toast-icon {
          width: 20px;
          height: 20px;
          font-size: 12px;
        }

        .toast-title {
          font-size: 14px;
        }

        .toast-message {
          font-size: 12px;
        }

        .toast-close {
          width: 24px;
          height: 24px;
          font-size: 16px;
        }
      }

      /* Styles для свайпа */
      .toast-item.swiping {
        transition: transform 0.1s ease-out;
      }

      .toast-item.swipe-out {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
      }
    `;

    super(name, { ...defaultOptions, styles });

    this.container = null;
    this.toasts = new Map();
    this.queue = [];
    this.toastId = 0;
    this.isDragging = false;
    
    // Иконки для типов
    this.icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      custom: '●'
    };
  }

  // Инициализация модуля
  async onInit() {
    this.createContainer();
    this.setupEventListeners();
    
    console.log(`ToastModule: Инициализирован с позицией "${this.options.position}"`);
    
    // Демонстрационное уведомление
    setTimeout(() => {
      this.show('Toast модуль готов!', 'success', {
        message: 'Система toast уведомлений успешно инициализирована',
        duration: 3000
      });
    }, 1000);
  }

  // Уничтожение модуля
  async onDestroy() {
    this.clearAll();
    this.removeContainer();
    this.queue = [];
    
    console.log('ToastModule: Уничтожен');
  }

  // Создание контейнера
  createContainer() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = `toast-container ${this.options.position}`;
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

  // Основной метод показа toast
  show(title, type = 'info', options = {}) {
    // Если передана строка в type, то это упрощенный вызов
    if (typeof type === 'string' && !['success', 'error', 'warning', 'info', 'custom'].includes(type)) {
      // type на самом деле message, сдвигаем параметры
      options = typeof options === 'string' ? { duration: parseInt(options) } : options;
      options.message = type;
      type = 'info';
    }

    const id = ++this.toastId;
    const finalOptions = {
      message: '',
      duration: this.options.defaultDuration,
      closable: true,
      showProgress: this.options.showProgress,
      showIcon: this.options.showIcons,
      allowHtml: this.options.allowHtml,
      icon: this.icons[type] || this.icons.custom,
      onClick: null,
      onClose: null,
      priority: 0,
      ...options
    };

    // Проверка дубликатов
    if (this.options.preventDuplicates && this.isDuplicate(title, finalOptions.message, type)) {
      console.log(`ToastModule: Дубликат пропущен "${title}"`);
      return null;
    }

    const toastData = {
      id,
      title,
      type,
      element: null,
      timer: null,
      progressTimer: null,
      createdAt: Date.now(),
      paused: false,
      startTime: null,
      remainingTime: finalOptions.duration,
      ...finalOptions
    };

    // Проверяем лимит видимых toast
    if (this.toasts.size >= this.options.maxVisible) {
      this.addToQueue(toastData);
      return id;
    }

    this.createAndShowToast(toastData);
    return id;
  }

  // Создание и показ toast
  createAndShowToast(toastData) {
    const element = this.createToastElement(toastData);
    toastData.element = element;
    
    this.toasts.set(toastData.id, toastData);
    this.container.appendChild(element);

    // Анимация появления
    this.animateIn(element, toastData.id);

    // Автоматическое удаление
    if (toastData.duration > 0) {
      this.setTimer(toastData.id, toastData.duration);
    }

    // Событие создания toast
    this.emit('toast:created', { id: toastData.id, title: toastData.title, type: toastData.type });

    console.log(`ToastModule: Показан toast "${toastData.title}" (${toastData.type})`);
  }

  // Создание элемента toast
  createToastElement(toastData) {
    const element = document.createElement('div');
    element.className = `toast-item ${toastData.type}`;
    element.setAttribute('data-toast-id', toastData.id);

    // Иконка
    if (toastData.showIcon) {
      const iconElement = document.createElement('div');
      iconElement.className = 'toast-icon';
      if (toastData.allowHtml) {
        iconElement.innerHTML = toastData.icon;
      } else {
        iconElement.textContent = toastData.icon;
      }
      element.appendChild(iconElement);
    }

    // Контент
    const contentElement = document.createElement('div');
    contentElement.className = 'toast-content';

    const titleElement = document.createElement('div');
    titleElement.className = 'toast-title';
    if (toastData.allowHtml) {
      titleElement.innerHTML = toastData.title;
    } else {
      titleElement.textContent = toastData.title;
    }
    contentElement.appendChild(titleElement);

    if (toastData.message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'toast-message';
      if (toastData.allowHtml) {
        messageElement.innerHTML = toastData.message;
      } else {
        messageElement.textContent = toastData.message;
      }
      contentElement.appendChild(messageElement);
    }

    element.appendChild(contentElement);

    // Кнопка закрытия
    if (toastData.closable) {
      const closeButton = document.createElement('button');
      closeButton.className = 'toast-close';
      closeButton.innerHTML = '×';
      closeButton.onclick = (e) => {
        e.stopPropagation();
        this.hide(toastData.id);
      };
      element.appendChild(closeButton);
    }

    // Прогресс-бар
    if (toastData.showProgress && toastData.duration > 0) {
      const progressElement = document.createElement('div');
      progressElement.className = 'toast-progress';
      element.appendChild(progressElement);
    }

    // Обработка кликов
    element.onclick = (e) => {
      if (e.target === element || e.target.closest('.toast-content')) {
        this.emit('toast:clicked', { 
          id: toastData.id, 
          title: toastData.title, 
          type: toastData.type 
        });
        if (toastData.onClick) {
          toastData.onClick(toastData.id);
        }
      }
    };

    // Обработка свайпов на мобильных
    if (this.options.closeOnSwipe) {
      this.setupSwipeHandlers(element, toastData.id);
    }

    return element;
  }

  // Настройка обработчиков свайпов
  setupSwipeHandlers(element, toastId) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startTime = 0;

    const handleStart = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      currentX = startX;
      startTime = Date.now();
      isDragging = true;
      element.classList.add('swiping');
    };

    const handleMove = (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      const touch = e.touches ? e.touches[0] : e;
      currentX = touch.clientX;
      const deltaX = currentX - startX;
      
      // Только горизонтальный свайп
      if (Math.abs(deltaX) > 10) {
        const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
        element.style.transform = `translateX(${deltaX}px)`;
        element.style.opacity = opacity;
      }
    };

    const handleEnd = (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      element.classList.remove('swiping');
      
      const deltaX = currentX - startX;
      const deltaTime = Date.now() - startTime;
      const velocity = Math.abs(deltaX) / deltaTime;
      
      // Проверяем условия для закрытия
      if (Math.abs(deltaX) > 100 || velocity > 0.5) {
        // Свайп для закрытия
        element.classList.add('swipe-out');
        element.style.transform = `translateX(${deltaX > 0 ? '100%' : '-100%'})`;
        element.style.opacity = '0';
        
        setTimeout(() => {
          this.hide(toastId);
        }, 300);
      } else {
        // Возвращаем на место
        element.style.transform = '';
        element.style.opacity = '';
      }
    };

    // Touch события
    element.addEventListener('touchstart', handleStart, { passive: true });
    element.addEventListener('touchmove', handleMove, { passive: false });
    element.addEventListener('touchend', handleEnd, { passive: true });
    
    // Mouse события для десктопа
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mousemove', handleMove);
    element.addEventListener('mouseup', handleEnd);
    element.addEventListener('mouseleave', handleEnd);
  }

  // Анимация появления
  animateIn(element, toastId) {
    if (!this.options.animations) return;

    const position = this.options.position;
    const animationType = this.options.animationType;

    if (animationType === 'fade') {
      element.classList.add('animate-fade-in');
    } else {
      // slide анимации в зависимости от позиции
      if (position.includes('right')) {
        element.classList.add('animate-slide-in-right');
      } else if (position.includes('left')) {
        element.classList.add('animate-slide-in-left');
      } else if (position.includes('top')) {
        element.classList.add('animate-slide-in-up');
      } else {
        element.classList.add('animate-slide-in-down');
      }
    }
  }

  // Анимация исчезновения
  animateOut(element, toastId, callback) {
    if (!this.options.animations) {
      callback();
      return;
    }

    const position = this.options.position;
    const animationType = this.options.animationType;

    if (animationType === 'fade') {
      element.classList.add('animate-fade-out');
    } else {
      // slide анимации в зависимости от позиции
      if (position.includes('right')) {
        element.classList.add('animate-slide-out-right');
      } else if (position.includes('left')) {
        element.classList.add('animate-slide-out-left');
      } else if (position.includes('top')) {
        element.classList.add('animate-slide-out-up');
      } else {
        element.classList.add('animate-slide-out-down');
      }
    }

    setTimeout(callback, 300);
  }

  // Скрытие toast
  hide(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    // Очищаем таймеры
    if (toast.timer) {
      clearTimeout(toast.timer);
    }
    if (toast.progressTimer) {
      clearInterval(toast.progressTimer);
    }

    // Анимация исчезновения
    this.animateOut(toast.element, id, () => {
      this.removeToast(id);
      this.processQueue();
    });

    // Вызываем callback
    if (toast.onClose) {
      toast.onClose(id);
    }

    this.emit('toast:hidden', { id });
  }

  // Удаление toast
  removeToast(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.element.remove();
    this.toasts.delete(id);
    
    this.emit('toast:removed', { id });
  }

  // Очистка конкретного toast
  clear(id) {
    this.hide(id);
  }

  // Очистка всех toast
  clearAll() {
    for (const id of this.toasts.keys()) {
      this.hide(id);
    }
    this.queue = [];
  }

  // Добавление в очередь
  addToQueue(toastData) {
    // Сортируем по приоритету (высокий приоритет первым)
    this.queue.push(toastData);
    this.queue.sort((a, b) => b.priority - a.priority);
    
    console.log(`ToastModule: Toast добавлен в очередь (${this.queue.length} в очереди)`);
  }

  // Обработка очереди
  processQueue() {
    if (this.queue.length === 0 || this.toasts.size >= this.options.maxVisible) return;

    const toastData = this.queue.shift();
    this.createAndShowToast(toastData);
    
    // Рекурсивно обрабатываем оставшуюся очередь
    setTimeout(() => this.processQueue(), 100);
  }

  // Установка таймера
  setTimer(id, duration) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.startTime = Date.now();
    toast.remainingTime = duration;

    // Основной таймер
    toast.timer = setTimeout(() => {
      this.hide(id);
    }, duration);

    // Прогресс-бар
    const progressElement = toast.element.querySelector('.toast-progress');
    if (progressElement) {
      progressElement.style.width = '100%';
      progressElement.style.transition = `width ${duration}ms linear`;
      
      setTimeout(() => {
        progressElement.style.width = '0%';
      }, 50);
    }
  }

  // Приостановка всех таймеров
  pauseAllTimers() {
    for (const [id, toast] of this.toasts.entries()) {
      if (toast.timer && !toast.paused) {
        clearTimeout(toast.timer);
        toast.remainingTime = toast.remainingTime - (Date.now() - toast.startTime);
        toast.paused = true;
        
        // Приостанавливаем прогресс-бар
        const progressElement = toast.element.querySelector('.toast-progress');
        if (progressElement) {
          progressElement.style.transition = 'none';
        }
      }
    }
  }

  // Возобновление всех таймеров
  resumeAllTimers() {
    for (const [id, toast] of this.toasts.entries()) {
      if (toast.paused && toast.remainingTime > 0) {
        toast.paused = false;
        this.setTimer(id, toast.remainingTime);
      }
    }
  }

  // Проверка дубликатов
  isDuplicate(title, message, type) {
    for (const toast of this.toasts.values()) {
      if (toast.title === title && toast.message === message && toast.type === type) {
        return true;
      }
    }
    return false;
  }

  // Обновление позиции контейнера
  updateContainerPosition() {
    if (!this.container) return;
    
    this.container.className = `toast-container ${this.options.position}`;
  }

  // Изменение позиции
  setPosition(position) {
    this.options.position = position;
    this.updateContainerPosition();
    
    this.emit('toast:position-changed', { position });
  }

  // Изменение максимального количества
  setMaxVisible(max) {
    this.options.maxVisible = max;
    
    // Если превышен лимит, скрываем лишние
    while (this.toasts.size > max) {
      const oldestId = this.getOldestToastId();
      if (oldestId) {
        this.hide(oldestId);
      }
    }
    
    // Обрабатываем очередь
    this.processQueue();
  }

  // Получение ID самого старого toast
  getOldestToastId() {
    let oldestId = null;
    let oldestTime = Date.now();

    for (const [id, toast] of this.toasts.entries()) {
      if (toast.createdAt < oldestTime) {
        oldestTime = toast.createdAt;
        oldestId = id;
      }
    }

    return oldestId;
  }

  // Вспомогательные методы для разных типов
  success(title, options = {}) {
    return this.show(title, 'success', options);
  }

  error(title, options = {}) {
    return this.show(title, 'error', options);
  }

  warning(title, options = {}) {
    return this.show(title, 'warning', options);
  }

  info(title, options = {}) {
    return this.show(title, 'info', options);
  }

  custom(title, options = {}) {
    return this.show(title, 'custom', options);
  }

  // Получение статистики
  getStats() {
    return {
      active: this.toasts.size,
      queued: this.queue.length,
      total: this.toastId,
      position: this.options.position,
      maxVisible: this.options.maxVisible
    };
  }

  // Получение всех активных toast
  getActiveToasts() {
    return Array.from(this.toasts.values()).map(toast => ({
      id: toast.id,
      title: toast.title,
      message: toast.message,
      type: toast.type,
      createdAt: toast.createdAt,
      remainingTime: toast.remainingTime
    }));
  }
}

// Экспорт модуля
export default ToastModule;
