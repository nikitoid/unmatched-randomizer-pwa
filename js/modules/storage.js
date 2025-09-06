/**
 * Модуль управления локальным хранилищем
 * Обеспечивает сохранение и загрузку данных приложения
 */

export class Storage {
    constructor() {
        this.storageKey = 'randomatched';
        this.init();
    }

    /**
     * Инициализация модуля хранилища
     */
    init() {
        this.migrateOldData();
        console.log('💾 Storage module initialized');
    }

    /**
     * Миграция старых данных
     */
    migrateOldData() {
        try {
            // Проверяем наличие старых ключей и мигрируем их
            const oldKeys = ['unmatched-randomizer', 'randomizer-data'];
            
            oldKeys.forEach(oldKey => {
                const oldData = localStorage.getItem(oldKey);
                if (oldData) {
                    try {
                        const parsed = JSON.parse(oldData);
                        this.set('migrated_' + oldKey, parsed);
                        localStorage.removeItem(oldKey);
                        console.log(`Migrated data from ${oldKey}`);
                    } catch (error) {
                        console.warn(`Failed to migrate data from ${oldKey}:`, error);
                    }
                }
            });
        } catch (error) {
            console.warn('Migration failed:', error);
        }
    }

    /**
     * Получить данные из хранилища
     */
    get(key, defaultValue = null) {
        try {
            const data = this.getAllData();
            return data.hasOwnProperty(key) ? data[key] : defaultValue;
        } catch (error) {
            console.warn(`Failed to get ${key} from storage:`, error);
            return defaultValue;
        }
    }

    /**
     * Сохранить данные в хранилище
     */
    set(key, value) {
        try {
            const data = this.getAllData();
            data[key] = value;
            this.saveAllData(data);
            return true;
        } catch (error) {
            console.error(`Failed to set ${key} in storage:`, error);
            return false;
        }
    }

    /**
     * Удалить данные из хранилища
     */
    remove(key) {
        try {
            const data = this.getAllData();
            delete data[key];
            this.saveAllData(data);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key} from storage:`, error);
            return false;
        }
    }

    /**
     * Получить все данные из хранилища
     */
    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.warn('Failed to parse storage data:', error);
            return {};
        }
    }

    /**
     * Сохранить все данные в хранилище
     */
    saveAllData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save storage data:', error);
            return false;
        }
    }

    /**
     * Очистить все данные
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    /**
     * Добавить команду в историю
     */
    addToHistory(team) {
        try {
            const history = this.get('history', []);
            
            // Добавляем новую команду в начало
            history.unshift({
                ...team,
                savedAt: new Date().toISOString()
            });

            // Ограничиваем историю 50 записями
            if (history.length > 50) {
                history.splice(50);
            }

            this.set('history', history);
            return true;
        } catch (error) {
            console.error('Failed to add team to history:', error);
            return false;
        }
    }

    /**
     * Получить историю команд
     */
    getHistory(limit = null) {
        try {
            const history = this.get('history', []);
            return limit ? history.slice(0, limit) : history;
        } catch (error) {
            console.error('Failed to get history:', error);
            return [];
        }
    }

    /**
     * Удалить команду из истории
     */
    removeFromHistory(teamId) {
        try {
            const history = this.get('history', []);
            const filteredHistory = history.filter(team => team.id !== teamId);
            this.set('history', filteredHistory);
            return true;
        } catch (error) {
            console.error('Failed to remove team from history:', error);
            return false;
        }
    }

    /**
     * Очистить историю
     */
    clearHistory() {
        try {
            this.set('history', []);
            return true;
        } catch (error) {
            console.error('Failed to clear history:', error);
            return false;
        }
    }

    /**
     * Сохранить избранную команду
     */
    saveFavorite(team) {
        try {
            const favorites = this.get('favorites', []);
            
            // Проверяем, не существует ли уже такая команда
            const exists = favorites.some(fav => fav.id === team.id);
            if (!exists) {
                favorites.push({
                    ...team,
                    favoritedAt: new Date().toISOString()
                });
                this.set('favorites', favorites);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save favorite:', error);
            return false;
        }
    }

    /**
     * Получить избранные команды
     */
    getFavorites() {
        try {
            return this.get('favorites', []);
        } catch (error) {
            console.error('Failed to get favorites:', error);
            return [];
        }
    }

    /**
     * Удалить из избранного
     */
    removeFavorite(teamId) {
        try {
            const favorites = this.get('favorites', []);
            const filteredFavorites = favorites.filter(team => team.id !== teamId);
            this.set('favorites', filteredFavorites);
            return true;
        } catch (error) {
            console.error('Failed to remove favorite:', error);
            return false;
        }
    }

    /**
     * Сохранить настройки приложения
     */
    saveSettings(settings) {
        try {
            const currentSettings = this.get('settings', {});
            const newSettings = { ...currentSettings, ...settings };
            this.set('settings', newSettings);
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Получить настройки приложения
     */
    getSettings() {
        try {
            return this.get('settings', {
                heroCount: '2',
                gameMode: 'all',
                theme: 'system',
                notifications: true,
                autoSave: true
            });
        } catch (error) {
            console.error('Failed to get settings:', error);
            return {};
        }
    }

    /**
     * Экспорт всех данных
     */
    exportData() {
        try {
            const data = this.getAllData();
            return {
                data: data,
                exportedAt: new Date().toISOString(),
                version: '1.0.0',
                app: 'Randomatched'
            };
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }

    /**
     * Импорт данных
     */
    importData(importedData) {
        try {
            if (!importedData || !importedData.data) {
                throw new Error('Invalid import data');
            }

            // Создаем резервную копию текущих данных
            const backup = this.exportData();
            this.set('backup_' + Date.now(), backup);

            // Импортируем новые данные
            this.saveAllData(importedData.data);
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * Получить статистику хранилища
     */
    getStorageStats() {
        try {
            const data = this.getAllData();
            const history = this.get('history', []);
            const favorites = this.get('favorites', []);
            
            return {
                totalKeys: Object.keys(data).length,
                historyCount: history.length,
                favoritesCount: favorites.length,
                storageSize: JSON.stringify(data).length,
                lastModified: this.get('lastModified', null)
            };
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return {};
        }
    }

    /**
     * Проверить доступность localStorage
     */
    isAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Получить размер используемого хранилища
     */
    getStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Очистить старые данные
     */
    cleanup() {
        try {
            const history = this.get('history', []);
            const favorites = this.get('favorites', []);
            
            // Удаляем команды старше 30 дней из истории
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const filteredHistory = history.filter(team => {
                const teamDate = new Date(team.savedAt || team.createdAt);
                return teamDate > thirtyDaysAgo;
            });
            
            if (filteredHistory.length !== history.length) {
                this.set('history', filteredHistory);
                console.log(`Cleaned up ${history.length - filteredHistory.length} old history entries`);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to cleanup storage:', error);
            return false;
        }
    }
}
