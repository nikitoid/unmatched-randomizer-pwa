import Modal from "./modal.js";

/**
 * Модуль для аутентификации и управления паролем.
 */
const Auth = {
  cachedPassword: null,

  /**
   * Хэширует пароль с использованием SHA-256.
   * @param {string} password - Пароль для хэширования.
   * @returns {Promise<string>} - Хэш в виде строки hex.
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  /**
   * Запрашивает пароль у пользователя через модальное окно.
   * @returns {Promise<string|null>} - Введенный пароль или null при отмене.
   */
  askPassword() {
    return new Promise((resolve) => {
      const content = `
        <p class="text-sm mb-2 text-gray-600 dark:text-gray-400">Для выполнения этого действия требуется пароль администратора.</p>
        <input type="password" id="admin-password-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Введите пароль">
      `;
      const modal = new Modal({
        title: "Требуется пароль",
        content,
        confirmText: "Подтвердить",
        cancelText: "Отмена",
        onConfirm: () => {
          const input = document.getElementById("admin-password-input");
          resolve(input.value);
        },
        onClose: () => {
          // Если окно закрыли без подтверждения (крестик, Escape, Отмена),
          // резолвим null только если промис еще не был выполнен.
          // Это предотвращает перезапись результата от onConfirm.
          resolve(null);
        },
      });
      modal.open();
    });
  },

  /**
   * Получает пароль, используя кэш сессии или запрашивая у пользователя.
   * @returns {Promise<string|null>} - Пароль или null, если пользователь отказался от ввода.
   */
  async getPassword() {
    // 1. Проверяем кэш в памяти
    if (this.cachedPassword) {
      return this.cachedPassword;
    }
    // 2. Проверяем кэш сессии
    const sessionPassword = sessionStorage.getItem("adminPassword");
    if (sessionPassword) {
      this.cachedPassword = sessionPassword;
      return sessionPassword;
    }
    // 3. Запрашиваем у пользователя
    const password = await this.askPassword();
    if (password) {
      this.cachedPassword = password;
      sessionStorage.setItem("adminPassword", password);
      return password;
    }
    return null;
  },

  /**
   * Очищает кэшированный пароль.
   */
  clearPasswordCache() {
    this.cachedPassword = null;
    sessionStorage.removeItem("adminPassword");
  },
};

export default Auth;
