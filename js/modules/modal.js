// Модуль модальных окон с поддержкой разных типов и анимаций

import { Module } from './Module.js';

class ModalModule extends Module {
  constructor(name = 'modal', options = {}) {
    super(name, options);
    
    // Настройки по умолчанию
    this.defaultOptions = {
      closeOnOverlay: true,
      closeOnEscape: true,
      lockBodyScroll: true,
      showCloseButton: true,
      animation: 'fadeIn',
      animationDuration: 300,
      maxModals: 5,
      ...options
    };
    
    // Состояние модуля
    this.modals = new Map(); // Активные модальные окна
    this.modalQueue = []; // Очередь модальных окон
    this.currentZIndex = 1000;
    this.bodyScrollLocked = false;
    this.originalBodyOverflow = '';
    this.currentModal = null;
    
    // ID счетчик для модальных окон
    this.modalIdCounter = 0;
    
    // Типы модальных окон
    this.modalTypes = {
      CENTER: 'center',
      BOTTOM_SHEET: 'bottom-sheet', 
      FULLSCREEN: 'fullscreen'
    };
    
    // Доступные анимации
    this.animations = {
      fadeIn: 'modal-fade-in',
      slideUp: 'modal-slide-up',
      slideFromRight: 'modal-slide-right',
      slideFromLeft: 'modal-slide-left',
      scale: 'modal-scale'
    };

    // CSS стили для модального окна
    this.styles = `
      /* Основные стили модального окна */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      
      .modal-overlay.show {
        opacity: 1;
        visibility: visible;
      }
      
      /* Контейнер модального окна */
      .modal-container {
        position: relative;
        background: var(--background-color, #ffffff);
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.8);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .modal-overlay.show .modal-container {
        transform: scale(1);
      }
      
      /* Типы модальных окон */
      
      /* Центрированное модальное окно */
      .modal-overlay.center {
        align-items: center;
        justify-content: center;
      }
      
      .modal-overlay.center .modal-container {
        width: auto;
        min-width: 320px;
        max-width: 500px;
      }
      
      /* Bottom Sheet модальное окно */
      .modal-overlay.bottom-sheet {
        align-items: flex-end;
        justify-content: center;
      }
      
      .modal-overlay.bottom-sheet .modal-container {
        width: 100%;
        max-width: none;
        border-radius: 20px 20px 0 0;
        transform: translateY(100%);
        margin: 0;
      }
      
      .modal-overlay.bottom-sheet.show .modal-container {
        transform: translateY(0);
      }
      
      /* Полноэкранное модальное окно */
      .modal-overlay.fullscreen {
        align-items: stretch;
        justify-content: stretch;
      }
      
      .modal-overlay.fullscreen .modal-container {
        width: 100%;
        height: 100%;
        max-width: none;
        max-height: none;
        border-radius: 0;
        margin: 0;
      }
      
      /* Заголовок модального окна */
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px 16px;
        border-bottom: 1px solid var(--border-color, #e2e8f0);
      }
      
      .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #1e293b);
        margin: 0;
      }
      
      /* Кнопка закрытия */
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary, #64748b);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease, color 0.2s ease;
        min-width: 32px;
        min-height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal-close:hover {
        background-color: var(--surface-color, #f8fafc);
        color: var(--text-primary, #1e293b);
      }
      
      .modal-close:active {
        transform: scale(0.95);
      }
      
      /* Содержимое модального окна */
      .modal-content {
        padding: 20px 24px;
        color: var(--text-primary, #1e293b);
        line-height: 1.6;
        overflow-y: auto;
        max-height: calc(90vh - 160px);
      }
      
      .modal-overlay.fullscreen .modal-content {
        max-height: calc(100vh - 160px);
      }
      
      /* Футер модального окна */
      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px 20px;
        border-top: 1px solid var(--border-color, #e2e8f0);
      }
      
      /* Кнопки в модальном окне */
      .modal-button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 40px;
        min-width: 80px;
      }
      
      .modal-button-primary {
        background: var(--primary-color, #2563eb);
        color: white;
      }
      
      .modal-button-primary:hover {
        background: var(--primary-hover, #1d4ed8);
      }
      
      .modal-button-secondary {
        background: var(--surface-color, #f8fafc);
        color: var(--text-primary, #1e293b);
        border: 1px solid var(--border-color, #e2e8f0);
      }
      
      .modal-button-secondary:hover {
        background: var(--border-color, #e2e8f0);
      }
      
      .modal-button:active {
        transform: scale(0.98);
      }
      
      /* Анимации */
      
      /* Fade In */
      .modal-fade-in .modal-container {
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .modal-fade-in.show .modal-container {
        opacity: 1;
        transform: scale(1);
      }
      
      /* Slide Up */
      .modal-slide-up .modal-container {
        transform: translateY(50px) scale(0.95);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      }
      
      .modal-slide-up.show .modal-container {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      
      /* Slide From Right */
      .modal-slide-right .modal-container {
        transform: translateX(50px) scale(0.95);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      }
      
      .modal-slide-right.show .modal-container {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      
      /* Slide From Left */
      .modal-slide-left .modal-container {
        transform: translateX(-50px) scale(0.95);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      }
      
      .modal-slide-left.show .modal-container {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      
      /* Scale */
      .modal-scale .modal-container {
        transform: scale(0.5);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease;
      }
      
      .modal-scale.show .modal-container {
        transform: scale(1);
        opacity: 1;
      }
      
      /* Темная тема */
      @media (prefers-color-scheme: dark) {
        .modal-container {
          background: var(--surface-color, #1e293b);
          border: 1px solid var(--border-color, #334155);
        }
      }
      
      /* Мобильная оптимизация */
      @media (max-width: 768px) {
        .modal-overlay.center .modal-container {
          margin: 20px;
          max-width: calc(100vw - 40px);
        }
        
        .modal-header {
          padding: 16px 20px 12px;
        }
        
        .modal-content {
          padding: 16px 20px;
          max-height: calc(100vh - 200px);
        }
        
        .modal-footer {
          padding: 12px 20px 16px;
          flex-direction: column-reverse;
          gap: 8px;
        }
        
        .modal-button {
          width: 100%;
          margin: 0;
        }
      }
      
      /* Блокировка скролла body */
      body.modal-open {
        overflow: hidden;
        position: fixed;
        width: 100%;
        height: 100%;
      }
      
      /* Высокий z-index для модальных окон */
      .modal-overlay {
        z-index: var(--modal-z-index, 1000);
      }
    `;
  }
  
