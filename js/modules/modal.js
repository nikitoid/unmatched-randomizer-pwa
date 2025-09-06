/**
 * Модуль модальных окон
 * Обеспечивает показ модальных диалогов и всплывающих окон
 */

export class Modal {
    constructor() {
        this.currentModal = null;
        this.modalStack = [];
        this.init();
    }

    /**
     * Инициализация модуля модальных окон
     */
    init() {
        this.createModalContainer();
        this.setupEventListeners();
        console.log('🪟 Modal module initialized');
    }

    /**
     * Создать контейнер для модальных окон
     */
    createModalContainer() {
        // Проверяем, не существует ли уже контейнер
        let container = document.getElementById('modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modal-container';
            container.className = 'fixed inset-0 z-50 hidden';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.close();
            }
        });

        // Закрытие по клику на фон
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });
    }

    /**
     * Показать модальное окно
     */
    show(title, content, options = {}) {
        const modalId = this.generateModalId();
        const modal = this.createModal(modalId, title, content, options);
        
        this.container.appendChild(modal);
        this.modalStack.push(modalId);
        this.currentModal = modalId;
        
        // Показываем контейнер
        this.container.classList.remove('hidden');
        
        // Анимация появления
        requestAnimationFrame(() => {
            modal.classList.add('animate-fade-in');
        });

        // Фокус на модальном окне
        this.focusModal(modal);

        return modalId;
    }

    /**
     * Создать модальное окно
     */
    createModal(id, title, content, options) {
        const modal = document.createElement('div');
        modal.id = `modal-${id}`;
        modal.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
        
        const sizeClass = this.getSizeClass(options.size);
        const modalContent = document.createElement('div');
        modalContent.className = `modal-content bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full ${sizeClass} max-h-screen overflow-y-auto`;
        
        modalContent.innerHTML = `
            <div class="modal-header flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${title}</h3>
                <button 
                    class="modal-close-btn text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                    aria-label="Закрыть модальное окно"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="modal-body p-6">
                ${content}
            </div>
            ${this.createModalFooter(options)}
        `;

        modal.appendChild(modalContent);

        // Добавляем обработчики событий
        this.setupModalEventListeners(modal, options);

        return modal;
    }

    /**
     * Создать подвал модального окна
     */
    createModalFooter(options) {
        if (!options.buttons && !options.showFooter) {
            return '';
        }

        const buttons = options.buttons || [
            {
                text: 'Закрыть',
                class: 'bg-gray-600 hover:bg-gray-700 text-white',
                action: 'close'
            }
        ];

        const buttonElements = buttons.map(button => {
            const action = button.action || 'close';
            return `
                <button 
                    class="modal-btn px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${button.class}"
                    data-action="${action}"
                >
                    ${button.text}
                </button>
            `;
        }).join('');

        return `
            <div class="modal-footer flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                ${buttonElements}
            </div>
        `;
    }

    /**
     * Настройка обработчиков событий модального окна
     */
    setupModalEventListeners(modal, options) {
        // Кнопка закрытия
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }

        // Кнопки в подвале
        const buttons = modal.querySelectorAll('.modal-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                this.handleButtonAction(action, options);
            });
        });

        // Обработка клика на контент (предотвращение закрытия)
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    /**
     * Обработка действий кнопок
     */
    handleButtonAction(action, options) {
        switch (action) {
            case 'close':
                this.close();
                break;
            case 'confirm':
                if (options.onConfirm) {
                    options.onConfirm();
                }
                this.close();
                break;
            case 'cancel':
                if (options.onCancel) {
                    options.onCancel();
                }
                this.close();
                break;
            default:
                if (options.onButtonClick) {
                    options.onButtonClick(action);
                }
        }
    }

    /**
     * Получить класс размера модального окна
     */
    getSizeClass(size) {
        const sizes = {
            'sm': 'max-w-sm',
            'md': 'max-w-md',
            'lg': 'max-w-lg',
            'xl': 'max-w-xl',
            '2xl': 'max-w-2xl',
            '3xl': 'max-w-3xl',
            '4xl': 'max-w-4xl',
            'full': 'max-w-full mx-4'
        };
        return sizes[size] || sizes['lg'];
    }

    /**
     * Установить фокус на модальном окне
     */
    focusModal(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Закрыть модальное окно
     */
    close() {
        if (!this.currentModal) return;

        const modal = document.getElementById(`modal-${this.currentModal}`);
        if (modal) {
            // Анимация исчезновения
            modal.classList.remove('animate-fade-in');
            modal.classList.add('animate-fade-out');

            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }

        // Удаляем из стека
        this.modalStack = this.modalStack.filter(id => id !== this.currentModal);
        
        // Показываем предыдущее модальное окно или скрываем контейнер
        if (this.modalStack.length > 0) {
            this.currentModal = this.modalStack[this.modalStack.length - 1];
        } else {
            this.currentModal = null;
            this.container.classList.add('hidden');
        }
    }

    /**
     * Закрыть все модальные окна
     */
    closeAll() {
        while (this.modalStack.length > 0) {
            this.close();
        }
    }

    /**
     * Показать диалог подтверждения
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const content = `
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
                        <svg class="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300">${message}</p>
                </div>
            `;

            const modalOptions = {
                size: 'sm',
                buttons: [
                    {
                        text: options.cancelText || 'Отмена',
                        class: 'bg-gray-600 hover:bg-gray-700 text-white',
                        action: 'cancel'
                    },
                    {
                        text: options.confirmText || 'Подтвердить',
                        class: 'bg-red-600 hover:bg-red-700 text-white',
                        action: 'confirm'
                    }
                ],
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            };

            this.show(options.title || 'Подтверждение', content, modalOptions);
        });
    }

    /**
     * Показать диалог с полем ввода
     */
    prompt(message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const inputId = this.generateModalId() + '-input';
            const content = `
                <div>
                    <label for="${inputId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ${message}
                    </label>
                    <input 
                        type="${options.inputType || 'text'}" 
                        id="${inputId}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value="${defaultValue}"
                        placeholder="${options.placeholder || ''}"
                    />
                </div>
            `;

            const modalOptions = {
                size: 'sm',
                buttons: [
                    {
                        text: options.cancelText || 'Отмена',
                        class: 'bg-gray-600 hover:bg-gray-700 text-white',
                        action: 'cancel'
                    },
                    {
                        text: options.confirmText || 'ОК',
                        class: 'bg-blue-600 hover:bg-blue-700 text-white',
                        action: 'confirm'
                    }
                ],
                onConfirm: () => {
                    const input = document.getElementById(inputId);
                    resolve(input ? input.value : defaultValue);
                },
                onCancel: () => resolve(null)
            };

            const modalId = this.show(options.title || 'Ввод', content, modalOptions);
            
            // Фокус на поле ввода
            setTimeout(() => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);
        });
    }

    /**
     * Показать диалог с выбором
     */
    select(message, options, selectedValue = null) {
        return new Promise((resolve) => {
            const selectId = this.generateModalId() + '-select';
            const optionElements = options.map(option => {
                const value = typeof option === 'string' ? option : option.value;
                const text = typeof option === 'string' ? option : option.text;
                const selected = value === selectedValue ? 'selected' : '';
                return `<option value="${value}" ${selected}>${text}</option>`;
            }).join('');

            const content = `
                <div>
                    <label for="${selectId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ${message}
                    </label>
                    <select 
                        id="${selectId}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        ${optionElements}
                    </select>
                </div>
            `;

            const modalOptions = {
                size: 'sm',
                buttons: [
                    {
                        text: 'Отмена',
                        class: 'bg-gray-600 hover:bg-gray-700 text-white',
                        action: 'cancel'
                    },
                    {
                        text: 'Выбрать',
                        class: 'bg-blue-600 hover:bg-blue-700 text-white',
                        action: 'confirm'
                    }
                ],
                onConfirm: () => {
                    const select = document.getElementById(selectId);
                    resolve(select ? select.value : null);
                },
                onCancel: () => resolve(null)
            };

            this.show('Выбор', content, modalOptions);
        });
    }

    /**
     * Генерация уникального ID для модального окна
     */
    generateModalId() {
        return 'modal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Проверить, открыто ли модальное окно
     */
    isOpen() {
        return this.currentModal !== null;
    }

    /**
     * Получить количество открытых модальных окон
     */
    getOpenCount() {
        return this.modalStack.length;
    }
}
