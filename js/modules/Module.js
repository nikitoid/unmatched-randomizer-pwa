// Базовый класс для всех модулей

class Module {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.isInitialized = false;
    this.isEnabled = true;
    this.dependencies = options.dependencies || [];
    this.styles = options.styles || '';
    this.styleElement = null;
    this.eventBus = null;
    
    // Биндинг методов для правильного контекста
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
  }

  // Инициализация модуля
  async init() {
    if (this.isInitialized) {
      console.warn(`Module ${this.name}: Already initialized`);
      return true;
    }

    try {
      console.log(`Module ${this.name}: Initializing...`);
      
      // Проверяем зависимости
      if (!await this.checkDependencies()) {
        throw new Error(`Missing dependencies: ${this.dependencies.join(', ')}`);
      }

      // Подключаем стили если есть
      if (this.styles) {
        this.injectStyles();
      }

      // Вызываем пользовательскую инициализацию
      await this.onInit();

      this.isInitialized = true;
      console.log(`Module ${this.name}: Initialized successfully`);
      
      // Уведомляем о готовности модуля
      this.emit('module:ready', { module: this.name });
      
      return true;
    } catch (error) {
      console.error(`Module ${this.name}: Initialization failed:`, error);
      this.emit('module:error', { module: this.name, error });
      return false;
    }
  }

  // Уничтожение модуля
  async destroy() {
    if (!this.isInitialized) {
      console.warn(`Module ${this.name}: Not initialized`);
      return true;
    }

    try {
      console.log(`Module ${this.name}: Destroying...`);
      
      // Вызываем пользовательское уничтожение
      await this.onDestroy();

      // Удаляем стили
      this.removeStyles();

      // Отписываемся от всех событий
      this.removeAllListeners();

      this.isInitialized = false;
      console.log(`Module ${this.name}: Destroyed successfully`);
      
      // Уведомляем об уничтожении модуля
      this.emit('module:destroyed', { module: this.name });
      
      return true;
    } catch (error) {
      console.error(`Module ${this.name}: Destruction failed:`, error);
      this.emit('module:error', { module: this.name, error });
      return false;
    }
  }

  // Включение модуля
  enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.onEnable();
    this.emit('module:enabled', { module: this.name });
    console.log(`Module ${this.name}: Enabled`);
  }

  // Отключение модуля
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.onDisable();
    this.emit('module:disabled', { module: this.name });
    console.log(`Module ${this.name}: Disabled`);
  }

  // Проверка зависимостей
  async checkDependencies() {
    if (!this.dependencies.length) return true;

    for (const dependency of this.dependencies) {
      if (typeof dependency === 'string') {
        // Проверяем глобальные объекты
        if (!window[dependency]) {
          console.error(`Module ${this.name}: Missing dependency: ${dependency}`);
          return false;
        }
      } else if (typeof dependency === 'function') {
        // Выполняем пользовательскую проверку
        if (!await dependency()) {
          console.error(`Module ${this.name}: Dependency check failed`);
          return false;
        }
      }
    }

    return true;
  }

  // Внедрение стилей
  injectStyles() {
    if (!this.styles || this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = this.styles;
    this.styleElement.setAttribute('data-module', this.name);
    document.head.appendChild(this.styleElement);
    
    console.log(`Module ${this.name}: Styles injected`);
  }

  // Удаление стилей
  removeStyles() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
      console.log(`Module ${this.name}: Styles removed`);
    }
  }

  // Установка EventBus
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  // Отправка события
  emit(eventName, data = {}) {
    if (this.eventBus) {
      this.eventBus.emit(eventName, { ...data, source: this.name });
    }
  }

  // Подписка на событие
  on(eventName, callback) {
    if (this.eventBus) {
      this.eventBus.on(eventName, callback);
    }
  }

  // Отписка от события
  off(eventName, callback) {
    if (this.eventBus) {
      this.eventBus.off(eventName, callback);
    }
  }

  // Отписка от всех событий модуля
  removeAllListeners() {
    if (this.eventBus) {
      this.eventBus.removeAllListeners(this.name);
    }
  }

  // Получение конфигурации модуля
  getConfig(key = null) {
    if (key) {
      return this.options[key];
    }
    return this.options;
  }

  // Обновление конфигурации
  updateConfig(newConfig) {
    this.options = { ...this.options, ...newConfig };
    this.onConfigUpdate(newConfig);
  }

  // Получение информации о модуле
  getInfo() {
    return {
      name: this.name,
      isInitialized: this.isInitialized,
      isEnabled: this.isEnabled,
      dependencies: this.dependencies,
      hasStyles: !!this.styles,
      options: this.options
    };
  }

  // Переопределяемые методы для дочерних классов
  
  // Пользовательская инициализация
  async onInit() {
    // Переопределить в дочернем классе
  }

  // Пользовательское уничтожение
  async onDestroy() {
    // Переопределить в дочернем классе
  }

  // Обработка включения
  onEnable() {
    // Переопределить в дочернем классе
  }

  // Обработка отключения
  onDisable() {
    // Переопределить в дочернем классе
  }

  // Обработка обновления конфигурации
  onConfigUpdate(newConfig) {
    // Переопределить в дочернем классе
  }

  // Статические методы

  // Создание модуля из класса
  static create(ModuleClass, name, options = {}) {
    return new ModuleClass(name, options);
  }

  // Проверка является ли объект модулем
  static isModule(obj) {
    return obj instanceof Module;
  }

  // Валидация конфигурации модуля
  static validateConfig(config) {
    const required = ['name'];
    const optional = ['dependencies', 'styles', 'options'];
    
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Module config missing required field: ${field}`);
      }
    }

    return true;
  }
}

export { Module };
