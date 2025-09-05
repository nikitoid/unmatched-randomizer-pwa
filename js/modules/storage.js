/**
 * Класс-обертка для работы с localStorage.
 * Автоматически обрабатывает JSON.
 */
export default class AppStorage {
  constructor(prefix = "randomatched_") {
    this.prefix = prefix;
  }

  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(
        `Ошибка при получении данных '${key}' из localStorage`,
        error
      );
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(
        `Ошибка при сохранении данных '${key}' в localStorage`,
        error
      );
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(
        `Ошибка при удалении данных '${key}' из localStorage`,
        error
      );
    }
  }
}
