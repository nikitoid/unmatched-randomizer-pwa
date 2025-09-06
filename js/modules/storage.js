const LAST_GEN_KEY = "last-generation";
const HERO_LISTS_KEY = "hero-lists";
const DEFAULT_LIST_KEY = "default-list-name";
const ACTIVE_LIST_KEY = "active-list-name";
const ORIGINAL_LIST_MAP_KEY = "original-list-map";
const SYNCED_LIST_NAMES_KEY = "synced-list-names";

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

  saveSyncedListNames(names) {
    this.set(SYNCED_LIST_NAMES_KEY, names);
  },
  loadSyncedListNames() {
    return this.get(SYNCED_LIST_NAMES_KEY);
  },

  loadCloudLists() {
    const allLists = this.loadHeroLists() || {};
    const syncedNames = this.loadSyncedListNames() || [];
    const cloudLists = {};
    for (const name of syncedNames) {
      if (allLists[name]) {
        cloudLists[name] = allLists[name];
      }
    }
    return cloudLists;
  },

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
    if (originalMap[activeList]) {
      newActiveList = originalMap[activeList];
    }
    const newHeroLists = {};
    for (const listName in heroLists) {
      if (!originalMap.hasOwnProperty(listName)) {
        newHeroLists[listName] = heroLists[listName];
      }
    }
    this.saveHeroLists(newHeroLists);
    if (!newHeroLists[newActiveList]) {
      const defaultList = this.loadDefaultList();
      newActiveList = newHeroLists[defaultList]
        ? defaultList
        : Object.keys(newHeroLists)[0];
    }
    this.saveActiveList(newActiveList);
    this.remove(ORIGINAL_LIST_MAP_KEY);
    this.remove(LAST_GEN_KEY);
    console.log("Сессия очищена, временные списки удалены.");
  },
};

export default Storage;
