// Загрузчик модулей с автоматической инициализацией

import { Module } from './Module.js';
import { EventBus, eventBus } from './EventBus.js';

class ModuleLoader {
  constructor(options = {}) {
    this.modules = new Map();
    this.loadedModules = new Map();
    this.eventBus = options.eventBus || eventBus;
    this.basePath = options.basePath || './js/modules/';
    this.autoInit = options.autoInit !== false;
    this.loadTimeout = options.loadTimeout || 10000;
    this.retryAttempts = options.retryAttempts || 3;
    
    // Статистика
    this.stats = {
      loaded: 0,
      failed: 0,
      initialized: 0,
      destroyed: 0
    };

    // Биндинг методов
    this.loadModule = this.loadModule.bind(this);
    this.loadModules = this.loadModules.bind(this);
    this.initModule = this.initModule.bind(this);
    this.destroyModule = this.destroyModule.bind(this);

    console.log('ModuleLoader: Created with options:', options);
  }

  // Загрузка одного модуля
  async loadModule(moduleName, moduleConfig = {}) {
    if (this.modules.has(moduleName)) {
      console.warn(`ModuleLoader: Module "${moduleName}" already loaded`);
      return this.modules.get(moduleName);
    }

    const startTime = Date.now();
    let attempts = 0;

    while (attempts < this.retryAttempts) {
      try {
        console.log(`ModuleLoader: Loading module "${moduleName}" (attempt ${attempts + 1})`);
        
        const moduleData = await this.loadModuleFile(moduleName, moduleConfig);
        
        if (!moduleData) {
          throw new Error(`Module "${moduleName}" did not export valid data`);
        }

        // Создаем экземпляр модуля
        const moduleInstance = await this.createModuleInstance(moduleName, moduleData, moduleConfig);
        
        // Регистрируем модуль
        this.registerModule(moduleName, moduleInstance);
        
        const loadTime = Date.now() - startTime;
        console.log(`ModuleLoader: Module "${moduleName}" loaded successfully in ${loadTime}ms`);
        
        this.stats.loaded++;
        this.eventBus.emit('module:loaded', { 
          module: moduleName, 
          instance: moduleInstance,
          loadTime 
        });

        // Автоматическая инициализация
        if (this.autoInit) {
          await this.initModule(moduleName);
        }

        return moduleInstance;

      } catch (error) {
        attempts++;
        console.error(`ModuleLoader: Failed to load module "${moduleName}" (attempt ${attempts}):`, error);
        
        if (attempts >= this.retryAttempts) {
          this.stats.failed++;
          this.eventBus.emit('module:load-failed', { 
            module: moduleName, 
            error, 
            attempts 
          });
          throw error;
        }

        // Задержка перед повторной попыткой
        await this.delay(1000 * attempts);
      }
    }
  }

