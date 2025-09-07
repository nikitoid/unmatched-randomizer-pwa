// Демонстрационные функции для модального модуля
// Создаем отдельный файл для предотвращения конфликтов

window.modalDemoHelper = {
  // Ожидание загрузки модуля с повторными попытками
  async waitForModule(moduleName, maxAttempts = 10, delay = 500) {
    for (let i = 0; i < maxAttempts; i++) {
      const module = window.getModule && window.getModule(moduleName);
      if (module) {
        return module;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error(`Module "${moduleName}" not loaded after ${maxAttempts} attempts`);
  },

  // Безопасное получение модуля
  async getSafeModule(moduleName) {
    try {
      // Сначала проверяем прямой доступ
      if (window.getModule) {
        const module = window.getModule(moduleName);
        if (module) return module;
      }

      // Проверяем через app
      if (window.app && window.app.getModule) {
        const module = window.app.getModule(moduleName);
        if (module) return module;
      }

      // Ждем загрузки
      return await this.waitForModule(moduleName);
    } catch (error) {
      console.error(`Failed to get module "${moduleName}":`, error);
      // Показываем пользователю ошибку
      alert(`Модуль "${moduleName}" не загружен. Попробуйте обновить страницу.`);
      return null;
    }
  },

  // Функция для показа ошибки пользователю
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
};

// Переопределяем функции демонстрации модального окна
window.modalDemo = {
  // Получить модуль модального окна
  async getModalModule() {
    return await window.modalDemoHelper.getSafeModule('modal');
  },

  // Показать центрированное модальное окно
  async showCenter() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      modal.showCenter(`
        <h3 style="margin: 0 0 16px 0; color: #1e293b;">Центрированное модальное окно</h3>
        <p style="margin: 0; color: #64748b;">Это пример центрированного модального окна с кнопкой закрытия.</p>
      `, {
        title: 'Демонстрация',
        animation: 'fadeIn'
      });
    } catch (error) {
      console.error('Error showing center modal:', error);
      window.modalDemoHelper.showError('Ошибка при показе модального окна');
    }
  },

  // Показать диалог подтверждения
  async showConfirm() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      const result = await modal.confirm(
        'Вы уверены, что хотите продолжить? Это действие нельзя будет отменить.',
        {
          title: 'Подтверждение действия',
          confirmText: 'Да, продолжить',
          cancelText: 'Отмена',
          animation: 'slideUp'
        }
      );
      
      if (result) {
        modal.alert('Действие подтверждено!', { title: 'Успех', animation: 'fadeIn' });
      } else {
        modal.alert('Действие отменено.', { title: 'Отменено', animation: 'fadeIn' });
      }
    } catch (error) {
      console.error('Error showing confirm modal:', error);
      window.modalDemoHelper.showError('Ошибка при показе диалога подтверждения');
    }
  },

  // Показать предупреждение
  async showAlert() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      await modal.alert(
        'Это важное уведомление! Пожалуйста, обратите внимание на эту информацию.',
        {
          title: '⚠️ Внимание',
          confirmText: 'Понятно',
          animation: 'scale'
        }
      );
    } catch (error) {
      console.error('Error showing alert modal:', error);
      window.modalDemoHelper.showError('Ошибка при показе предупреждения');
    }
  },

  // Показать Bottom Sheet
  async showBottomSheet() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      modal.showBottomSheet(`
        <h3 style="margin: 0 0 16px 0; color: #1e293b;">Bottom Sheet</h3>
        <p style="margin: 0 0 16px 0; color: #64748b;">
          Это модальное окно выезжает снизу экрана, удобно для мобильных устройств.
        </p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            💡 Подсказка: Попробуйте закрыть это окно свайпом вниз или кликом на затемненную область.
          </p>
        </div>
      `, {
        title: 'Bottom Sheet Demo'
      });
    } catch (error) {
      console.error('Error showing bottom sheet:', error);
      window.modalDemoHelper.showError('Ошибка при показе Bottom Sheet');
    }
  },

  // Показать меню действий в Bottom Sheet
  async showBottomSheetMenu() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      modal.showBottomSheet(`
        <div style="padding: 8px 0;">
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
            <h4 style="margin: 0; color: #1e293b;">Выберите действие</h4>
          </div>
          <div onclick="this.closest('.modal-overlay').querySelector('.modal-close').click(); window.modalDemo.handleAction('share')" 
               style="padding: 16px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; background: #f8fafc; border: 1px solid #e2e8f0; transition: background-color 0.2s;">
            📤 Поделиться
          </div>
          <div onclick="this.closest('.modal-overlay').querySelector('.modal-close').click(); window.modalDemo.handleAction('edit')" 
               style="padding: 16px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; background: #f8fafc; border: 1px solid #e2e8f0; transition: background-color 0.2s;">
            ✏️ Редактировать
          </div>
          <div onclick="this.closest('.modal-overlay').querySelector('.modal-close').click(); window.modalDemo.handleAction('delete')" 
               style="padding: 16px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; transition: background-color 0.2s;">
            🗑️ Удалить
          </div>
        </div>
      `, {
        title: 'Меню действий',
        showCloseButton: false
      });
    } catch (error) {
      console.error('Error showing bottom sheet menu:', error);
      window.modalDemoHelper.showError('Ошибка при показе меню действий');
    }
  },

  // Обработка действий из меню
  async handleAction(action) {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      const actions = {
        share: 'Функция "Поделиться" выполнена!',
        edit: 'Переход в режим редактирования...',
        delete: 'Элемент удален!'
      };
      
      await modal.alert(actions[action] || 'Неизвестное действие', {
        title: 'Действие выполнено',
        animation: 'fadeIn'
      });
    } catch (error) {
      console.error('Error handling action:', error);
      window.modalDemoHelper.showError('Ошибка при выполнении действия');
    }
  },

  // Показать полноэкранное модальное окно
  async showFullscreen() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
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
        title: 'Полноэкранная демонстрация',
        animation: 'fadeIn'
      });
    } catch (error) {
      console.error('Error showing fullscreen modal:', error);
      window.modalDemoHelper.showError('Ошибка при показе полноэкранного окна');
    }
  },

  // Показать форму в полноэкранном режиме
  async showFullscreenForm() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      modal.showFullscreen(`
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="margin: 0 0 24px 0; color: #1e293b;">Форма обратной связи</h2>
          <form style="space-y: 20px;">
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
            <div style="flex: 1; display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px;">
              <button type="button" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click()"
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
        title: 'Новое сообщение',
        animation: 'slideFromRight',
        showCloseButton: true
      });
    } catch (error) {
      console.error('Error showing fullscreen form:', error);
      window.modalDemoHelper.showError('Ошибка при показе формы');
    }
  },

  // Обработка отправки формы
  async submitForm(button) {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      button.textContent = 'Отправка...';
      button.disabled = true;
      
      // Имитация отправки
      setTimeout(async () => {
        // Закрываем форму
        button.closest('.modal-overlay').querySelector('.modal-close').click();
        
        // Показываем сообщение об успехе
        await modal.alert('Сообщение отправлено успешно! Мы свяжемся с вами в ближайшее время.', {
          title: '✅ Успех',
          confirmText: 'Отлично!',
          animation: 'scale'
        });
      }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
      window.modalDemoHelper.showError('Ошибка при отправке формы');
      button.textContent = 'Отправить';
      button.disabled = false;
    }
  },

  // Показать модальное окно с определенной анимацией
  async showWithAnimation(animation) {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
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
        title: `Демо анимации: ${animation}`,
        animation: animation
      });
    } catch (error) {
      console.error('Error showing animation demo:', error);
      window.modalDemoHelper.showError('Ошибка при показе анимации');
    }
  },

  // Закрыть все модальные окна
  async hideAll() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
      modal.hideAll();
    } catch (error) {
      console.error('Error hiding all modals:', error);
      window.modalDemoHelper.showError('Ошибка при закрытии модальных окон');
    }
  },

  // Показать информацию о модальных окнах
  async showInfo() {
    const modal = await this.getModalModule();
    if (!modal) return;
    
    try {
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
        confirmText: 'Закрыть',
        animation: 'fadeIn'
      });
    } catch (error) {
      console.error('Error showing modal info:', error);
      window.modalDemoHelper.showError('Ошибка при получении информации о модалях');
    }
  }
};

console.log('Modal demo helper loaded');

// Проверяем состояние загрузки приложения каждые 500мс
const checkAppReady = () => {
  if (window.app && window.app.isInitialized) {
    console.log('App is ready, modal demo functions available');
    // Показываем индикатор готовности
    setTimeout(() => {
      const statusDiv = document.createElement('div');
      statusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #10b981;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: opacity 0.3s ease;
      `;
      statusDiv.textContent = '✅ Модули загружены';
      document.body.appendChild(statusDiv);
      
      setTimeout(() => {
        statusDiv.style.opacity = '0';
        setTimeout(() => statusDiv.remove(), 300);
      }, 3000);
    }, 1000);
    return;
  }
  
  // Проверяем снова через 500мс если приложение еще не готово
  setTimeout(checkAppReady, 500);
};

// Запускаем проверку готовности
checkAppReady();
