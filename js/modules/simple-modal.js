// Простая версия модального модуля без зависимостей

class SimpleModal {
  constructor() {
    this.currentModal = null;
    this.modalId = 0;
    this.setupStyles();
  }

  setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .simple-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .simple-modal-overlay.show {
        opacity: 1;
        visibility: visible;
      }
      
      .simple-modal-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.8);
        transition: transform 0.3s ease;
      }
      
      .simple-modal-overlay.show .simple-modal-container {
        transform: scale(1);
      }
      
      .simple-modal-overlay.center {
        align-items: center;
        justify-content: center;
      }
      
      .simple-modal-overlay.center .simple-modal-container {
        width: auto;
        min-width: 320px;
        max-width: 500px;
      }
      
      .simple-modal-overlay.bottom-sheet {
        align-items: flex-end;
        justify-content: center;
      }
      
      .simple-modal-overlay.bottom-sheet .simple-modal-container {
        width: 100%;
        max-width: none;
        border-radius: 20px 20px 0 0;
        transform: translateY(100%);
        margin: 0;
      }
      
      .simple-modal-overlay.bottom-sheet.show .simple-modal-container {
        transform: translateY(0);
      }
      
      .simple-modal-overlay.fullscreen {
        align-items: stretch;
        justify-content: stretch;
      }
      
      .simple-modal-overlay.fullscreen .simple-modal-container {
        width: 100%;
        height: 100%;
        max-width: none;
        max-height: none;
        border-radius: 0;
        margin: 0;
      }
      
      .simple-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .simple-modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }
      
      .simple-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #64748b;
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
      
      .simple-modal-close:hover {
        background-color: #f8fafc;
        color: #1e293b;
      }
      
      .simple-modal-content {
        padding: 20px 24px;
        color: #1e293b;
        line-height: 1.6;
        overflow-y: auto;
        max-height: calc(90vh - 160px);
      }
      
      .simple-modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px 20px;
        border-top: 1px solid #e2e8f0;
      }
      
      .simple-modal-button {
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
      
      .simple-modal-button-primary {
        background: #2563eb;
        color: white;
      }
      
      .simple-modal-button-primary:hover {
        background: #1d4ed8;
      }
      
      .simple-modal-button-secondary {
        background: #f8fafc;
        color: #1e293b;
        border: 1px solid #e2e8f0;
      }
      
      .simple-modal-button-secondary:hover {
        background: #e2e8f0;
      }
      
      body.simple-modal-open {
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }

  show(content, options = {}) {
    const modalId = ++this.modalId;
    const type = options.type || 'center';
    
    const overlay = document.createElement('div');
    overlay.className = `simple-modal-overlay ${type}`;
    overlay.setAttribute('data-modal-id', modalId);
    
    const container = document.createElement('div');
    container.className = 'simple-modal-container';
    
    // Заголовок
    if (options.title) {
      const header = document.createElement('div');
      header.className = 'simple-modal-header';
      
      const title = document.createElement('h3');
      title.className = 'simple-modal-title';
      title.textContent = options.title;
      header.appendChild(title);
      
      const closeButton = document.createElement('button');
      closeButton.className = 'simple-modal-close';
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', () => this.hide(modalId));
      header.appendChild(closeButton);
      
      container.appendChild(header);
    }
    
    // Содержимое
    const contentDiv = document.createElement('div');
    contentDiv.className = 'simple-modal-content';
    
    if (typeof content === 'string') {
      contentDiv.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentDiv.appendChild(content);
    }
    
    container.appendChild(contentDiv);
    
    // Футер с кнопками
    if (options.showButtons) {
      const footer = document.createElement('div');
      footer.className = 'simple-modal-footer';
      
      if (options.cancelText) {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'simple-modal-button simple-modal-button-secondary';
        cancelButton.textContent = options.cancelText;
        cancelButton.addEventListener('click', () => {
          if (options.onCancel) options.onCancel();
          this.hide(modalId);
        });
        footer.appendChild(cancelButton);
      }
      
      if (options.confirmText) {
        const confirmButton = document.createElement('button');
        confirmButton.className = 'simple-modal-button simple-modal-button-primary';
        confirmButton.textContent = options.confirmText;
        confirmButton.addEventListener('click', () => {
          if (options.onConfirm) options.onConfirm();
          this.hide(modalId);
        });
        footer.appendChild(confirmButton);
      }
      
      container.appendChild(footer);
    }
    
    overlay.appendChild(container);
    
    // Закрытие по клику на overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide(modalId);
      }
    });
    
    document.body.appendChild(overlay);
    document.body.classList.add('simple-modal-open');
    
    // Показываем с анимацией
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });
    
    this.currentModal = { id: modalId, element: overlay };
    return modalId;
  }

  hide(modalId) {
    const overlay = document.querySelector(`[data-modal-id="${modalId}"]`);
    if (!overlay) return;
    
    overlay.classList.remove('show');
    
    setTimeout(() => {
      overlay.remove();
      if (!document.querySelector('.simple-modal-overlay')) {
        document.body.classList.remove('simple-modal-open');
      }
    }, 300);
  }

  hideAll() {
    const overlays = document.querySelectorAll('.simple-modal-overlay');
    overlays.forEach(overlay => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    });
    document.body.classList.remove('simple-modal-open');
  }

  showCenter(content, options = {}) {
    return this.show(content, { ...options, type: 'center' });
  }

  showBottomSheet(content, options = {}) {
    return this.show(content, { ...options, type: 'bottom-sheet' });
  }

  showFullscreen(content, options = {}) {
    return this.show(content, { ...options, type: 'fullscreen' });
  }

  confirm(message, options = {}) {
    return new Promise((resolve) => {
      this.show(`<p style="margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>`, {
        title: options.title || 'Подтверждение',
        showButtons: true,
        confirmText: options.confirmText || 'Подтвердить',
        cancelText: options.cancelText || 'Отмена',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }

  alert(message, options = {}) {
    return new Promise((resolve) => {
      this.show(`<p style="margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>`, {
        title: options.title || 'Внимание',
        showButtons: true,
        confirmText: options.confirmText || 'OK',
        onConfirm: () => resolve(true)
      });
    });
  }

  getModalsInfo() {
    const modals = document.querySelectorAll('.simple-modal-overlay');
    return {
      open: modals.length,
      queue: 0,
      bodyScrollLocked: document.body.classList.contains('simple-modal-open'),
      currentModal: this.currentModal?.id || null,
      modals: Array.from(modals).map((modal, index) => ({
        id: modal.getAttribute('data-modal-id'),
        type: modal.classList.contains('center') ? 'center' : 
              modal.classList.contains('bottom-sheet') ? 'bottom-sheet' : 
              modal.classList.contains('fullscreen') ? 'fullscreen' : 'unknown',
        isVisible: modal.classList.contains('show')
      }))
    };
  }
}

// Создаем глобальный экземпляр
window.simpleModal = new SimpleModal();

// Упрощенные демо функции
window.modalDemo = {
  getModalModule() {
    return window.simpleModal;
  },

  async showCenter() {
    const modal = this.getModalModule();
    modal.showCenter(`
      <h3 style="margin: 0 0 16px 0; color: #1e293b;">Центрированное модальное окно</h3>
      <p style="margin: 0; color: #64748b;">Это пример центрированного модального окна с кнопкой закрытия.</p>
    `, {
      title: 'Демонстрация'
    });
  },

  async showConfirm() {
    const modal = this.getModalModule();
    const result = await modal.confirm(
      'Вы уверены, что хотите продолжить? Это действие нельзя будет отменить.',
      {
        title: 'Подтверждение действия',
        confirmText: 'Да, продолжить',
        cancelText: 'Отмена'
      }
    );
    
    if (result) {
      modal.alert('Действие подтверждено!', { title: 'Успех' });
    } else {
      modal.alert('Действие отменено.', { title: 'Отменено' });
    }
  },

  async showAlert() {
    const modal = this.getModalModule();
    await modal.alert(
      'Это важное уведомление! Пожалуйста, обратите внимание на эту информацию.',
      {
        title: '⚠️ Внимание',
        confirmText: 'Понятно'
      }
    );
  },

  showBottomSheet() {
    const modal = this.getModalModule();
    modal.showBottomSheet(`
      <h3 style="margin: 0 0 16px 0; color: #1e293b;">Bottom Sheet</h3>
      <p style="margin: 0 0 16px 0; color: #64748b;">
        Это модальное окно выезжает снизу экрана, удобно для мобильных устройств.
      </p>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">
          💡 Подсказка: Попробуйте закрыть это окно кликом на затемненную область.
        </p>
      </div>
    `, {
      title: 'Bottom Sheet Demo'
    });
  },

  showBottomSheetMenu() {
    const modal = this.getModalModule();
    modal.showBottomSheet(`
      <div style="padding: 8px 0;">
        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
          <h4 style="margin: 0; color: #1e293b;">Выберите действие</h4>
        </div>
        <div onclick="window.modalDemo.handleAction('share')" 
             style="padding: 16px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
          📤 Поделиться
        </div>
        <div onclick="window.modalDemo.handleAction('edit')" 
             style="padding: 16px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
          ✏️ Редактировать
        </div>
        <div onclick="window.modalDemo.handleAction('delete')" 
             style="padding: 16px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;">
          🗑️ Удалить
        </div>
      </div>
    `, {
      title: 'Меню действий'
    });
  },

  async handleAction(action) {
    const modal = this.getModalModule();
    const actions = {
      share: 'Функция "Поделиться" выполнена!',
      edit: 'Переход в режим редактирования...',
      delete: 'Элемент удален!'
    };
    
    modal.hideAll();
    setTimeout(() => {
      modal.alert(actions[action] || 'Неизвестное действие', {
        title: 'Действие выполнено'
      });
    }, 100);
  },

  showFullscreen() {
    const modal = this.getModalModule();
    modal.showFullscreen(`
      <div style="padding: 40px 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
        <h2 style="margin: 0 0 24px 0; color: #1e293b; font-size: 2em;">Полноэкранное модальное окно</h2>
        <p style="margin: 0 0 32px 0; color: #64748b; font-size: 1.1em; max-width: 600px; margin-left: auto; margin-right: auto;">
          Это модальное окно занимает весь экран. Идеально подходит для форм, детальных просмотров или презентаций.
        </p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px; color: white; margin: 20px auto; max-width: 500px;">
          <h3 style="margin: 0 0 16px 0;">Особенности полноэкранного режима:</h3>
          <ul style="text-align: left; margin: 0; padding-left: 20px;">
            <li>Максимальное использование пространства</li>
            <li>Иммерсивный пользовательский опыт</li>
            <li>Подходит для сложного контента</li>
            <li>Отличная производительность на мобильных устройствах</li>
          </ul>
        </div>
      </div>
    `, {
      title: 'Полноэкранная демонстрация'
    });
  },

  showFullscreenForm() {
    const modal = this.getModalModule();
    modal.showFullscreen(`
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="margin: 0 0 24px 0; color: #1e293b;">Форма обратной связи</h2>
        <form>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Имя:</label>
            <input type="text" placeholder="Введите ваше имя" 
                   style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px;">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Email:</label>
            <input type="email" placeholder="your@email.com" 
                   style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px;">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Сообщение:</label>
            <textarea placeholder="Введите ваше сообщение..." rows="5"
                      style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px; resize: vertical;"></textarea>
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px;">
            <button type="button" onclick="window.modalDemo.cancelForm()"
                    style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              Отмена
            </button>
            <button type="button" onclick="window.modalDemo.submitForm(this)"
                    style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              Отправить
            </button>
          </div>
        </form>
      </div>
    `, {
      title: 'Новое сообщение'
    });
  },

  cancelForm() {
    const modal = this.getModalModule();
    modal.hideAll();
  },

  async submitForm(button) {
    const modal = this.getModalModule();
    button.textContent = 'Отправка...';
    button.disabled = true;
    
    setTimeout(() => {
      modal.hideAll();
      setTimeout(() => {
        modal.alert('Сообщение отправлено успешно! Мы свяжемся с вами в ближайшее время.', {
          title: '✅ Успех',
          confirmText: 'Отлично!'
        });
      }, 100);
    }, 1500);
  },

  showWithAnimation(animation) {
    const modal = this.getModalModule();
    const animations = {
      fadeIn: 'Плавное появление',
      slideUp: 'Выезд снизу',
      slideFromRight: 'Выезд справа',
      slideFromLeft: 'Выезд слева',
      scale: 'Масштабирование'
    };
    
    modal.showCenter(`
      <h3 style="margin: 0 0 16px 0; color: #1e293b;">Анимация: ${animations[animation]}</h3>
      <p style="margin: 0; color: #64748b;">
        Это модальное окно использует анимацию "${animation}". 
        Закройте окно и попробуйте другие анимации!
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 16px; text-align: center;">
        <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
          animation: '${animation}'
        </code>
      </div>
    `, {
      title: `Демо анимации: ${animation}`
    });
  },

  hideAll() {
    const modal = this.getModalModule();
    modal.hideAll();
  },

  async showInfo() {
    const modal = this.getModalModule();
    const info = modal.getModalsInfo();
    
    await modal.alert(`
      <h4 style="margin: 0 0 16px 0;">Информация о модальных окнах:</h4>
      <ul style="margin: 0; padding-left: 20px; text-align: left;">
        <li><strong>Открыто:</strong> ${info.open} модальных окон</li>
        <li><strong>В очереди:</strong> ${info.queue} модальных окон</li>
        <li><strong>Скролл заблокирован:</strong> ${info.bodyScrollLocked ? 'Да' : 'Нет'}</li>
        <li><strong>Текущее:</strong> ${info.currentModal || 'Нет'}</li>
      </ul>
    `, {
      title: 'Статус модального модуля',
      confirmText: 'Закрыть'
    });
  }
};

console.log('Simple modal loaded and ready!');
