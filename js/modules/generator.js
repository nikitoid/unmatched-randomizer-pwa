/**
 * Модуль генерации случайных героев
 * Содержит логику создания случайных команд для игры Unmatched
 */

export class Generator {
    constructor(dependencies = {}) {
        this.storage = dependencies.storage;
        this.toast = dependencies.toast;
        this.fixedHero = null;
        this.init();
    }

    /**
     * Инициализация генератора
     */
    init() {
        this.loadHeroesData();
        console.log('🎲 Generator initialized');
    }

    /**
     * Загрузка данных о героях
     */
    loadHeroesData() {
        // Базовые герои из оригинального набора Unmatched
        this.heroes = {
            base: [
                {
                    id: 'arthur',
                    name: 'Король Артур',
                    set: 'Unmatched: Battle of Legends, Volume One',
                    difficulty: 'Средняя',
                    type: 'Ближний бой',
                    description: 'Легендарный король с мечом Экскалибур',
                    image: '/images/heroes/arthur.jpg'
                },
                {
                    id: 'medusa',
                    name: 'Медуза',
                    set: 'Unmatched: Battle of Legends, Volume One',
                    difficulty: 'Сложная',
                    type: 'Дальний бой',
                    description: 'Мифическое существо с каменным взглядом',
                    image: '/images/heroes/medusa.jpg'
                },
                {
                    id: 'alice',
                    name: 'Алиса',
                    set: 'Unmatched: Battle of Legends, Volume One',
                    difficulty: 'Легкая',
                    type: 'Универсальная',
                    description: 'Девочка из Страны чудес',
                    image: '/images/heroes/alice.jpg'
                },
                {
                    id: 'sinbad',
                    name: 'Синдбад',
                    set: 'Unmatched: Battle of Legends, Volume One',
                    difficulty: 'Средняя',
                    type: 'Ближний бой',
                    description: 'Легендарный мореплаватель',
                    image: '/images/heroes/sinbad.jpg'
                }
            ],
            expansions: [
                {
                    id: 'robin-hood',
                    name: 'Робин Гуд',
                    set: 'Unmatched: Robin Hood vs Bigfoot',
                    difficulty: 'Средняя',
                    type: 'Дальний бой',
                    description: 'Благородный разбойник из Шервудского леса',
                    image: '/images/heroes/robin-hood.jpg'
                },
                {
                    id: 'bigfoot',
                    name: 'Бигфут',
                    set: 'Unmatched: Robin Hood vs Bigfoot',
                    difficulty: 'Сложная',
                    type: 'Ближний бой',
                    description: 'Легендарное существо из лесов',
                    image: '/images/heroes/bigfoot.jpg'
                },
                {
                    id: 'bruce-lee',
                    name: 'Брюс Ли',
                    set: 'Unmatched: Bruce Lee',
                    difficulty: 'Сложная',
                    type: 'Ближний бой',
                    description: 'Мастер боевых искусств',
                    image: '/images/heroes/bruce-lee.jpg'
                },
                {
                    id: 'muldoon',
                    name: 'Малдун',
                    set: 'Unmatched: Jurassic Park - InGen vs Raptors',
                    difficulty: 'Средняя',
                    type: 'Дальний бой',
                    description: 'Охотник на динозавров',
                    image: '/images/heroes/muldoon.jpg'
                },
                {
                    id: 'raptors',
                    name: 'Рапторы',
                    set: 'Unmatched: Jurassic Park - InGen vs Raptors',
                    difficulty: 'Сложная',
                    type: 'Ближний бой',
                    description: 'Стая умных динозавров',
                    image: '/images/heroes/raptors.jpg'
                },
                {
                    id: 'sherlock',
                    name: 'Шерлок Холмс',
                    set: 'Unmatched: Cobble & Fog',
                    difficulty: 'Сложная',
                    type: 'Универсальная',
                    description: 'Великий детектив',
                    image: '/images/heroes/sherlock.jpg'
                },
                {
                    id: 'dracula',
                    name: 'Дракула',
                    set: 'Unmatched: Cobble & Fog',
                    difficulty: 'Средняя',
                    type: 'Ближний бой',
                    description: 'Вампир-граф',
                    image: '/images/heroes/dracula.jpg'
                },
                {
                    id: 'jekyll-hyde',
                    name: 'Джекил и Хайд',
                    set: 'Unmatched: Cobble & Fog',
                    difficulty: 'Сложная',
                    type: 'Универсальная',
                    description: 'Двойственная личность',
                    image: '/images/heroes/jekyll-hyde.jpg'
                },
                {
                    id: 'invisible-man',
                    name: 'Человек-невидимка',
                    set: 'Unmatched: Cobble & Fog',
                    difficulty: 'Средняя',
                    type: 'Дальний бой',
                    description: 'Невидимый преступник',
                    image: '/images/heroes/invisible-man.jpg'
                }
            ]
        };

        // Создаем общий список всех героев
        this.allHeroes = [...this.heroes.base, ...this.heroes.expansions];
    }

