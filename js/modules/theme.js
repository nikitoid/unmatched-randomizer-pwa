// Пример модуля управления темами с демонстрацией взаимодействия между модулями

import { Module } from './Module.js';

class ThemeModule extends Module {
  constructor(name, options = {}) {
    const defaultOptions = {
      themes: ['light', 'dark', 'auto'],
      defaultTheme: 'auto',
      storageKey: 'app-theme',
      autoDetect: true,
      ...options
    };

    // Кастомные стили для переключателя тем
    const styles = `
      /* Стили для переключателя тем */
      .theme-switcher {
        position: relative;
        display: inline-block;
      }

      .theme-toggle-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 50px;
        color: white;
        padding: 8px 16px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 120px;
        justify-content: center;
      }

      .theme-toggle-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .theme-toggle-btn:active {
        transform: translateY(0);
      }

      .theme-icon {
        font-size: 16px;
        transition: transform 0.3s ease;
      }

      .theme-toggle-btn:hover .theme-icon {
        transform: rotate(360deg);
      }

      /* Темы */
      body.theme-light {
        --bg-primary: #ffffff;
        --bg-secondary: #f8fafc;
        --text-primary: #1a202c;
        --text-secondary: #4a5568;
        --border-color: #e2e8f0;
        --shadow: rgba(0, 0, 0, 0.1);
      }

      body.theme-dark {
        --bg-primary: #1a202c;
        --bg-secondary: #2d3748;
        --text-primary: #f7fafc;
        --text-secondary: #e2e8f0;
        --border-color: #4a5568;
        --shadow: rgba(0, 0, 0, 0.3);
      }

      body.theme-auto {
        /* Автоматически определяется через CSS media queries */
      }

      /* Анимация смены темы */
      body.theme-transitioning * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
      }

      /* Медиа-запросы для автоматической темы */
      @media (prefers-color-scheme: dark) {
        body.theme-auto {
          --bg-primary: #1a202c;
          --bg-secondary: #2d3748;
          --text-primary: #f7fafc;
          --text-secondary: #e2e8f0;
          --border-color: #4a5568;
          --shadow: rgba(0, 0, 0, 0.3);
        }
      }

      @media (prefers-color-scheme: light) {
        body.theme-auto {
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --text-primary: #1a202c;
          --text-secondary: #4a5568;
          --border-color: #e2e8f0;
          --shadow: rgba(0, 0, 0, 0.1);
        }
      }

      /* Применение CSS переменных к элементам */
      .theme-aware {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        border-color: var(--border-color);
      }

      .theme-aware-secondary {
        background-color: var(--bg-secondary);
        color: var(--text-secondary);
      }
    `;

    super(name, { ...defaultOptions, styles });

    this.currentTheme = this.options.defaultTheme;
    this.toggleButton = null;
    this.mediaQuery = null;
  }

  // Инициализация модуля
  async onInit() {
    // Загружаем сохраненную тему
    this.loadSavedTheme();
    
    // Применяем тему
    this.applyTheme(this.currentTheme);
    
    // Создаем переключатель
    this.createThemeToggle();
    
    // Настраиваем обработчики
    this.setupEventListeners();
    
    console.log(`ThemeModule: Initialized with theme "${this.currentTheme}"`);

    // Подписываемся на события других модулей
    this.on('notification:created', (data) => {
      // Добавляем к уведомлениям класс для темы
      setTimeout(() => {
        const notification = document.querySelector(`[data-notification-id="${data.id}"]`);
        if (notification) {
          notification.classList.add('theme-aware');
        }
      }, 100);
    });

    // Уведомляем о готовности
    this.emit('theme:ready', { 
      currentTheme: this.currentTheme,
      availableThemes: this.options.themes 
    });

    // Показываем уведомление через модуль уведомлений
    setTimeout(() => {
      this.emit('theme:show-notification', {
        title: 'Модуль тем готов',
        message: `Текущая тема: ${this.currentTheme}`,
        type: 'info'
      });
    }, 1500);
  }

  // Уничтожение модуля
  async onDestroy() {
    this.removeThemeToggle();
    this.removeEventListeners();
    
    console.log('ThemeModule: Destroyed');
  }

  // Загрузка сохраненной темы
  loadSavedTheme() {
    try {
      const savedTheme = localStorage.getItem(this.options.storageKey);
      if (savedTheme && this.options.themes.includes(savedTheme)) {
        this.currentTheme = savedTheme;
      }
    } catch (error) {
      console.warn('ThemeModule: Could not load saved theme:', error);
    }
  }

