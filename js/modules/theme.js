/**
 * Модуль управления темами
 * Обеспечивает переключение между светлой и темной темой
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    /**
     * Инициализация менеджера тем
     */
    init() {
        this.applyTheme(this.currentTheme);
        this.updateThemeIcon();
        console.log(`🎨 Theme initialized: ${this.currentTheme}`);
    }

    /**
     * Получить сохраненную тему из localStorage
     */
    getStoredTheme() {
        try {
            return localStorage.getItem('randomatched-theme');
        } catch (error) {
            console.warn('Could not access localStorage for theme:', error);
            return null;
        }
    }

    /**
     * Получить системную тему
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Сохранить тему в localStorage
     */
    setStoredTheme(theme) {
        try {
            localStorage.setItem('randomatched-theme', theme);
        } catch (error) {
            console.warn('Could not save theme to localStorage:', error);
        }
    }

    /**
     * Применить тему к документу
     */
    applyTheme(theme) {
        const html = document.documentElement;
        
        // Удаляем предыдущие классы тем
        html.classList.remove('light', 'dark');
        
        // Добавляем новый класс темы
        html.classList.add(theme);
        
        // Обновляем meta theme-color
        this.updateMetaThemeColor(theme);
        
        // Сохраняем тему
        this.setStoredTheme(theme);
        this.currentTheme = theme;
        
        // Обновляем иконку
        this.updateThemeIcon();
        
        // Отправляем событие о смене темы
        this.dispatchThemeChangeEvent(theme);
    }

    /**
     * Обновить meta theme-color
     */
    updateMetaThemeColor(theme) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#1f2937' : '#ffffff';
        }
    }

    /**
     * Обновить иконку темы
     */
    updateThemeIcon() {
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        
        if (sunIcon && moonIcon) {
            if (this.currentTheme === 'dark') {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        }
    }

    /**
     * Переключить тему
     */
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Анимация переключения
        this.animateThemeTransition();
        
        console.log(`🎨 Theme toggled to: ${newTheme}`);
    }

    /**
     * Установить конкретную тему
     */
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        } else {
            console.warn('Invalid theme:', theme);
        }
    }

    /**
     * Получить текущую тему
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Анимация переключения темы
     */
    animateThemeTransition() {
        const body = document.body;
        
        // Добавляем класс для анимации
        body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        // Убираем класс через время анимации
        setTimeout(() => {
            body.style.transition = '';
        }, 300);
    }

    /**
     * Отправить событие о смене темы
     */
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themechange', {
            detail: { theme }
        });
        document.dispatchEvent(event);
    }

    /**
     * Слушать изменения системной темы
     */
    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                // Применяем системную тему только если пользователь не выбрал свою
                const storedTheme = this.getStoredTheme();
                if (!storedTheme) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(systemTheme);
                }
            });
        }
    }

    /**
     * Сбросить тему к системной
     */
    resetToSystemTheme() {
        try {
            localStorage.removeItem('randomatched-theme');
            const systemTheme = this.getSystemTheme();
            this.applyTheme(systemTheme);
        } catch (error) {
            console.warn('Could not reset theme:', error);
        }
    }

    /**
     * Получить информацию о теме
     */
    getThemeInfo() {
        return {
            current: this.currentTheme,
            stored: this.getStoredTheme(),
            system: this.getSystemTheme(),
            isSystemTheme: !this.getStoredTheme()
        };
    }
}