  // Загрузка файла модуля
  async loadModuleFile(moduleName, moduleConfig) {
    const modulePath = moduleConfig.path || `${this.basePath}${moduleName}.js`;
    
    // Проверяем кеш загруженных модулей
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // Создаем промис с таймаутом
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Module load timeout: ${moduleName}`)), this.loadTimeout);
    });

    const loadPromise = this.dynamicImport(modulePath);
    
    const moduleData = await Promise.race([loadPromise, timeoutPromise]);
    
    // Кешируем загруженный модуль
    this.loadedModules.set(modulePath, moduleData);
    
    return moduleData;
  }

  // Динамический импорт с обработкой ошибок
  async dynamicImport(modulePath) {
    try {
      const module = await import(modulePath);
      return module;
    } catch (error) {
      // Пробуем альтернативные пути
      const alternatives = [
        modulePath.replace('.js', '/index.js'),
        modulePath + '/index.js',
        modulePath.replace(/^\.\//, '')
      ];

      for (const altPath of alternatives) {
        try {
          return await import(altPath);
        } catch (altError) {
          // Игнорируем ошибки альтернативных путей
        }
      }

      throw error;
    }
  }

  // Создание экземпляра модуля
  async createModuleInstance(moduleName, moduleData, moduleConfig) {
    // Проверяем различные способы экспорта модуля
    let ModuleClass = null;
    let moduleInstance = null;

    // 1. Экспорт по умолчанию как класс
    if (moduleData.default && typeof moduleData.default === 'function') {
      ModuleClass = moduleData.default;
    }
    // 2. Именованный экспорт класса
    else if (moduleData[moduleName] && typeof moduleData[moduleName] === 'function') {
      ModuleClass = moduleData[moduleName];
    }
    // 3. Первый найденный класс в экспортах
    else {
      for (const [key, value] of Object.entries(moduleData)) {
        if (typeof value === 'function' && value.prototype) {
          ModuleClass = value;
          break;
        }
      }
    }

    // 4. Объект с методами init/destroy
    if (!ModuleClass && typeof moduleData === 'object' && moduleData.init) {
      moduleInstance = this.wrapLegacyModule(moduleName, moduleData, moduleConfig);
    }
    // 5. Функция-фабрика
    else if (!ModuleClass && typeof moduleData.default === 'function') {
      const result = moduleData.default(moduleConfig);
      if (result && typeof result === 'object') {
        moduleInstance = this.wrapLegacyModule(moduleName, result, moduleConfig);
      }
    }

    // Создаем экземпляр из класса
    if (ModuleClass && !moduleInstance) {
      try {
        // Проверяем наследование от базового класса Module
        if (ModuleClass.prototype instanceof Module) {
          moduleInstance = new ModuleClass(moduleName, moduleConfig);
        } else {
          // Пробуем создать экземпляр с разными вариантами параметров
          try {
            moduleInstance = new ModuleClass(moduleName, moduleConfig);
          } catch (e) {
            // Если не получается, пробуем только с конфигом
            moduleInstance = new ModuleClass(moduleConfig);
          }
          // Если это не модуль, оборачиваем в адаптер
          if (!moduleInstance.init) {
            moduleInstance = this.wrapLegacyModule(moduleName, moduleInstance, moduleConfig);
          }
        }
      } catch (error) {
        console.error(`ModuleLoader: Error creating instance for "${moduleName}":`, error);
        throw error;
      }
    }

    if (!moduleInstance) {
      throw new Error(`Cannot create instance for module "${moduleName}"`);
    }

    // Устанавливаем EventBus
    if (moduleInstance.setEventBus) {
      moduleInstance.setEventBus(this.eventBus);
    }

    return moduleInstance;
  }

  // Обертка для legacy модулей
  wrapLegacyModule(moduleName, legacyModule, moduleConfig) {
    return new (class extends Module {
      constructor(name, config) {
        super(name, config);
        this.legacyModule = legacyModule;
        this.styles = legacyModule.styles || config.styles || '';
      }

      async onInit() {
        if (this.legacyModule.init) {
          return await this.legacyModule.init();
        }
      }

      async onDestroy() {
        if (this.legacyModule.destroy) {
          return await this.legacyModule.destroy();
        }
      }

      onEnable() {
        if (this.legacyModule.enable) {
          this.legacyModule.enable();
        }
      }

      onDisable() {
        if (this.legacyModule.disable) {
          this.legacyModule.disable();
        }
      }
    })(moduleName, moduleConfig);
  }

  // Регистрация модуля
  registerModule(moduleName, moduleInstance) {
    this.modules.set(moduleName, moduleInstance);
    console.log(`ModuleLoader: Module "${moduleName}" registered`);
  }

  // Загрузка нескольких модулей
  async loadModules(moduleConfigs) {
    const results = [];
    const errors = [];

    // Загружаем модули параллельно
    const loadPromises = moduleConfigs.map(async (config) => {
      try {
        const moduleName = typeof config === 'string' ? config : config.name;
        const moduleConfig = typeof config === 'string' ? {} : config;
        
        const instance = await this.loadModule(moduleName, moduleConfig);
        results.push({ name: moduleName, instance, success: true });
      } catch (error) {
        errors.push({ name: moduleName, error });
        results.push({ name: moduleName, error, success: false });
      }
    });

    await Promise.allSettled(loadPromises);

    if (errors.length > 0) {
      console.warn(`ModuleLoader: ${errors.length} modules failed to load:`, errors);
    }

    console.log(`ModuleLoader: Loaded ${results.filter(r => r.success).length}/${moduleConfigs.length} modules`);
    
    this.eventBus.emit('modules:loaded', { results, errors });
    
    return results;
  }

  // Автоматическое обнаружение и загрузка модулей
  async autoLoadModules() {
    try {
      console.log('ModuleLoader: Starting auto-discovery...');
      
      // Список известных модулей (можно расширить)
      const knownModules = [
        'pwa',
        'cache-strategy',
        // Добавьте другие модули по мере необходимости
      ];

      const moduleConfigs = knownModules.map(name => ({ name }));
      
      return await this.loadModules(moduleConfigs);
    } catch (error) {
      console.error('ModuleLoader: Auto-load failed:', error);
      return [];
    }
  }

  // Инициализация модуля
  async initModule(moduleName) {
    const moduleInstance = this.modules.get(moduleName);
    
    if (!moduleInstance) {
      throw new Error(`Module "${moduleName}" not found`);
    }

    if (moduleInstance.isInitialized) {
      console.warn(`ModuleLoader: Module "${moduleName}" already initialized`);
      return true;
    }

    try {
      const success = await moduleInstance.init();
      
      if (success) {
        this.stats.initialized++;
        this.eventBus.emit('module:initialized', { module: moduleName, instance: moduleInstance });
      }
      
      return success;
    } catch (error) {
      console.error(`ModuleLoader: Failed to initialize module "${moduleName}":`, error);
      this.eventBus.emit('module:init-failed', { module: moduleName, error });
      throw error;
    }
  }

  // Инициализация всех загруженных модулей
  async initAllModules() {
    const results = [];
    
    for (const [moduleName, moduleInstance] of this.modules.entries()) {
      try {
        if (!moduleInstance.isInitialized) {
          await this.initModule(moduleName);
          results.push({ name: moduleName, success: true });
        }
      } catch (error) {
        results.push({ name: moduleName, success: false, error });
      }
    }

    console.log(`ModuleLoader: Initialized ${results.filter(r => r.success).length}/${results.length} modules`);
    return results;
  }

  // Уничтожение модуля
  async destroyModule(moduleName) {
    const moduleInstance = this.modules.get(moduleName);
    
    if (!moduleInstance) {
      throw new Error(`Module "${moduleName}" not found`);
    }

    try {
      const success = await moduleInstance.destroy();
      
      if (success) {
        this.modules.delete(moduleName);
        this.stats.destroyed++;
        this.eventBus.emit('module:destroyed', { module: moduleName });
      }
      
      return success;
    } catch (error) {
      console.error(`ModuleLoader: Failed to destroy module "${moduleName}":`, error);
      this.eventBus.emit('module:destroy-failed', { module: moduleName, error });
      throw error;
    }
  }

  // Перезагрузка модуля
  async reloadModule(moduleName) {
    console.log(`ModuleLoader: Reloading module "${moduleName}"`);
    
    const moduleInstance = this.modules.get(moduleName);
    let moduleConfig = {};
    
    if (moduleInstance) {
      moduleConfig = moduleInstance.getConfig();
      await this.destroyModule(moduleName);
    }

    // Очищаем кеш загруженного модуля
    for (const [path, data] of this.loadedModules.entries()) {
      if (path.includes(moduleName)) {
        this.loadedModules.delete(path);
      }
    }

    return await this.loadModule(moduleName, moduleConfig);
  }

  // Получение модуля
  getModule(moduleName) {
    return this.modules.get(moduleName);
  }

  // Проверка существования модуля
  hasModule(moduleName) {
    return this.modules.has(moduleName);
  }

  // Получение списка загруженных модулей
  getLoadedModules() {
    return Array.from(this.modules.keys());
  }

  // Получение информации о модулях
  getModulesInfo() {
    const info = {};
    
    for (const [name, instance] of this.modules.entries()) {
      info[name] = instance.getInfo ? instance.getInfo() : {
        name,
        isInitialized: instance.isInitialized || false,
        isEnabled: instance.isEnabled !== false
      };
    }
    
    return info;
  }

  // Получение статистики
  getStats() {
    return {
      ...this.stats,
      total: this.modules.size,
      cached: this.loadedModules.size
    };
  }

  // Очистка кеша модулей
  clearCache() {
    this.loadedModules.clear();
    console.log('ModuleLoader: Module cache cleared');
  }

  // Уничтожение всех модулей
  async destroyAll() {
    const results = [];
    
    for (const moduleName of this.modules.keys()) {
      try {
        await this.destroyModule(moduleName);
        results.push({ name: moduleName, success: true });
      } catch (error) {
        results.push({ name: moduleName, success: false, error });
      }
    }

    console.log(`ModuleLoader: Destroyed ${results.filter(r => r.success).length}/${results.length} modules`);
    return results;
  }

  // Утилитарные методы

  // Задержка
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Отладочная информация
  debug() {
    console.group('ModuleLoader Debug Info');
    console.log('Loaded modules:', this.getLoadedModules());
    console.log('Modules info:', this.getModulesInfo());
    console.log('Stats:', this.getStats());
    console.log('Cache size:', this.loadedModules.size);
    console.groupEnd();
  }
}

export { ModuleLoader };