  // Сохранение темы
  saveTheme(theme) {
    try {
      localStorage.setItem(this.options.storageKey, theme);
    } catch (error) {
      console.warn('ThemeModule: Could not save theme:', error);
    }
  }

  // Применение темы
  applyTheme(theme) {
    if (!this.options.themes.includes(theme)) {
      console.warn(`ThemeModule: Unknown theme "${theme}"`);
      return;
    }

    // Добавляем класс для анимации
    document.body.classList.add('theme-transitioning');

    // Удаляем старые классы тем
    this.options.themes.forEach(t => {
      document.body.classList.remove(`theme-${t}`);
    });

    // Добавляем новый класс темы
    document.body.classList.add(`theme-${theme}`);

    // Убираем класс анимации через некоторое время
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);

    this.currentTheme = theme;
    this.saveTheme(theme);
    this.updateToggleButton();

    // Уведомляем о смене темы
    this.emit('theme:changed', { 
      theme,
      previousTheme: this.currentTheme 
    });

    console.log(`ThemeModule: Applied theme "${theme}"`);
  }

  // Переключение темы
  toggleTheme() {
    const currentIndex = this.options.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.options.themes.length;
    const nextTheme = this.options.themes[nextIndex];
    
    this.applyTheme(nextTheme);

    // Показываем уведомление о смене темы
    this.emit('theme:show-notification', {
      title: 'Тема изменена',
      message: `Переключено на: ${this.getThemeDisplayName(nextTheme)}`,
      type: 'success'
    });
  }

  // Создание переключателя темы
  createThemeToggle() {
    // Ищем контейнер для кнопки
    let container = document.querySelector('.theme-switcher-container');
    
    if (!container) {
      // Создаем контейнер если его нет
      container = document.createElement('div');
      container.className = 'theme-switcher-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
      `;
      document.body.appendChild(container);
    }

    // Создаем кнопку
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'theme-toggle-btn';
    this.toggleButton.innerHTML = `
      <span class="theme-icon">${this.getThemeIcon(this.currentTheme)}</span>
      <span class="theme-text">${this.getThemeDisplayName(this.currentTheme)}</span>
    `;
    
    this.toggleButton.addEventListener('click', () => this.toggleTheme());
    
    container.appendChild(this.toggleButton);
  }

  // Удаление переключателя
  removeThemeToggle() {
    if (this.toggleButton) {
      this.toggleButton.remove();
      this.toggleButton = null;
    }
  }

  // Обновление кнопки переключателя
  updateToggleButton() {
    if (this.toggleButton) {
      this.toggleButton.innerHTML = `
        <span class="theme-icon">${this.getThemeIcon(this.currentTheme)}</span>
        <span class="theme-text">${this.getThemeDisplayName(this.currentTheme)}</span>
      `;
    }
  }

  // Настройка обработчиков событий
  setupEventListeners() {
    // Обработчик системных событий смены темы
    if (this.options.autoDetect && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addListener(() => {
        if (this.currentTheme === 'auto') {
          this.emit('theme:system-changed', {
            isDark: this.mediaQuery.matches
          });
        }
      });
    }

    // Обработчик показа уведомлений через EventBus
    this.on('theme:show-notification', (data) => {
      // Пересылаем событие модулю уведомлений
      this.emit('notification:show', data);
    });
  }

  // Удаление обработчиков
  removeEventListeners() {
    if (this.mediaQuery) {
      this.mediaQuery.removeListener();
      this.mediaQuery = null;
    }
  }

  // Получение иконки темы
  getThemeIcon(theme) {
    const icons = {
      light: '☀️',
      dark: '🌙',
      auto: '🔄'
    };
    return icons[theme] || '❓';
  }

  // Получение отображаемого имени темы
  getThemeDisplayName(theme) {
    const names = {
      light: 'Светлая',
      dark: 'Темная',
      auto: 'Авто'
    };
    return names[theme] || theme;
  }

  // Получение текущей темы
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Установка темы
  setTheme(theme) {
    if (this.options.themes.includes(theme)) {
      this.applyTheme(theme);
      return true;
    }
    return false;
  }

  // Проверка темной темы
  isDarkTheme() {
    if (this.currentTheme === 'dark') return true;
    if (this.currentTheme === 'light') return false;
    if (this.currentTheme === 'auto' && this.mediaQuery) {
      return this.mediaQuery.matches;
    }
    return false;
  }

  // Получение информации о модуле
  getInfo() {
    return {
      ...super.getInfo(),
      currentTheme: this.currentTheme,
      availableThemes: this.options.themes,
      isDarkTheme: this.isDarkTheme(),
      autoDetect: this.options.autoDetect
    };
  }
}

// Экспорт модуля
export default ThemeModule;
