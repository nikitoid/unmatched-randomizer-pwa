// Главный модуль приложения

import { ModuleLoader } from './modules/ModuleLoader.js';
import { eventBus } from './modules/EventBus.js';

// Legacy импорты для обратной совместимости
import { PWAManager } from './modules/pwa.js';
import { CacheStrategyManager } from './modules/cache-strategy.js';

class App {
  constructor() {
    // Новая система модулей
    this.moduleLoader = new ModuleLoader({
      eventBus,
      basePath: './js/modules/',
      autoInit: true,
      loadTimeout: 10000
    });
    
    // Legacy поддержка
    this.pwaManager = null;
    this.cacheManager = null;
    
    // Состояние приложения
    this.isInitialized = false;
    this.modules = new Map();
    
    // Настройка событийной системы
    this.setupEventBus();
    
    this.init();
  }

  async init() {
    try {
      console.log('App: Initializing...');
      
      // Ждем загрузки DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.start());
      } else {
        this.start();
      }
    } catch (error) {
      console.error('App: Initialization error:', error);
    }
  }

  async start() {
    try {
      // Загружаем модули с помощью новой системы
      await this.loadModules();

      // Legacy инициализация для обратной совместимости
      await this.initLegacyModules();

      // Настраиваем обработчики событий
      this.setupEventListeners();

      // Проверяем возможности устройства
      this.checkDeviceCapabilities();

      // Настраиваем периодические проверки
      this.setupPeriodicTasks();

      // Показываем приветственное сообщение
      this.showWelcomeMessage();

      this.isInitialized = true;
      console.log('App: Fully initialized');

      // Запускаем диагностику
      setTimeout(() => this.runDiagnostics(), 2000);

    } catch (error) {
      console.error('App: Start error:', error);
      this.handleInitializationError(error);
    }
  }

  // Настройка событийной системы
  setupEventBus() {
    // Подписываемся на события модулей
    eventBus.on('module:ready', (data) => {
      console.log(`App: Module "${data.module}" ready`);
      this.modules.set(data.module, data.instance);
    });

    eventBus.on('module:error', (data) => {
      console.error(`App: Module "${data.module}" error:`, data.error);
    });

    eventBus.on('modules:loaded', (data) => {
      console.log(`App: ${data.results.filter(r => r.success).length} modules loaded successfully`);
    });

    // Глобальные события приложения
    eventBus.on('app:theme-changed', (data) => {
      document.body.classList.toggle('dark-theme', data.theme === 'dark');
    });

    eventBus.on('app:network-changed', (data) => {
      this.handleNetworkStatusChange(data.isOnline);
    });

    // Связываем модули между собой
    eventBus.on('notification:show', (data) => {
      const notificationModule = this.getModule('notification');
      if (notificationModule) {
        notificationModule.show(data.title, data.message, data.type, data.options);
      }
    });

    eventBus.on('theme:changed', (data) => {
      console.log(`App: Theme changed to "${data.theme}"`);
      // Можно добавить дополнительную логику при смене темы
    });
  }

  // Загрузка модулей через новую систему
  async loadModules() {
    try {
      console.log('App: Loading modules...');
      
      // Определяем модули для загрузки
      const modulesToLoad = [
        {
          name: 'notification',
          options: {
            position: 'top-right',
            duration: 5000,
            maxNotifications: 5
          }
        },
        {
          name: 'theme',
          options: {
            themes: ['light', 'dark', 'auto'],
            defaultTheme: 'auto',
            autoDetect: true
          }
        },
        {
          name: 'modal',
          options: {
            closeOnOverlay: true,
            closeOnEscape: true,
            lockBodyScroll: true,
            showCloseButton: true,
            animation: 'fadeIn',
            animationDuration: 300,
            maxModals: 5
          }
        },
        // Добавьте другие модули здесь
      ];

      // Загружаем модули
      const results = await this.moduleLoader.loadModules(modulesToLoad);
      
      // Обрабатываем результаты
      for (const result of results) {
        if (result.success) {
          this.modules.set(result.name, result.instance);
          console.log(`App: Module "${result.name}" loaded and registered`);
        } else {
          console.error(`App: Failed to load module "${result.name}":`, result.error);
        }
      }

      console.log(`App: Loaded ${results.filter(r => r.success).length}/${results.length} modules`);
      
    } catch (error) {
      console.error('App: Module loading failed:', error);
    }
  }

  // Legacy инициализация для существующих модулей
  async initLegacyModules() {
    try {
      console.log('App: Initializing legacy modules...');
      
      // Инициализируем PWA менеджер
      this.pwaManager = new PWAManager();
      console.log('App: PWA Manager initialized');

      // Инициализируем менеджер кеширования
      this.cacheManager = new CacheStrategyManager();
      console.log('App: Cache Strategy Manager initialized');

      // Сохраняем ссылки в общем реестре модулей
      this.modules.set('pwa', this.pwaManager);
      this.modules.set('cache-strategy', this.cacheManager);

    } catch (error) {
      console.error('App: Legacy module initialization failed:', error);
      throw error;
    }
  }

  // Обработка изменения статуса сети
  handleNetworkStatusChange(isOnline) {
    console.log(`App: Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    // Уведомляем модули об изменении статуса сети
    for (const [name, module] of this.modules.entries()) {
      if (module && typeof module.onNetworkChange === 'function') {
        module.onNetworkChange(isOnline);
      }
    }
  }

  // Настройка обработчиков событий
  setupEventListeners() {
    // Обработка ошибок JavaScript
    window.addEventListener('error', (e) => {
      console.error('App: JavaScript error:', e.error);
      this.handleRuntimeError(e.error);
    });

    // Обработка необработанных промисов
    window.addEventListener('unhandledrejection', (e) => {
      console.error('App: Unhandled promise rejection:', e.reason);
      this.handleRuntimeError(e.reason);
    });

    // Обработка изменения ориентации
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        console.log('App: Orientation changed');
        this.handleOrientationChange();
      }, 100);
    });

    // Обработка изменения размера окна
    window.addEventListener('resize', this.debounce(() => {
      console.log('App: Window resized');
      this.handleResize();
    }, 250));

    // Обработка потери фокуса
    window.addEventListener('blur', () => {
      console.log('App: Window lost focus');
      this.handleWindowBlur();
    });

    // Обработка получения фокуса
    window.addEventListener('focus', () => {
      console.log('App: Window gained focus');
      this.handleWindowFocus();
    });

    // Кастомные кнопки и элементы управления
    this.setupCustomControls();
  }

  // Настройка кастомных элементов управления
  setupCustomControls() {
    // Кнопка очистки кеша (добавим в HTML если нужно)
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', async () => {
        if (confirm('Очистить весь кеш? Это может замедлить последующие загрузки.')) {
          await this.cacheManager.clearCache();
        }
      });
    }

    // Кнопка диагностики
    const diagnosticsBtn = document.getElementById('diagnostics-btn');
    if (diagnosticsBtn) {
      diagnosticsBtn.addEventListener('click', () => {
        this.runDiagnostics();
      });
    }

    // Переключатель темы (если есть)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  // Проверка возможностей устройства
  checkDeviceCapabilities() {
    const capabilities = this.pwaManager.getDeviceCapabilities();
    console.log('App: Device capabilities:', capabilities);

    // Логирование важной информации о устройстве
    if (capabilities.isTouchDevice) {
      console.log('App: Touch device detected');
      document.body.classList.add('touch-device');
    }

    if (capabilities.isStandalone) {
      console.log('App: Running in standalone mode');
      document.body.classList.add('standalone-mode');
    }

    if (!capabilities.isOnline) {
      console.log('App: Device is offline');
      this.handleOfflineState();
    }

    // Настройка специфичных для устройства оптимизаций
    this.optimizeForDevice(capabilities);
  }

  // Оптимизация для конкретного устройства
  optimizeForDevice(capabilities) {
    // iOS оптимизации
    if (capabilities.userAgent.includes('iPhone') || capabilities.userAgent.includes('iPad')) {
      document.body.classList.add('ios-device');
      // Отключаем bounce эффект
      document.addEventListener('touchmove', (e) => {
        if (e.target.closest('.scrollable')) return;
        e.preventDefault();
      }, { passive: false });
    }

    // Android оптимизации
    if (capabilities.userAgent.includes('Android')) {
      document.body.classList.add('android-device');
    }

    // Маленькие экраны
    if (window.innerWidth < 768) {
      document.body.classList.add('small-screen');
    }
  }

  // Настройка периодических задач
  setupPeriodicTasks() {
    // Проверка обновлений каждые 5 минут
    setInterval(() => {
      this.pwaManager.checkForUpdates();
    }, 5 * 60 * 1000);

    // Проверка статуса сети каждые 30 секунд
    setInterval(() => {
      const isOnline = navigator.onLine;
      if (isOnline !== this.cacheManager.networkStatus) {
        console.log('App: Network status changed:', isOnline);
      }
    }, 30 * 1000);

    // Очистка старых уведомлений каждые 10 минут
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 10 * 60 * 1000);
  }

  // Показ приветственного сообщения
  showWelcomeMessage() {
    // Проверяем, первый ли это запуск
    const isFirstRun = !localStorage.getItem('app-initialized');
    
    if (isFirstRun) {
      localStorage.setItem('app-initialized', 'true');
      
      setTimeout(() => {
        this.pwaManager.showNotification(
          'Добро пожаловать в Common App PWA! Приложение готово к работе офлайн.',
          'success'
        );
      }, 1000);
    }
  }

  // Диагностика системы
  async runDiagnostics() {
    console.log('App: Running diagnostics...');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      app: {
        initialized: this.isInitialized,
        version: '1.0.0'
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled
      },
      network: {
        online: navigator.onLine,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || 'unknown'
      },
      pwa: this.pwaManager.getDeviceCapabilities(),
      cache: await this.cacheManager.getCacheStats(),
      performance: {
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
        } : 'unavailable'
      }
    };

    console.table(diagnostics);
    
    // Сохраняем диагностику в localStorage для отладки
    try {
      localStorage.setItem('app-diagnostics', JSON.stringify(diagnostics, null, 2));
    } catch (error) {
      console.warn('App: Could not save diagnostics:', error);
    }

    return diagnostics;
  }

  // Обработка ошибок инициализации
  handleInitializationError(error) {
    console.error('App: Critical initialization error:', error);
    
    // Показываем пользователю сообщение об ошибке
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ef4444;
        color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        z-index: 9999;
        max-width: 300px;
      ">
        <h3>Ошибка инициализации</h3>
        <p>Приложение не может быть запущено. Попробуйте обновить страницу.</p>
        <button onclick="location.reload()" style="
          background: white;
          color: #ef4444;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          margin-top: 10px;
          cursor: pointer;
        ">Обновить</button>
      </div>
    `;
    
    document.body.appendChild(errorMessage);
  }

  // Обработка ошибок времени выполнения
  handleRuntimeError(error) {
    // Логируем подробную информацию об ошибке
    const errorInfo = {
      message: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    console.error('App: Runtime error details:', errorInfo);

    // Сохраняем ошибку для отладки
    try {
      const errors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      errors.push(errorInfo);
      // Храним только последние 10 ошибок
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      localStorage.setItem('app-errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('App: Could not save error info:', e);
    }
  }

  // Обработка изменения ориентации
  handleOrientationChange() {
    // Принудительно перерисовываем layout
    document.body.style.height = window.innerHeight + 'px';
    
    setTimeout(() => {
      document.body.style.height = '';
    }, 500);
  }

  // Обработка изменения размера окна
  handleResize() {
    // Обновляем CSS переменные для viewport
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
  }

  // Обработка потери фокуса окна
  handleWindowBlur() {
    // Можно приостановить некоторые операции для экономии ресурсов
    console.log('App: Entering background mode');
  }

  // Обработка получения фокуса окном
  handleWindowFocus() {
    // Возобновляем операции и проверяем обновления
    console.log('App: Entering foreground mode');
    this.pwaManager.checkForUpdates();
  }

  // Обработка офлайн состояния
  handleOfflineState() {
    console.log('App: Handling offline state');
    // Можно отключить некоторые функции или показать специальный UI
  }

  // Переключение темы
  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
    console.log('App: Theme toggled to:', isDark ? 'dark' : 'light');
  }

  // Очистка старых уведомлений
  cleanupOldNotifications() {
    const notifications = document.querySelectorAll('.pwa-notification, .cache-notification');
    notifications.forEach(notification => {
      const age = Date.now() - parseInt(notification.dataset.timestamp || '0');
      if (age > 30000) { // Старше 30 секунд
        notification.remove();
      }
    });
  }

  // Утилита debounce
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Получение модуля по имени
  getModule(moduleName) {
    return this.modules.get(moduleName);
  }

  // Проверка наличия модуля
  hasModule(moduleName) {
    return this.modules.has(moduleName);
  }

  // Загрузка дополнительного модуля
  async loadModule(moduleName, options = {}) {
    try {
      const instance = await this.moduleLoader.loadModule(moduleName, options);
      this.modules.set(moduleName, instance);
      return instance;
    } catch (error) {
      console.error(`App: Failed to load module "${moduleName}":`, error);
      throw error;
    }
  }

  // Выгрузка модуля
  async unloadModule(moduleName) {
    try {
      const module = this.modules.get(moduleName);
      if (module && typeof module.destroy === 'function') {
        await module.destroy();
      }
      
      this.modules.delete(moduleName);
      console.log(`App: Module "${moduleName}" unloaded`);
      
      return true;
    } catch (error) {
      console.error(`App: Failed to unload module "${moduleName}":`, error);
      return false;
    }
  }

  // Получение списка загруженных модулей
  getLoadedModules() {
    return Array.from(this.modules.keys());
  }

  // Получение информации о всех модулях
  getModulesInfo() {
    const info = {};
    
    for (const [name, instance] of this.modules.entries()) {
      info[name] = {
        name,
        loaded: true,
        initialized: instance.isInitialized !== false,
        enabled: instance.isEnabled !== false,
        type: instance.constructor.name
      };
      
      // Дополнительная информация если доступна
      if (typeof instance.getInfo === 'function') {
        Object.assign(info[name], instance.getInfo());
      }
    }
    
    return info;
  }

  // Отправка события всем модулям
  broadcastToModules(eventName, data = {}) {
    eventBus.emit(eventName, { ...data, source: 'app' });
  }

  // Получение информации о приложении
  getAppInfo() {
    return {
      version: '1.0.0',
      buildDate: new Date().toISOString(),
      isInitialized: this.isInitialized,
      pwaSupported: 'serviceWorker' in navigator,
      currentStrategy: this.cacheManager?.currentStrategy || 'unknown',
      isOnline: navigator.onLine,
      modules: {
        loaded: this.getLoadedModules(),
        count: this.modules.size,
        info: this.getModulesInfo()
      },
      moduleLoader: {
        stats: this.moduleLoader.getStats(),
        eventBusStats: eventBus.getStats()
      }
    };
  }
}

// Инициализация приложения
const app = new App();

// Экспорт для использования в других модулях или отладки
window.app = app;
window.eventBus = eventBus;
window.modules = app.modules;

// Глобальные методы для удобства разработки
window.loadModule = (name, options) => app.loadModule(name, options);
window.getModule = (name) => app.getModule(name);
window.getModulesInfo = () => app.getModulesInfo();

console.log('App: Global objects exposed:', {
  app: 'window.app',
  eventBus: 'window.eventBus', 
  modules: 'window.modules',
  loadModule: 'window.loadModule(name, options)',
  getModule: 'window.getModule(name)',
  getModulesInfo: 'window.getModulesInfo()'
});

export default app;
export { eventBus };
