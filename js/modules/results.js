/**
 * Модуль отображения результатов генерации
 * Управляет показом сгенерированных команд героев
 */

export class Results {
    constructor(dependencies = {}) {
        this.storage = dependencies.storage;
        this.toast = dependencies.toast;
        this.modal = dependencies.modal;
        this.currentTeam = null;
        this.init();
    }

    /**
     * Инициализация модуля результатов
     */
    init() {
        console.log('📊 Results module initialized');
    }

    /**
     * Отображение сгенерированной команды
     */
    displayTeam(team) {
        try {
            this.currentTeam = team;
            
            // Показываем секцию результатов
            this.showResultsSection();
            
            // Очищаем предыдущие результаты
            this.clearResults();
            
            // Создаем карточки героев
            this.createHeroCards(team.heroes);
            
            // Добавляем информацию о команде
            this.addTeamInfo(team);
            
            // Прокручиваем к результатам
            this.scrollToResults();
            
            console.log('📊 Team displayed successfully');
            
        } catch (error) {
            console.error('Error displaying team:', error);
            this.toast.show('Ошибка при отображении результатов', 'error');
        }
    }

    /**
     * Показать секцию результатов
     */
    showResultsSection() {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            resultsSection.classList.add('animate-fade-in');
        }
    }

    /**
     * Скрыть секцию результатов
     */
    hideResultsSection() {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
            resultsSection.classList.remove('animate-fade-in');
        }
    }

    /**
     * Очистить результаты
     */
    clearResults() {
        const container = document.getElementById('results-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * Создать карточки героев
     */
    createHeroCards(heroes) {
        const container = document.getElementById('results-container');
        if (!container) return;

        heroes.forEach((hero, index) => {
            const heroCard = this.createHeroCard(hero, index);
            container.appendChild(heroCard);
        });
    }

    /**
     * Создать карточку героя
     */
    createHeroCard(hero, index) {
        const card = document.createElement('div');
        card.className = 'hero-card animate-slide-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div>
                    <h4 class="text-xl font-bold text-white mb-1">${hero.name}</h4>
                    <p class="text-blue-100 text-sm">${hero.set}</p>
                </div>
                <button 
                    class="hero-info-btn p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                    data-hero-id="${hero.id}"
                    aria-label="Подробнее о ${hero.name}"
                >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
            
            <div class="space-y-2 mb-4">
                <div class="flex items-center text-blue-100">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm">${hero.type}</span>
                </div>
                
                <div class="flex items-center text-blue-100">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm">${hero.difficulty}</span>
                </div>
            </div>
            
            <p class="text-blue-100 text-sm leading-relaxed">${hero.description}</p>
        `;

        // Добавляем обработчик клика для подробной информации
        const infoBtn = card.querySelector('.hero-info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                this.showHeroDetails(hero);
            });
        }

        return card;
    }

    /**
     * Добавить информацию о команде
     */
    addTeamInfo(team) {
        const container = document.getElementById('results-container');
        if (!container) return;

        const teamInfo = document.createElement('div');
        teamInfo.className = 'col-span-full bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mt-4';
        
        teamInfo.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                    <span class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                        </svg>
                        ${new Date(team.createdAt).toLocaleString('ru-RU')}
                    </span>
                    <span class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        ${team.heroCount} героев
                    </span>
                    <span class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        ${this.getGameModeLabel(team.gameMode)}
                    </span>
                </div>
                
                <div class="flex items-center space-x-2">
                    <button 
                        id="save-team-btn"
                        class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                        Сохранить
                    </button>
                    <button 
                        id="share-team-btn"
                        class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                        Поделиться
                    </button>
                    <button 
                        id="export-team-btn"
                        class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors duration-200"
                    >
                        Экспорт
                    </button>
                </div>
            </div>
        `;

        container.appendChild(teamInfo);

        // Добавляем обработчики событий для кнопок
        this.setupTeamActionButtons(team);
    }

    /**
     * Настройка кнопок действий с командой
     */
    setupTeamActionButtons(team) {
        const saveBtn = document.getElementById('save-team-btn');
        const shareBtn = document.getElementById('share-team-btn');
        const exportBtn = document.getElementById('export-team-btn');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveTeam(team);
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareTeam(team);
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportTeam(team);
            });
        }
    }

    /**
     * Показать подробную информацию о герое
     */
    showHeroDetails(hero) {
        const modalContent = `
            <div class="text-center">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${hero.name}</h3>
                <div class="space-y-4 text-left">
                    <div>
                        <h4 class="font-semibold text-gray-700 dark:text-gray-300">Набор:</h4>
                        <p class="text-gray-600 dark:text-gray-400">${hero.set}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-700 dark:text-gray-300">Тип:</h4>
                        <p class="text-gray-600 dark:text-gray-400">${hero.type}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-700 dark:text-gray-300">Сложность:</h4>
                        <p class="text-gray-600 dark:text-gray-400">${hero.difficulty}</p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-700 dark:text-gray-300">Описание:</h4>
                        <p class="text-gray-600 dark:text-gray-400">${hero.description}</p>
                    </div>
                </div>
            </div>
        `;

        this.modal.show('Информация о герое', modalContent);
    }

    /**
     * Сохранить команду
     */
    saveTeam(team) {
        try {
            this.storage.addToHistory(team);
            this.toast.show('Команда сохранена в историю!', 'success');
        } catch (error) {
            console.error('Error saving team:', error);
            this.toast.show('Ошибка при сохранении команды', 'error');
        }
    }

    /**
     * Поделиться командой
     */
    async shareTeam(team) {
        try {
            const shareData = {
                title: 'Моя команда Unmatched',
                text: `Моя случайная команда: ${team.heroes.map(h => h.name).join(', ')}`,
                url: window.location.href
            };

            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback - копирование в буфер обмена
                await navigator.clipboard.writeText(shareData.text);
                this.toast.show('Ссылка скопирована в буфер обмена!', 'success');
            }
        } catch (error) {
            console.error('Error sharing team:', error);
            this.toast.show('Ошибка при попытке поделиться', 'error');
        }
    }

    /**
     * Экспорт команды
     */
    exportTeam(team) {
        try {
            const exportData = {
                team: team,
                exportedAt: new Date().toISOString(),
                app: 'Randomatched v1.0.0'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `unmatched-team-${team.id}.json`;
            link.click();

            this.toast.show('Команда экспортирована!', 'success');
        } catch (error) {
            console.error('Error exporting team:', error);
            this.toast.show('Ошибка при экспорте команды', 'error');
        }
    }

    /**
     * Получить метку режима игры
     */
    getGameModeLabel(gameMode) {
        const labels = {
            'all': 'Все герои',
            'base': 'Базовые герои',
            'expansions': 'Только дополнения'
        };
        return labels[gameMode] || gameMode;
    }

    /**
     * Прокрутить к результатам
     */
    scrollToResults() {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Обновить макет результатов
     */
    updateLayout() {
        if (this.currentTeam) {
            // Перерисовываем результаты при изменении размера окна
            this.displayTeam(this.currentTeam);
        }
    }

    /**
     * Получить текущую команду
     */
    getCurrentTeam() {
        return this.currentTeam;
    }

    /**
     * Очистить текущую команду
     */
    clearCurrentTeam() {
        this.currentTeam = null;
        this.hideResultsSection();
    }
}
