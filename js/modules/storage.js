/**
 * Модуль-обертка для работы с localStorage.
 * Автоматически обрабатывает JSON.
 */
const Storage = {
  /**
   * Получить значение из localStorage по ключу.
   * @param {string} key - Ключ.
   * @returns {any | null} - Разобранное значение или null, если его нет.
   */
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

  /**
   * Сохранить значение в localStorage.
   * @param {string} key - Ключ.
   * @param {any} value - Значение (будет преобразовано в JSON).
   */
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

  /**
   * Удалить значение из localStorage.
   * @param {string} key - Ключ.
   */
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

  // --- Специфичные для приложения методы ---

  saveHeroList(list) {
    this.set("hero-list", list);
  },

  loadHeroList() {
    return this.get("hero-list");
  },

  saveLastGeneration(teams) {
    this.set("last-generation", teams);
  },

  loadLastGeneration() {
    return this.get("last-generation");
  },

  clearSession() {
    this.remove("last-generation");
    // В будущем здесь можно будет очищать и другие данные сессии
    console.log("Сессия очищена.");
  },
};

export default Storage;
