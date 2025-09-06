/**
 * Модуль уведомлений (Toast)
 * Обеспечивает показ всплывающих уведомлений
 */

export class Toast {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.init();
    }

    /**
     * Инициализация модуля уведомлений
     */
    init() {
        this.createContainer();
        console.log('🔔 Toast module initialized');
    }

    /**
     * Создать контейнер для уведомлений
     */
    createContainer() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Показать уведомление
     */
    show(message, type = 'info', options = {}) {
        const toastId = this.generateToastId();
        const toast = this.createToast(toastId, message, type, options);
        
        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);

        // Анимация появления
        requestAnimationFrame(() => {
            toast.classList.add('animate-slide-in');
        });

        // Автоматическое скрытие
        if (options.duration !== 0) {
            const duration = options.duration || this.getDefaultDuration(type);
            setTimeout(() => {
                this.hide(toastId);
            }, duration);
        }

        return toastId;
    }

    /**
     * Создать элемент уведомления
     */
    createToast(id, message, type, options) {
        const toast = document.createElement('div');
        toast.id = `toast-${id}`;
        toast.className = `toast ${type} max-w-sm w-full`;
        
        const icon = this.getIcon(type);
        const actionButton = options.action ? this.createActionButton(options) : '';

        toast.innerHTML = `
            <div class="flex items-start p-4">
                <div class="flex-shrink-0">
                    ${icon}
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                        ${message}
                    </p>
                    ${actionButton}
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button 
                        class="toast-close-btn inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                        aria-label="Закрыть уведомление"
                    >
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Добавляем обработчик закрытия
        const closeBtn = toast.querySelector('.toast-close-btn');
        closeBtn.addEventListener('click', () => {
            this.hide(id);
        });

        return toast;
    }

    /**
     * Создать кнопку действия
     */
    createActionButton(options) {
        return `
            <div class="mt-2">
                <button 
                    class="toast-action-btn text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    ${options.action}
                </button>
            </div>
        `;
    }

    /**
     * Получить иконку для типа уведомления
     */
    getIcon(type) {
        const icons = {
            success: `
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
            `,
            error: `
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
            `,
            warning: `
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            `,
            info: `
                <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
            `
        };

        return icons[type] || icons.info;
    }

    /**
     * Получить длительность по умолчанию для типа
     */
    getDefaultDuration(type) {
        const durations = {
            success: 3000,
            error: 5000,
            warning: 4000,
            info: 3000
        };
        return durations[type] || 3000;
    }

    /**
     * Скрыть уведомление
     */
    hide(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        // Анимация исчезновения
        toast.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toastId);
        }, 300);
    }

    /**
     * Скрыть все уведомления
     */
    hideAll() {
        this.toasts.forEach((toast, id) => {
            this.hide(id);
        });
    }

    /**
     * Показать уведомление об успехе
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * Показать уведомление об ошибке
     */
    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    /**
     * Показать предупреждение
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * Показать информационное уведомление
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * Показать уведомление с прогрессом
     */
    showProgress(message, progress = 0) {
        const toastId = this.show(message, 'info', { duration: 0 });
        const toast = this.toasts.get(toastId);
        
        if (toast) {
            const progressBar = document.createElement('div');
            progressBar.className = 'mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2';
            progressBar.innerHTML = `
                <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
            `;
            
            const messageContainer = toast.querySelector('.ml-3');
            messageContainer.appendChild(progressBar);
        }

        return toastId;
    }

    /**
     * Обновить прогресс уведомления
     */
    updateProgress(toastId, progress) {
        const toast = this.toasts.get(toastId);
        if (toast) {
            const progressBar = toast.querySelector('.bg-blue-600');
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            }
        }
    }

    /**
     * Генерация уникального ID для уведомления
     */
    generateToastId() {
        return 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Получить количество активных уведомлений
     */
    getActiveCount() {
        return this.toasts.size;
    }

    /**
     * Проверить, есть ли активные уведомления
     */
    hasActiveToasts() {
        return this.toasts.size > 0;
    }
}