    /**
     * Генерация случайной команды
     */
    async generateTeam(heroCount = 2, gameMode = 'all') {
        try {
            // Получаем доступных героев в зависимости от режима
            const availableHeroes = this.getAvailableHeroes(gameMode);
            
            if (availableHeroes.length < heroCount) {
                throw new Error(`Недостаточно героев в режиме "${gameMode}". Доступно: ${availableHeroes.length}, требуется: ${heroCount}`);
            }

            // Создаем копию массива для работы
            let heroesPool = [...availableHeroes];
            const team = [];

            // Если есть фиксированный герой, добавляем его первым
            if (this.fixedHero) {
                const fixedHeroData = heroesPool.find(hero => hero.id === this.fixedHero);
                if (fixedHeroData) {
                    team.push(fixedHeroData);
                    heroesPool = heroesPool.filter(hero => hero.id !== this.fixedHero);
                }
                this.fixedHero = null; // Сбрасываем после использования
            }

            // Генерируем остальных героев
            const remainingCount = heroCount - team.length;
            for (let i = 0; i < remainingCount; i++) {
                const randomIndex = Math.floor(Math.random() * heroesPool.length);
                const selectedHero = heroesPool.splice(randomIndex, 1)[0];
                team.push(selectedHero);
            }

            // Создаем объект команды
            const teamData = {
                id: this.generateTeamId(),
                heroes: team,
                createdAt: new Date().toISOString(),
                gameMode: gameMode,
                heroCount: heroCount
            };

            console.log(`🎲 Generated team: ${team.map(h => h.name).join(', ')}`);
            return teamData;

        } catch (error) {
            console.error('Error generating team:', error);
            throw error;
        }
    }

    /**
     * Получить доступных героев в зависимости от режима
     */
    getAvailableHeroes(gameMode) {
        switch (gameMode) {
            case 'base':
                return this.heroes.base;
            case 'expansions':
                return this.heroes.expansions;
            case 'all':
            default:
                return this.allHeroes;
        }
    }

    /**
     * Генерация уникального ID для команды
     */
    generateTeamId() {
        return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Установить фиксированного героя для следующей генерации
     */
    setFixedHero(heroId) {
        this.fixedHero = heroId;
        console.log(`🎯 Fixed hero set: ${heroId}`);
    }

    /**
     * Получить информацию о герое по ID
     */
    getHeroById(heroId) {
        return this.allHeroes.find(hero => hero.id === heroId);
    }

    /**
     * Получить случайного героя
     */
    getRandomHero(gameMode = 'all') {
        const availableHeroes = this.getAvailableHeroes(gameMode);
        const randomIndex = Math.floor(Math.random() * availableHeroes.length);
        return availableHeroes[randomIndex];
    }

    /**
     * Фильтрация героев по критериям
     */
    filterHeroes(criteria = {}) {
        let filteredHeroes = [...this.allHeroes];

        if (criteria.difficulty) {
            filteredHeroes = filteredHeroes.filter(hero => 
                hero.difficulty === criteria.difficulty
            );
        }

        if (criteria.type) {
            filteredHeroes = filteredHeroes.filter(hero => 
                hero.type === criteria.type
            );
        }

        if (criteria.set) {
            filteredHeroes = filteredHeroes.filter(hero => 
                hero.set === criteria.set
            );
        }

        return filteredHeroes;
    }

    /**
     * Получить статистику по героям
     */
    getHeroesStats() {
        const stats = {
            total: this.allHeroes.length,
            byDifficulty: {},
            byType: {},
            bySet: {}
        };

        this.allHeroes.forEach(hero => {
            // По сложности
            stats.byDifficulty[hero.difficulty] = (stats.byDifficulty[hero.difficulty] || 0) + 1;
            
            // По типу
            stats.byType[hero.type] = (stats.byType[hero.type] || 0) + 1;
            
            // По набору
            stats.bySet[hero.set] = (stats.bySet[hero.set] || 0) + 1;
        });

        return stats;
    }

    /**
     * Валидация команды
     */
    validateTeam(team) {
        const errors = [];

        if (!team || !Array.isArray(team.heroes)) {
            errors.push('Команда должна содержать массив героев');
        }

        if (team.heroes.length === 0) {
            errors.push('Команда не может быть пустой');
        }

        if (team.heroes.length > 4) {
            errors.push('Команда не может содержать более 4 героев');
        }

        // Проверка на дубликаты
        const heroIds = team.heroes.map(hero => hero.id);
        const uniqueIds = new Set(heroIds);
        if (heroIds.length !== uniqueIds.size) {
            errors.push('В команде не должно быть дублирующихся героев');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Получить информацию о генераторе
     */
    getGeneratorInfo() {
        return {
            totalHeroes: this.allHeroes.length,
            baseHeroes: this.heroes.base.length,
            expansionHeroes: this.heroes.expansions.length,
            fixedHero: this.fixedHero,
            stats: this.getHeroesStats()
        };
    }
}