  // Инициализация модуля
  async onInit() {
    console.log('Modal: Инициализация модуля модальных окон...');
    
    // Настройка обработчиков событий
    this.setupEventListeners();
    
    // Подписка на события шины
    this.setupEventBusListeners();
    
    console.log('Modal: Модуль модальных окон инициализирован');
  }
  
  // Настройка глобальных обработчиков событий
  setupEventListeners() {
    // Обработчик нажатия клавиши Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentModal && this.defaultOptions.closeOnEscape) {
        this.hide(this.currentModal.id);
      }
    });
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
      this.updateModalPositions();
    });
  }
  
  // Настройка слушателей событий EventBus
  setupEventBusListeners() {
    // Слушаем события для показа модальных окон
    this.on('modal:show', (data) => {
      this.show(data.content, data.options);
    });
    
    this.on('modal:hide', (data) => {
      this.hide(data.modalId);
    });
    
    this.on('modal:confirm', (data) => {
      this.confirm(data.message, data.options);
    });
    
    this.on('modal:alert', (data) => {
      this.alert(data.message, data.options);
    });
  }
  
  // Основные методы модального окна
  
  // Показать модальное окно
  show(content, options = {}) {
    const modalOptions = { ...this.defaultOptions, ...options };
    const modalId = this.generateModalId();
    
    const modalData = {
      id: modalId,
      content,
      options: modalOptions,
      type: modalOptions.type || this.modalTypes.CENTER,
      animation: modalOptions.animation || 'fadeIn',
      callbacks: {
        onShow: modalOptions.onShow,
        onHide: modalOptions.onHide,
        onConfirm: modalOptions.onConfirm,
        onCancel: modalOptions.onCancel
      },
      element: null,
      isVisible: false
    };
    
    // Если превышен лимит модальных окон, добавляем в очередь
    if (this.modals.size >= this.defaultOptions.maxModals) {
      this.modalQueue.push(modalData);
      console.log(`Modal: Модальное окно ${modalId} добавлено в очередь`);
      return modalId;
    }
    
    this.createModalElement(modalData);
    this.showModal(modalData);
    
    return modalId;
  }
  
  // Скрыть модальное окно
  hide(modalId) {
    const modalData = this.modals.get(modalId);
    
    if (!modalData) {
      console.warn(`Modal: Модальное окно ${modalId} не найдено`);
      return false;
    }
    
    this.hideModal(modalData);
    return true;
  }
  
  // Показать диалог подтверждения
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const confirmOptions = {
        type: this.modalTypes.CENTER,
        title: options.title || 'Подтверждение',
        confirmText: options.confirmText || 'Подтвердить',
        cancelText: options.cancelText || 'Отмена',
        showCancelButton: true,
        animation: options.animation || 'slideUp',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        ...options
      };
      
      const content = this.createConfirmContent(message, confirmOptions);
      this.show(content, confirmOptions);
    });
  }
  
  // Показать предупреждение
  alert(message, options = {}) {
    return new Promise((resolve) => {
      const alertOptions = {
        type: this.modalTypes.CENTER,
        title: options.title || 'Внимание',
        confirmText: options.confirmText || 'OK',
        showCancelButton: false,
        animation: options.animation || 'fadeIn',
        onConfirm: () => resolve(true),
        ...options
      };
      
      const content = this.createAlertContent(message, alertOptions);
      this.show(content, alertOptions);
    });
  }
  
  // Создание HTML элемента модального окна
  createModalElement(modalData) {
    const overlay = document.createElement('div');
    overlay.className = `modal-overlay ${modalData.type} ${this.animations[modalData.animation] || 'modal-fade-in'}`;
    overlay.style.zIndex = this.getNextZIndex();
    overlay.setAttribute('data-modal-id', modalData.id);
    
    const container = document.createElement('div');
    container.className = 'modal-container';
    
    // Заголовок
    if (modalData.options.title) {
      const header = document.createElement('div');
      header.className = 'modal-header';
      
      const title = document.createElement('h3');
      title.className = 'modal-title';
      title.textContent = modalData.options.title;
      header.appendChild(title);
      
      // Кнопка закрытия
      if (modalData.options.showCloseButton) {
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.hide(modalData.id));
        header.appendChild(closeButton);
      }
      
      container.appendChild(header);
    }
    
    // Содержимое
    const content = document.createElement('div');
    content.className = 'modal-content';
    
    if (typeof modalData.content === 'string') {
      content.innerHTML = modalData.content;
    } else if (modalData.content instanceof HTMLElement) {
      content.appendChild(modalData.content);
    }
    
    container.appendChild(content);
    
    // Футер с кнопками
    if (modalData.options.showCancelButton || modalData.options.confirmText) {
      const footer = document.createElement('div');
      footer.className = 'modal-footer';
      
      if (modalData.options.showCancelButton) {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'modal-button modal-button-secondary';
        cancelButton.textContent = modalData.options.cancelText || 'Отмена';
        cancelButton.addEventListener('click', () => {
          if (modalData.callbacks.onCancel) {
            modalData.callbacks.onCancel();
          }
          this.hide(modalData.id);
        });
        footer.appendChild(cancelButton);
      }
      
      if (modalData.options.confirmText) {
        const confirmButton = document.createElement('button');
        confirmButton.className = 'modal-button modal-button-primary';
        confirmButton.textContent = modalData.options.confirmText;
        confirmButton.addEventListener('click', () => {
          if (modalData.callbacks.onConfirm) {
            modalData.callbacks.onConfirm();
          }
          this.hide(modalData.id);
        });
        footer.appendChild(confirmButton);
      }
      
      container.appendChild(footer);
    }
    
    overlay.appendChild(container);
    
    // Закрытие по клику на overlay
    if (modalData.options.closeOnOverlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hide(modalData.id);
        }
      });
    }
    
    modalData.element = overlay;
    document.body.appendChild(overlay);
  }
  
  // Показать созданное модальное окно
  showModal(modalData) {
    this.modals.set(modalData.id, modalData);
    this.currentModal = modalData;
    
    // Блокируем скролл body если нужно
    if (modalData.options.lockBodyScroll) {
      this.lockBodyScroll();
    }
    
    // Показываем модальное окно с задержкой для анимации
    requestAnimationFrame(() => {
      modalData.element.classList.add('show');
      modalData.isVisible = true;
      
      // Вызываем callback
      if (modalData.callbacks.onShow) {
        modalData.callbacks.onShow(modalData.id);
      }
      
      // Уведомляем через EventBus
      this.emit('modal:shown', { modalId: modalData.id, type: modalData.type });
      
      console.log(`Modal: Модальное окно ${modalData.id} показано`);
    });
  }
  
  // Скрыть модальное окно
  hideModal(modalData) {
    if (!modalData.isVisible) return;
    
    modalData.element.classList.remove('show');
    modalData.isVisible = false;
    
    // Задержка для анимации перед удалением
    setTimeout(() => {
      if (modalData.element && modalData.element.parentNode) {
        modalData.element.parentNode.removeChild(modalData.element);
      }
      
      this.modals.delete(modalData.id);
      
      // Обновляем текущее модальное окно
      if (this.currentModal === modalData) {
        this.currentModal = this.getTopModal();
      }
      
      // Разблокируем скролл если больше нет модальных окон
      if (this.modals.size === 0) {
        this.unlockBodyScroll();
      }
      
      // Показываем следующее модальное окно из очереди
      this.processQueue();
      
      // Вызываем callback
      if (modalData.callbacks.onHide) {
        modalData.callbacks.onHide(modalData.id);
      }
      
      // Уведомляем через EventBus
      this.emit('modal:hidden', { modalId: modalData.id, type: modalData.type });
      
      console.log(`Modal: Модальное окно ${modalData.id} скрыто`);
      
    }, modalData.options.animationDuration || this.defaultOptions.animationDuration);
  }
  
  // Создание содержимого для диалога подтверждения
  createConfirmContent(message, options) {
    const content = document.createElement('div');
    content.innerHTML = `<p style="margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>`;
    return content;
  }
  
  // Создание содержимого для предупреждения
  createAlertContent(message, options) {
    const content = document.createElement('div');
    content.innerHTML = `<p style="margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>`;
    return content;
  }
  
  // Вспомогательные методы
  
  // Генерация уникального ID для модального окна
  generateModalId() {
    return `modal-${++this.modalIdCounter}-${Date.now()}`;
  }
  
  // Получение следующего z-index
  getNextZIndex() {
    return ++this.currentZIndex;
  }
  
  // Получение верхнего модального окна
  getTopModal() {
    let topModal = null;
    let maxZIndex = 0;
    
    for (const [id, modal] of this.modals.entries()) {
      const zIndex = parseInt(modal.element.style.zIndex);
      if (zIndex > maxZIndex) {
        maxZIndex = zIndex;
        topModal = modal;
      }
    }
    
    return topModal;
  }
  
  // Обработка очереди модальных окон
  processQueue() {
    if (this.modalQueue.length > 0 && this.modals.size < this.defaultOptions.maxModals) {
      const nextModal = this.modalQueue.shift();
      this.createModalElement(nextModal);
      this.showModal(nextModal);
      console.log(`Modal: Модальное окно ${nextModal.id} показано из очереди`);
    }
  }
  
  // Блокировка скролла body
  lockBodyScroll() {
    if (this.bodyScrollLocked) return;
    
    this.originalBodyOverflow = document.body.style.overflow;
    document.body.classList.add('modal-open');
    this.bodyScrollLocked = true;
    
    console.log('Modal: Скролл body заблокирован');
  }
  
  // Разблокировка скролла body
  unlockBodyScroll() {
    if (!this.bodyScrollLocked) return;
    
    document.body.classList.remove('modal-open');
    document.body.style.overflow = this.originalBodyOverflow;
    this.bodyScrollLocked = false;
    
    console.log('Modal: Скролл body разблокирован');
  }
  
  // Обновление позиций модальных окон при изменении размера
  updateModalPositions() {
    for (const [id, modal] of this.modals.entries()) {
      if (modal.isVisible && modal.type === this.modalTypes.CENTER) {
        // Для центрированных модальных окон можно обновить позицию
        // При необходимости добавить логику пересчета
      }
    }
  }
  
  // Публичные методы для управления модальными окнами
  
  // Скрыть все модальные окна
  hideAll() {
    const modalIds = Array.from(this.modals.keys());
    modalIds.forEach(id => this.hide(id));
    this.modalQueue.length = 0; // Очищаем очередь
    
    console.log('Modal: Все модальные окна скрыты');
  }
  
  // Получить количество открытых модальных окон
  getOpenModalsCount() {
    return this.modals.size;
  }
  
  // Получить количество модальных окон в очереди
  getQueueLength() {
    return this.modalQueue.length;
  }
  
  // Проверить, открыто ли конкретное модальное окно
  isModalOpen(modalId) {
    return this.modals.has(modalId);
  }
  
  // Получить информацию о всех модальных окнах
  getModalsInfo() {
    const info = {
      open: this.modals.size,
      queue: this.modalQueue.length,
      bodyScrollLocked: this.bodyScrollLocked,
      currentModal: this.currentModal?.id || null,
      modals: []
    };
    
    for (const [id, modal] of this.modals.entries()) {
      info.modals.push({
        id,
        type: modal.type,
        animation: modal.animation,
        isVisible: modal.isVisible,
        zIndex: modal.element?.style.zIndex
      });
    }
    
    return info;
  }
  
  // Специальные методы для разных типов модальных окон
  
  // Показать центрированное модальное окно
  showCenter(content, options = {}) {
    return this.show(content, { ...options, type: this.modalTypes.CENTER });
  }
  
  // Показать bottom sheet модальное окно
  showBottomSheet(content, options = {}) {
    return this.show(content, { 
      ...options, 
      type: this.modalTypes.BOTTOM_SHEET,
      animation: options.animation || 'slideUp'
    });
  }
  
  // Показать полноэкранное модальное окно
  showFullscreen(content, options = {}) {
    return this.show(content, { 
      ...options, 
      type: this.modalTypes.FULLSCREEN,
      animation: options.animation || 'fadeIn'
    });
  }
  
  // Уничтожение модуля
  async onDestroy() {
    console.log('Modal: Уничтожение модуля...');
    
    // Скрываем все модальные окна
    this.hideAll();
    
    // Разблокируем скролл
    this.unlockBodyScroll();
    
    // Очищаем состояние
    this.modals.clear();
    this.modalQueue.length = 0;
    this.currentModal = null;
    
    console.log('Modal: Модуль уничтожен');
  }
}

// Экспорт модуля
export default ModalModule;
