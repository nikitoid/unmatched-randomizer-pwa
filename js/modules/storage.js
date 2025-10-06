/**
 * Модуль-обертка для работы с localStorage.
 */

const LAST_GEN_KEY = "last-generation";
const HERO_LISTS_KEY = "hero-lists";
const DEFAULT_LIST_KEY = "default-list-name";
const ACTIVE_LIST_KEY = "active-list-name";
import { firebaseManager } from "./firebase.js";

const ORIGINAL_LIST_MAP_KEY = "original-list-map"; // Карта для отслеживания оригиналов

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
  saveHeroLists(lists, skipSync = false) {
    if (!skipSync) {
      const oldLists = this.loadHeroLists() || {};
      for (const listName in lists) {
        const oldList = oldLists[listName];
        const newList = lists[listName];
        // Если список облачный и состав героев изменился, синхронизируем
        if (
          newList.type === "cloud" &&
          oldList &&
          JSON.stringify(oldList.heroes) !== JSON.stringify(newList.heroes)
        ) {
          firebaseManager.syncList(newList.id, newList);
        }
      }
    }
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

  // --- Методы для карт оригинальных списков ---
  saveOriginalListMap(map) {
    this.set(ORIGINAL_LIST_MAP_KEY, map);
  },

  loadOriginalListMap() {
    return this.get(ORIGINAL_LIST_MAP_KEY) || {};
  },

  clearSession() {
    const heroLists = this.loadHeroLists() || {};
    const originalMap = this.loadOriginalListMap();
    const activeList = this.loadActiveList();

    let newActiveList = activeList;

    // Если активный список - копия, найти его оригинал
    if (originalMap[activeList]) {
      newActiveList = originalMap[activeList];
    }

    // Удаляем все списки, которые являются копиями
    const newHeroLists = {};
    for (const listName in heroLists) {
      if (!originalMap.hasOwnProperty(listName)) {
        newHeroLists[listName] = heroLists[listName];
      }
    }

    this.saveHeroLists(newHeroLists);

    // Если новый активный список не существует (был удален), сбросить на дефолтный или первый
    if (!newHeroLists[newActiveList]) {
      const defaultList = this.loadDefaultList();
      if (newHeroLists[defaultList]) {
        newActiveList = defaultList;
      } else {
        newActiveList = Object.keys(newHeroLists)[0];
      }
    }

    this.saveActiveList(newActiveList);
    this.remove(ORIGINAL_LIST_MAP_KEY);
    this.remove(LAST_GEN_KEY);
    console.log("Сессия очищена, временные списки удалены.");
  },
};

export default Storage;
