// Система событий для коммуникации между модулями

class EventBus {
  constructor() {
    this.events = new Map();
    this.moduleListeners = new Map();
    this.history = [];
    this.maxHistorySize = 100;
    
    // Биндинг методов
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.once = this.once.bind(this);
  }

  // Подписка на событие
  on(eventName, callback, context = null) {
    if (typeof eventName !== 'string' || typeof callback !== 'function') {
      throw new Error('EventBus: Invalid parameters for on()');
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listener = {
      callback,
      context,
      once: false,
      id: this.generateListenerId()
    };

    this.events.get(eventName).push(listener);

    // Отслеживаем слушателей по модулям
    if (context) {
      this.trackModuleListener(context, eventName, listener);
    }

    console.log(`EventBus: Subscribed to "${eventName}" ${context ? `(module: ${context})` : ''}`);
    
    return {
      eventName,
      listenerId: listener.id,
      off: () => this.off(eventName, callback, context)
    };
  }

  // Одноразовая подписка на событие
  once(eventName, callback, context = null) {
    const listener = this.on(eventName, (...args) => {
      listener.off();
      callback.apply(context, args);
    }, context);
    
    // Помечаем как одноразовый
    const listeners = this.events.get(eventName);
    if (listeners) {
      const lastListener = listeners[listeners.length - 1];
      lastListener.once = true;
    }

    return listener;
  }

  // Отписка от события
  off(eventName, callback = null, context = null) {
    if (!this.events.has(eventName)) {
      return false;
    }

    const listeners = this.events.get(eventName);
    
    if (!callback) {
      // Удаляем все слушатели события
      if (context) {
        // Удаляем только слушатели конкретного модуля
        const filtered = listeners.filter(listener => listener.context !== context);
        this.events.set(eventName, filtered);
        this.removeModuleListeners(context, eventName);
      } else {
        // Удаляем все слушатели
        this.events.delete(eventName);
      }
      
      console.log(`EventBus: Unsubscribed from "${eventName}" ${context ? `(module: ${context})` : '(all)'}`);
      return true;
    }

    // Удаляем конкретный слушатель
    const index = listeners.findIndex(listener => 
      listener.callback === callback && 
      (context === null || listener.context === context)
    );

    if (index !== -1) {
      const removedListener = listeners.splice(index, 1)[0];
      
      if (context) {
        this.removeModuleListener(context, eventName, removedListener);
      }

      // Удаляем событие если слушателей не осталось
      if (listeners.length === 0) {
        this.events.delete(eventName);
      }

      console.log(`EventBus: Unsubscribed from "${eventName}" ${context ? `(module: ${context})` : ''}`);
      return true;
    }

    return false;
  }

  // Отправка события
  emit(eventName, data = {}) {
    const timestamp = Date.now();
    const eventData = {
      name: eventName,
      data,
      timestamp,
      id: this.generateEventId()
    };

    // Добавляем в историю
    this.addToHistory(eventData);

    // Синхронная обработка
    this.processEventSync(eventData);

    // Асинхронная обработка (для тяжелых операций)
    setTimeout(() => this.processEventAsync(eventData), 0);

    console.log(`EventBus: Emitted "${eventName}"`, data);
    
    return eventData;
  }

  // Синхронная обработка события
  processEventSync(eventData) {
    const { name, data } = eventData;
    
    if (!this.events.has(name)) {
      return;
    }

    const listeners = [...this.events.get(name)]; // Копия для безопасной итерации
    
    listeners.forEach(listener => {
      try {
        if (listener.context) {
          listener.callback.call(listener.context, data, eventData);
        } else {
          listener.callback(data, eventData);
        }
      } catch (error) {
        console.error(`EventBus: Error in listener for "${name}":`, error);
        this.emit('eventbus:error', { 
          eventName: name, 
          error, 
          listener: listener.context || 'anonymous' 
        });
      }
    });
  }

  // Асинхронная обработка события
  async processEventAsync(eventData) {
    const { name } = eventData;
    const asyncEventName = `${name}:async`;
    
    if (this.events.has(asyncEventName)) {
      this.processEventSync({ ...eventData, name: asyncEventName });
    }
  }

  // Удаление всех слушателей модуля
  removeAllListeners(moduleName = null) {
    if (!moduleName) {
      // Очищаем все события
      this.events.clear();
      this.moduleListeners.clear();
      console.log('EventBus: Removed all listeners');
      return;
    }

    // Удаляем слушатели конкретного модуля
    for (const [eventName, listeners] of this.events.entries()) {
      const filtered = listeners.filter(listener => listener.context !== moduleName);
      
      if (filtered.length === 0) {
        this.events.delete(eventName);
      } else {
        this.events.set(eventName, filtered);
      }
    }

    this.moduleListeners.delete(moduleName);
    console.log(`EventBus: Removed all listeners for module "${moduleName}"`);
  }

  // Получение списка событий
  getEvents() {
    return Array.from(this.events.keys());
  }

  // Получение слушателей события
  getListeners(eventName) {
    return this.events.get(eventName) || [];
  }

  // Проверка наличия слушателей
  hasListeners(eventName) {
    return this.events.has(eventName) && this.events.get(eventName).length > 0;
  }

  // Получение количества слушателей
  getListenerCount(eventName = null) {
    if (eventName) {
      return this.getListeners(eventName).length;
    }

    let total = 0;
    for (const listeners of this.events.values()) {
      total += listeners.length;
    }
    return total;
  }

  // Получение истории событий
  getHistory(eventName = null, limit = 10) {
    let history = this.history;
    
    if (eventName) {
      history = history.filter(event => event.name === eventName);
    }
    
    return history.slice(-limit);
  }

  // Очистка истории
  clearHistory() {
    this.history = [];
    console.log('EventBus: History cleared');
  }

  // Получение статистики
  getStats() {
    const stats = {
      totalEvents: this.events.size,
      totalListeners: this.getListenerCount(),
      historySize: this.history.length,
      modules: this.moduleListeners.size,
      events: {}
    };

    for (const [eventName, listeners] of this.events.entries()) {
      stats.events[eventName] = {
        listeners: listeners.length,
        modules: [...new Set(listeners.map(l => l.context).filter(Boolean))]
      };
    }

    return stats;
  }

  // Отладочная информация
  debug() {
    console.group('EventBus Debug Info');
    console.log('Events:', Array.from(this.events.keys()));
    console.log('Stats:', this.getStats());
    console.log('Recent History:', this.getHistory(null, 5));
    console.groupEnd();
  }

  // Приватные методы

  // Отслеживание слушателей модуля
  trackModuleListener(moduleName, eventName, listener) {
    if (!this.moduleListeners.has(moduleName)) {
      this.moduleListeners.set(moduleName, new Map());
    }

    const moduleEvents = this.moduleListeners.get(moduleName);
    if (!moduleEvents.has(eventName)) {
      moduleEvents.set(eventName, []);
    }

    moduleEvents.get(eventName).push(listener);
  }

  // Удаление слушателя модуля
  removeModuleListener(moduleName, eventName, listener) {
    if (!this.moduleListeners.has(moduleName)) return;

    const moduleEvents = this.moduleListeners.get(moduleName);
    if (!moduleEvents.has(eventName)) return;

    const listeners = moduleEvents.get(eventName);
    const index = listeners.indexOf(listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      
      if (listeners.length === 0) {
        moduleEvents.delete(eventName);
      }
    }

    if (moduleEvents.size === 0) {
      this.moduleListeners.delete(moduleName);
    }
  }

  // Удаление всех слушателей модуля для события
  removeModuleListeners(moduleName, eventName) {
    if (!this.moduleListeners.has(moduleName)) return;

    const moduleEvents = this.moduleListeners.get(moduleName);
    moduleEvents.delete(eventName);

    if (moduleEvents.size === 0) {
      this.moduleListeners.delete(moduleName);
    }
  }

  // Добавление в историю
  addToHistory(eventData) {
    this.history.push(eventData);
    
    // Ограничиваем размер истории
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // Генерация ID слушателя
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Генерация ID события
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Создание пространства имен для событий
  namespace(prefix) {
    return {
      emit: (eventName, data) => this.emit(`${prefix}:${eventName}`, data),
      on: (eventName, callback, context) => this.on(`${prefix}:${eventName}`, callback, context),
      off: (eventName, callback, context) => this.off(`${prefix}:${eventName}`, callback, context),
      once: (eventName, callback, context) => this.once(`${prefix}:${eventName}`, callback, context)
    };
  }
}

// Создаем глобальный экземпляр
const eventBus = new EventBus();

// Добавляем базовые события системы
eventBus.on('eventbus:error', (data) => {
  console.error('EventBus: System error:', data);
});

export { EventBus, eventBus };
