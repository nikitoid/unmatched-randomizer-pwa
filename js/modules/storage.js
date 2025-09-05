/**
 * Модуль-обертка для работы с localStorage.
 */

const LAST_GEN_KEY = "last-generation";
const EXCLUDED_HEROES_KEY = "excluded-heroes";

const Storage = {
  get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(
        `Ошибка при получении данных '${key}' из localStorage`,
        error
      );
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(
        `Ошибка при сохранении данных '${key}' в localStorage`,
        error
      );
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(
        `Ошибка при удалении данных '${key}' из localStorage`,
        error
      );
    }
  },

  saveLastGeneration(teams) {
    this.set(LAST_GEN_KEY, teams);
  },

  loadLastGeneration() {
    return this.get(LAST_GEN_KEY);
  },

  saveExcludedHeroes(heroes) {
    this.set(EXCLUDED_HEROES_KEY, heroes);
  },

  loadExcludedHeroes() {
    return this.get(EXCLUDED_HEROES_KEY) || [];
  },

  clearSession() {
    this.remove(LAST_GEN_KEY);
    this.remove(EXCLUDED_HEROES_KEY);
    console.log("Сессия очищена.");
  },
};

export default Storage;
