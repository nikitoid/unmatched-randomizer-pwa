/**
 * Randomatched - Unmatched Randomizer PWA
 * Главный файл приложения с модульной архитектурой
 */

// Импорт модулей
import { ThemeManager } from './modules/theme.js';
import { Generator } from './modules/generator.js';
import { Results } from './modules/results.js';
import { Toast } from './modules/toast.js';
import { Storage } from './modules/storage.js';
import { Modal } from './modules/modal.js';

class RandomatchedApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.init();
    }

    /**
     * Инициализация приложения
     */
    async init() {
        try {
            console.log('🎲 Initializing Randomatched...');
            
            // Инициализация модулей
            await this.initializeModules();
            
            // Настройка обработчиков событий
            this.setupEventListeners();
            
            // Регистрация Service Worker
            await this.registerServiceWorker();
            
            // Загрузка сохраненных данных
            await this.loadSavedData();
            
            // Инициализация завершена
            this.isInitialized = true;
            console.log('✅ Randomatched initialized successfully');
            
            // Показать уведомление о готовности
            this.modules.toast.show('Приложение готово к работе!', 'success');
            
        } catch (error) {
            console.error('❌ Error initializing Randomatched:', error);
            this.modules.toast.show('Ошибка инициализации приложения', 'error');
        }
    }

    /**
     * Инициализация всех модулей
     */
    async initializeModules() {
        // Менеджер тем
        this.modules.theme = new ThemeManager();
        
        // Менеджер уведомлений
        this.modules.toast = new Toast();
        
        // Менеджер хранилища
        this.modules.storage = new Storage();
        
        // Менеджер модальных окон
        this.modules.modal = new Modal();
        
        // Генератор героев
        this.modules.generator = new Generator({
            storage: this.modules.storage,
            toast: this.modules.toast
        });
        
        // Менеджер результатов
        this.modules.results = new Results({
            storage: this.modules.storage,
            toast: this.modules.toast,
            modal: this.modules.modal
        });
        
        console.log('📦 All modules initialized');
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Кнопка генерации
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.handleGenerate());
        }

        // Переключатель темы
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.modules.theme.toggle());
        }

        // Настройки генерации
        const heroCountSelect = document.getElementById('hero-count');
        const gameModeSelect = document.getElementById('game-mode');
        
        if (heroCountSelect) {
            heroCountSelect.addEventListener('change', (e) => {
                this.modules.storage.set('heroCount', e.target.value);
            });
        }
        
        if (gameModeSelect) {
            gameModeSelect.addEventListener('change', (e) => {
                this.modules.storage.set('gameMode', e.target.value);
            });
        }

        // Обработка быстрых действий из URL
        this.handleURLActions();

        // Обработка клавиатурных сокращений
        this.setupKeyboardShortcuts();

        // Обработка изменения размера окна
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Обработка онлайн/оффлайн статуса
        window.addEventListener('online', () => {
            this.modules.toast.show('Соединение восстановлено', 'success');
        });

        window.addEventListener('offline', () => {
            this.modules.toast.show('Работа в оффлайн режиме', 'warning');
        });

        console.log('🎯 Event listeners setup complete');
    }

    /**
     * Обработка генерации команды
     */
    async handleGenerate() {
        if (!this.isInitialized) {
            this.modules.toast.show('Приложение еще загружается...', 'warning');
            return;
        }

        try {
            // Показать индикатор загрузки
            this.showLoading(true);

            // Получить настройки
            const heroCount = parseInt(this.modules.storage.get('heroCount', '2'));
            const gameMode = this.modules.storage.get('gameMode', 'all');

            // Сгенерировать команду
            const team = await this.modules.generator.generateTeam(heroCount, gameMode);

            // Показать результаты
            this.modules.results.displayTeam(team);

            // Сохранить в историю
            this.modules.storage.addToHistory(team);

            // Показать уведомление
            this.modules.toast.show(`Сгенерирована команда из ${heroCount} героев!`, 'success');

        } catch (error) {
            console.error('Error generating team:', error);
            this.modules.toast.show('Ошибка при генерации команды', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Обработка быстрых действий из URL
     */
    handleURLActions() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');

        if (action === 'generate') {
            // Автоматическая генерация при загрузке
            setTimeout(() => {
                this.handleGenerate();
            }, 1000);
        }

        const hero = urlParams.get('hero');
        if (hero) {
            // Генерация с конкретным героем
            this.modules.generator.setFixedHero(hero);
        }
    }

    /**
     * Настройка клавиатурных сокращений
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter - генерация
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.handleGenerate();
            }

            // Ctrl/Cmd + T - переключение темы
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.modules.theme.toggle();
            }

            // Escape - закрытие модальных окон
            if (e.key === 'Escape') {
                this.modules.modal.close();
            }
        });
    }

    /**
     * Обработка изменения размера окна
     */
    handleResize() {
        // Обновление результатов при изменении размера
        if (this.modules.results && this.modules.results.currentTeam) {
            this.modules.results.updateLayout();
        }
    }

    /**
     * Показать/скрыть индикатор загрузки
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }

    /**
     * Загрузка сохраненных данных
     */
    async loadSavedData() {
        try {
            // Восстановление настроек
            const heroCount = this.modules.storage.get('heroCount', '2');
            const gameMode = this.modules.storage.get('gameMode', 'all');

            const heroCountSelect = document.getElementById('hero-count');
            const gameModeSelect = document.getElementById('game-mode');

            if (heroCountSelect) heroCountSelect.value = heroCount;
            if (gameModeSelect) gameModeSelect.value = gameMode;

            console.log('💾 Saved data loaded');
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    /**
     * Регистрация Service Worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('🔧 Service Worker registered:', registration);

                // Обработка обновлений
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.modules.toast.show('Доступно обновление приложения', 'info', {
                                action: 'Обновить',
                                callback: () => {
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    window.location.reload();
                                }
                            });
                        }
                    });
                });

            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Утилита для debounce
     */
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

    /**
     * Получить информацию о приложении
     */
    getAppInfo() {
        return {
            name: 'Randomatched',
            version: '1.0.0',
            initialized: this.isInitialized,
            modules: Object.keys(this.modules)
        };
    }
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.randomatchedApp = new RandomatchedApp();
});

// Экспорт для использования в других модулях
export { RandomatchedApp };
