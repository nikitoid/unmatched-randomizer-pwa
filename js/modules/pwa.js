// PWA модуль для управления установкой и PWA функциями

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    this.checkInstallStatus();
    this.setupInstallPrompt();
    this.setupInstallButton();
    this.setupAppInstalledListener();
    this.setupVisibilityChange();
  }

  // Проверка статуса установки
  checkInstallStatus() {
    // Проверяем, запущено ли приложение в standalone режиме
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('PWA: App is running in standalone mode');
    }

    // Проверяем через navigator.standalone (iOS Safari)
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('PWA: App is running in iOS standalone mode');
    }

    this.updateUI();
  }

  // Настройка события для отображения промпта установки
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: Install prompt available');
      
      // Предотвращаем автоматическое отображение
      e.preventDefault();
      
      // Сохраняем событие для последующего использования
      this.deferredPrompt = e;
      
      // Показываем кнопку установки
      this.showInstallButton();
    });
  }

  // Настройка кнопки установки
  setupInstallButton() {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.showInstallPrompt();
      });
    }
  }

  // Показать кнопку установки
  showInstallButton() {
    const pwaStatus = document.getElementById('pwa-status');
    if (pwaStatus && !this.isInstalled) {
      pwaStatus.classList.remove('hidden');
      pwaStatus.classList.add('fade-in');
    }
  }

  // Скрыть кнопку установки
  hideInstallButton() {
    const pwaStatus = document.getElementById('pwa-status');
    if (pwaStatus) {
      pwaStatus.classList.add('hidden');
    }
  }

  // Показать промпт установки
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.log('PWA: Install prompt not available');
      return;
    }

    try {
      // Показываем промпт
      this.deferredPrompt.prompt();
      
      // Ждем ответа пользователя
      const result = await this.deferredPrompt.userChoice;
      
      console.log('PWA: Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        console.log('PWA: User accepted install prompt');
        this.hideInstallButton();
      } else {
        console.log('PWA: User dismissed install prompt');
      }
      
      // Очищаем сохраненный промпт
      this.deferredPrompt = null;
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error);
    }
  }

  // Обработчик события установки приложения
  setupAppInstalledListener() {
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA: App was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showNotification('Приложение успешно установлено!', 'success');
      this.deferredPrompt = null;
    });
  }

  // Обработка изменения видимости страницы
  setupVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('PWA: App became visible');
        this.checkForUpdates();
      }
    });
  }

  // Проверка обновлений Service Worker
  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          console.log('PWA: Service Worker update check completed');
        }
      } catch (error) {
        console.error('PWA: Error checking for updates:', error);
      }
    }
  }

  // Обновление UI в зависимости от статуса установки
  updateUI() {
    if (this.isInstalled) {
      this.hideInstallButton();
      // Можно добавить специальные стили для установленного приложения
      document.body.classList.add('pwa-installed');
    }
  }

  // Показать уведомление
  showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `pwa-notification ${type}`;
    notification.textContent = message;
    
    // Добавляем стили
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '1000',
      animation: 'slideInRight 0.3s ease-out',
      maxWidth: '300px',
      wordWrap: 'break-word'
    });
    
    // Добавляем на страницу
    document.body.appendChild(notification);
    
    // Удаляем через 5 секунд
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Получение информации о возможностях устройства
  getDeviceCapabilities() {
    return {
      isOnline: navigator.onLine,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushManager: 'PushManager' in window,
      hasNotifications: 'Notification' in window,
      hasGeolocation: 'geolocation' in navigator,
      hasDeviceMotion: 'DeviceMotionEvent' in window,
      hasDeviceOrientation: 'DeviceOrientationEvent' in window,
      hasVibrate: 'vibrate' in navigator,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  }

  // Запрос разрешения на уведомления
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('PWA: This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Показать локальное уведомление
  async showLocalNotification(title, options = {}) {
    const hasPermission = await this.requestNotificationPermission();
    
    if (!hasPermission) {
      console.log('PWA: Notification permission denied');
      return;
    }

    const defaultOptions = {
      body: 'Уведомление от Common App PWA',
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const notification = new Notification(title, finalOptions);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('PWA: Error showing notification:', error);
    }
  }
}

// CSS для анимаций уведомлений
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(style);

// Экспорт класса
export { PWAManager };
