import Modal from "./modal.js";
import Toast from "./toast.js";

const SESSION_PASSWORD_KEY = "session-auth-password";

/**
 * Конвертирует ArrayBuffer в hex-строку.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Хэширует пароль с использованием SHA-256.
 * @param {string} password - Пароль для хэширования.
 * @returns {Promise<string|null>} - Хэш в виде hex-строки.
 */
async function hashPassword(password) {
  if (!password) return null;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return bufferToHex(hashBuffer);
  } catch (error) {
    console.error("Ошибка хэширования:", error);
    Toast.error("Критическая ошибка безопасности.");
    return null;
  }
}

/**
 * Запрашивает пароль у пользователя через модальное окно.
 * Кэширует пароль в sessionStorage.
 * @returns {Promise<string>} - Promise, который разрешается с введенным паролем.
 */
function requestPassword() {
  return new Promise((resolve, reject) => {
    const cachedPassword = sessionStorage.getItem(SESSION_PASSWORD_KEY);
    if (cachedPassword) {
      resolve(cachedPassword);
      return;
    }

    const content = `
            <p class="text-sm mb-2 text-gray-600 dark:text-gray-400">Для изменения общих списков требуется пароль.</p>
            <input type="password" id="auth-password-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Введите пароль" autocomplete="current-password">
        `;
    const passModal = new Modal({
      title: "Требуется авторизация",
      content: content,
      confirmText: "Подтвердить",
      onConfirm: () => {
        const input = document.getElementById("auth-password-input");
        if (input && input.value) {
          sessionStorage.setItem(SESSION_PASSWORD_KEY, input.value);
          resolve(input.value);
        } else {
          Toast.error("Пароль не введен.");
          reject("Пароль не введен.");
        }
      },
      onClose: () => {
        // Если модальное окно было просто закрыто (не подтверждено)
        if (!sessionStorage.getItem(SESSION_PASSWORD_KEY)) {
          reject(null); // Пользователь отменил ввод
        }
      },
    });
    passModal.open();
  });
}

/**
 * Очищает кэшированный пароль из sessionStorage.
 */
function clearCachedPassword() {
  sessionStorage.removeItem(SESSION_PASSWORD_KEY);
}

export default { hashPassword, requestPassword, clearCachedPassword };
