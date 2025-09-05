/**
 * Модуль-обертка для работы с localStorage.
 */

const LAST_GEN_KEY = "last-generation";
const HERO_LISTS_KEY = "hero-lists";
const DEFAULT_LIST_KEY = "default-list-name";
const ACTIVE_LIST_KEY = "active-list-name";

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

  // --- Методы для управления списками ---
  saveHeroLists(lists) {
    this.set(HERO_LISTS_KEY, lists);
  },

  loadHeroLists() {
    return this.get(HERO_LISTS_KEY);
  },

  saveDefaultList(listName) {
    this.set(DEFAULT_LIST_KEY, listName);
  },

  loadDefaultList() {
    return this.get(DEFAULT_LIST_KEY);
  },

  saveActiveList(listName) {
    this.set(ACTIVE_LIST_KEY, listName);
  },

  loadActiveList() {
    return this.get(ACTIVE_LIST_KEY);
  },

  clearSession() {
    this.remove(LAST_GEN_KEY);
    console.log("Сессия очищена.");
  },
};

export default Storage;
