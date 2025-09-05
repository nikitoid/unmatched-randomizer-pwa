/**
 * Модуль-обертка для работы с localStorage.
 */

const LAST_GEN_KEY = "last-generation";
const EXCLUDED_HEROES_KEY = "excluded-heroes";
const HERO_LISTS_KEY = "hero-lists";
const DEFAULT_LIST_ID_KEY = "default-list-id";

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

  // --- Session ---
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
    // Note: We are NOT clearing hero lists on session reset.
    console.log("Сессия очищена.");
  },

  // --- List Management ---
  saveHeroLists(lists) {
    this.set(HERO_LISTS_KEY, lists);
  },

  loadHeroLists() {
    return this.get(HERO_LISTS_KEY);
  },

  saveDefaultListId(id) {
    this.set(DEFAULT_LIST_ID_KEY, id);
  },

  loadDefaultListId() {
    return this.get(DEFAULT_LIST_ID_KEY);
  },
};

export default Storage;
