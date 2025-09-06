/**
 * Модуль-обертка для работы с localStorage и Firebase.
 */

const LAST_GEN_KEY = "last-generation";
const HERO_LISTS_KEY = "hero-lists";
const DEFAULT_LIST_KEY = "default-list-name";
const ACTIVE_LIST_KEY = "active-list-name";
const ORIGINAL_LIST_MAP_KEY = "original-list-map"; // Карта для отслеживания оригиналов
const UNMATCHED_LISTS_KEY = "unmatchedLists"; // Firebase data key

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
    this.syncWithFirebase();
  },

  loadHeroLists() {
    // Try to load from Firebase data first, fallback to legacy storage
    const firebaseData = this.get(UNMATCHED_LISTS_KEY);
    if (firebaseData && firebaseData.lists) {
      return firebaseData.lists;
    }
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
    this.syncWithFirebase();
  },

  loadActiveList() {
    // Try to load from Firebase data first, fallback to legacy storage
    const firebaseData = this.get(UNMATCHED_LISTS_KEY);
    if (firebaseData && firebaseData.selected) {
      return firebaseData.selected;
    }
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

  // --- Firebase integration methods ---
  syncWithFirebase() {
    // This method will be called when Firebase manager is available
    if (window.firebaseManager && window.firebaseManager.isReady()) {
      // Trigger sync in background
      window.firebaseManager.syncLists().catch(error => {
        console.error('Background sync failed:', error);
      });
    }
  },

  // Update Firebase data structure
  updateFirebaseData(lists, selected = null) {
    const currentData = this.get(UNMATCHED_LISTS_KEY) || { lists: {}, passwordHash: '', selected: '' };
    const newData = {
      ...currentData,
      lists: lists || currentData.lists,
      selected: selected !== null ? selected : currentData.selected
    };
    this.set(UNMATCHED_LISTS_KEY, newData);
  },

  // Get Firebase data structure
  getFirebaseData() {
    return this.get(UNMATCHED_LISTS_KEY) || { lists: {}, passwordHash: '', selected: '' };
  },

  // Migrate legacy data to Firebase format
  migrateToFirebase() {
    const legacyLists = this.get(HERO_LISTS_KEY);
    const legacySelected = this.get(ACTIVE_LIST_KEY);
    
    if (legacyLists && !this.get(UNMATCHED_LISTS_KEY)) {
      const firebaseData = {
        lists: legacyLists,
        passwordHash: '',
        selected: legacySelected || ''
      };
      this.set(UNMATCHED_LISTS_KEY, firebaseData);
      console.log('Legacy data migrated to Firebase format');
    }
  },
};

export default Storage;
