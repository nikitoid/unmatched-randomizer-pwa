// Модуль управления стратегиями кеширования

class CacheStrategyManager {
  constructor() {
    this.currentStrategy = 'cache-first';
    this.networkStatus = navigator.onLine;
    this.init();
  }

  init() {
    this.setupNetworkListener();
    this.setupStrategyControls();
    this.updateNetworkStatus();
    this.loadSavedStrategy();
  }

  // Настройка слушателей сети
  setupNetworkListener() {
    window.addEventListener('online', () => {
      this.networkStatus = true;
      this.updateNetworkStatus();
      this.handleNetworkChange();
    });

    window.addEventListener('offline', () => {
      this.networkStatus = false;
      this.updateNetworkStatus();
      this.handleNetworkChange();
    });
  }

  // Настройка элементов управления стратегией кеширования
  setupStrategyControls() {
    const updateButton = document.getElementById('update-strategy');
    const strategyRadios = document.querySelectorAll('input[name="cache-strategy"]');

    if (updateButton) {
      updateButton.addEventListener('click', () => {
        const selectedStrategy = document.querySelector('input[name="cache-strategy"]:checked');
        if (selectedStrategy) {
          this.updateCacheStrategy(selectedStrategy.value);
        }
      });
    }

    // Автоматическое обновление при выборе стратегии
    strategyRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.updateCacheStrategy(e.target.value);
        }
      });
    });
  }

  // Обновление стратегии кеширования
  async updateCacheStrategy(strategy) {
    if (!['cache-first', 'network-first', 'stale-while-revalidate'].includes(strategy)) {
      console.error('CacheStrategy: Invalid strategy:', strategy);
      return;
    }

    try {
      const success = await this.sendStrategyToServiceWorker(strategy);
      
      if (success) {
        this.currentStrategy = strategy;
        this.saveStrategy(strategy);
        this.showStrategyNotification(strategy);
        console.log('CacheStrategy: Strategy updated to:', strategy);
      } else {
        console.error('CacheStrategy: Failed to update strategy');
        this.showErrorNotification('Не удалось обновить стратегию кеширования');
      }
    } catch (error) {
      console.error('CacheStrategy: Error updating strategy:', error);
      this.showErrorNotification('Ошибка при обновлении стратегии');
    }
  }

  // Отправка стратегии в Service Worker
  async sendStrategyToServiceWorker(strategy) {
    if (!('serviceWorker' in navigator)) {
      console.warn('CacheStrategy: Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration || !registration.active) {
        console.warn('CacheStrategy: No active Service Worker found');
        return false;
      }

      // Создаем MessageChannel для двусторонней связи
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'STRATEGY_UPDATED') {
            resolve(true);
          } else {
            resolve(false);
          }
        };

        // Отправляем сообщение в Service Worker
        registration.active.postMessage({
          type: 'UPDATE_CACHE_STRATEGY',
          strategy: strategy
        }, [messageChannel.port2]);

        // Таймаут для случая, если Service Worker не отвечает
        setTimeout(() => resolve(false), 5000);
      });
    } catch (error) {
      console.error('CacheStrategy: Error communicating with Service Worker:', error);
      return false;
    }
  }

  // Сохранение выбранной стратегии в localStorage
  saveStrategy(strategy) {
    try {
      localStorage.setItem('cache-strategy', strategy);
    } catch (error) {
      console.warn('CacheStrategy: Could not save strategy to localStorage:', error);
    }
  }

  // Загрузка сохраненной стратегии
  loadSavedStrategy() {
    try {
      const savedStrategy = localStorage.getItem('cache-strategy');
      if (savedStrategy && ['cache-first', 'network-first', 'stale-while-revalidate'].includes(savedStrategy)) {
        this.currentStrategy = savedStrategy;
        
        // Обновляем UI
        const radio = document.querySelector(`input[name="cache-strategy"][value="${savedStrategy}"]`);
        if (radio) {
          radio.checked = true;
        }

        // Применяем стратегию
        this.updateCacheStrategy(savedStrategy);
      }
    } catch (error) {
      console.warn('CacheStrategy: Could not load saved strategy:', error);
    }
  }

  // Обновление статуса сети в UI
  updateNetworkStatus() {
    const statusElement = document.getElementById('connection-status');
    const networkStatusElement = document.getElementById('network-status');

    if (statusElement) {
      statusElement.textContent = this.networkStatus ? 'Онлайн' : 'Офлайн';
      statusElement.className = this.networkStatus ? 'text-green-600' : 'text-red-600';
    }

    if (networkStatusElement) {
      networkStatusElement.className = this.networkStatus 
        ? 'mt-4 p-3 rounded-lg bg-green-50 border border-green-200'
        : 'mt-4 p-3 rounded-lg bg-red-50 border border-red-200';
    }

    // Показать/скрыть офлайн индикатор
    this.toggleOfflineIndicator();
  }

  // Переключение офлайн индикатора
  toggleOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    
    if (!this.networkStatus) {
      if (!indicator) {
        indicator = this.createOfflineIndicator();
      }
      indicator.classList.add('show');
    } else {
      if (indicator) {
        indicator.classList.remove('show');
      }
    }
  }

  // Создание офлайн индикатора
  createOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    indicator.textContent = 'Нет подключения к интернету';
    document.body.appendChild(indicator);
    return indicator;
  }

  // Обработка изменения сети
  handleNetworkChange() {
    if (this.networkStatus) {
      console.log('CacheStrategy: Back online');
      this.showNetworkNotification('Подключение восстановлено', 'success');
      
      // Автоматически переключаемся на network-first при восстановлении сети
      if (this.shouldSwitchStrategyOnline()) {
        setTimeout(() => {
          this.suggestStrategyChange('network-first', 'Подключение восстановлено. Переключиться на актуальные данные?');
        }, 2000);
      }
    } else {
      console.log('CacheStrategy: Gone offline');
      this.showNetworkNotification('Потеряно подключение к интернету', 'warning');
      
      // Автоматически переключаемся на cache-first при потере сети
      if (this.shouldSwitchStrategyOffline()) {
        setTimeout(() => {
          this.suggestStrategyChange('cache-first', 'Сеть недоступна. Переключиться на кешированные данные?');
        }, 2000);
      }
    }
  }

  // Проверка необходимости переключения стратегии при подключении
  shouldSwitchStrategyOnline() {
    return this.currentStrategy === 'cache-first' && this.networkStatus;
  }

  // Проверка необходимости переключения стратегии при отключении
  shouldSwitchStrategyOffline() {
    return this.currentStrategy === 'network-first' && !this.networkStatus;
  }

  // Предложение смены стратегии
  suggestStrategyChange(strategy, message) {
    if (confirm(`${message}\n\nТекущая стратегия: ${this.getStrategyDisplayName(this.currentStrategy)}\nПредлагаемая: ${this.getStrategyDisplayName(strategy)}`)) {
      const radio = document.querySelector(`input[name="cache-strategy"][value="${strategy}"]`);
      if (radio) {
        radio.checked = true;
        this.updateCacheStrategy(strategy);
      }
    }
  }

  // Получение отображаемого имени стратегии
  getStrategyDisplayName(strategy) {
    const names = {
      'cache-first': 'Cache First (быстрая загрузка)',
      'network-first': 'Network First (актуальные данные)',
      'stale-while-revalidate': 'Stale While Revalidate (оптимальный)'
    };
    return names[strategy] || strategy;
  }

  // Показать уведомление о смене стратегии
  showStrategyNotification(strategy) {
    const message = `Стратегия кеширования изменена на: ${this.getStrategyDisplayName(strategy)}`;
    this.showNotification(message, 'success');
  }

  // Показать уведомление о сети
  showNetworkNotification(message, type) {
    this.showNotification(message, type);
  }

  // Показать уведомление об ошибке
  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  // Универсальный метод показа уведомлений
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `cache-notification ${type}`;
    notification.textContent = message;
    
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };
    
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 20px',
      backgroundColor: colors[type] || colors.info,
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '1000',
      maxWidth: '320px',
      textAlign: 'center',
      fontSize: '14px',
      opacity: '0',
      transition: 'all 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(-50%) translateY(-10px)';
    }, 100);
    
    // Удаление через 4 секунды
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  // Получение статистики кеша
  async getCacheStats() {
    if (!('caches' in window)) {
      return null;
    }

    try {
      const cacheNames = await caches.keys();
      const stats = {
        totalCaches: cacheNames.length,
        caches: []
      };

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats.caches.push({
          name: cacheName,
          entries: keys.length
        });
      }

      return stats;
    } catch (error) {
      console.error('CacheStrategy: Error getting cache stats:', error);
      return null;
    }
  }

  // Очистка кеша
  async clearCache(cacheName = null) {
    if (!('caches' in window)) {
      return false;
    }

    try {
      if (cacheName) {
        await caches.delete(cacheName);
        console.log(`CacheStrategy: Cleared cache: ${cacheName}`);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('CacheStrategy: Cleared all caches');
      }
      
      this.showNotification('Кеш очищен', 'success');
      return true;
    } catch (error) {
      console.error('CacheStrategy: Error clearing cache:', error);
      this.showNotification('Ошибка при очистке кеша', 'error');
      return false;
    }
  }
}

export { CacheStrategyManager };
