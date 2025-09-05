/**
 * Модуль-обертка для работы с localStorage с единым объектом данных.
 */
const APP_DATA_KEY = "randomatched-data";
const DEFAULT_STRUCTURE = {
  lists: {},
  originalMap: {},
  defaultList: null,
  activeList: null,
};

function loadAppData() {
  try {
    const value = localStorage.getItem(APP_DATA_KEY);
    if (!value) {
      return { ...DEFAULT_STRUCTURE };
    }
    const parsed = JSON.parse(value);
    // Проверка на корректность структуры
    if (typeof parsed === "object" && parsed !== null && "lists" in parsed) {
      return { ...DEFAULT_STRUCTURE, ...parsed };
    }
    return { ...DEFAULT_STRUCTURE };
  } catch (error) {
    console.error(
      "Ошибка при получении данных из localStorage, возврат к defaults.",
      error
    );
    return { ...DEFAULT_STRUCTURE };
  }
}

function saveAppData(data) {
  try {
    if (typeof data !== "object" || data === null) {
      throw new Error("Попытка сохранить некорректные данные.");
    }
    localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Ошибка при сохранении данных в localStorage", error);
  }
}

const Storage = {
  // --- Комплексные методы ---
  getFullData() {
    return loadAppData();
  },

  setFullData(data) {
    saveAppData(data);
  },

  // --- Методы для управления списками ---
  saveHeroLists(lists) {
    const data = loadAppData();
    data.lists = lists;
    saveAppData(data);
  },

  loadHeroLists() {
    return loadAppData().lists || {};
  },

  // --- Методы для управления избранным и активным списками ---
  saveDefaultList(listName) {
    const data = loadAppData();
    data.defaultList = listName;
    saveAppData(data);
  },

  loadDefaultList() {
    return loadAppData().defaultList;
  },

  saveActiveList(listName) {
    const data = loadAppData();
    data.activeList = listName;
    saveAppData(data);
  },

  loadActiveList() {
    return loadAppData().activeList;
  },

  // --- Методы для карт оригинальных списков ---
  saveOriginalListMap(map) {
    const data = loadAppData();
    data.originalMap = map;
    saveAppData(data);
  },

  loadOriginalListMap() {
    return loadAppData().originalMap || {};
  },

  // --- Управление сессией ---
  saveLastGeneration(teams) {
    const data = loadAppData();
    data.lastGeneration = teams;
    saveAppData(data);
  },

  loadLastGeneration() {
    return loadAppData().lastGeneration;
  },

  clearSession() {
    const data = loadAppData();
    const heroLists = data.lists || {};
    const originalMap = data.originalMap || {};
    const activeList = data.activeList;

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
    data.lists = newHeroLists;

    if (!newHeroLists[newActiveList]) {
      const defaultList = data.defaultList;
      newActiveList = newHeroLists[defaultList]
        ? defaultList
        : Object.keys(newHeroLists)[0];
    }

    data.activeList = newActiveList;
    data.originalMap = {};
    delete data.lastGeneration;

    saveAppData(data);
    console.log("Сессия очищена, временные списки удалены.");
  },
};

export default Storage;
