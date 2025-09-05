/**
 * Утилита для работы с localStorage с префиксом.
 * Переименовано в AppStorage во избежание конфликта с Web Storage API.
 */
class AppStorage {
  constructor(prefix = "app_") {
    this.prefix = prefix;
  }

  setItem(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error("Error saving to localStorage", e);
    }
  }

  getItem(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(this.prefix + key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error("Error reading from localStorage", e);
      return defaultValue;
    }
  }

  removeItem(key) {
    localStorage.removeItem(this.prefix + key);
  }
}

export default AppStorage;
