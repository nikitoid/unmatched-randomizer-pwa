import Modal from "./modal.js";

const SESSION_PASSWORD_KEY = "session-password";

/**
 * Хэширует строку с использованием SHA-256.
 * @param {string} string - Входная строка.
 * @returns {Promise<string>} - Хэш в виде hex-строки.
 */
async function hashSHA256(string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Запрашивает пароль у пользователя, если его нет в кэше сессии.
 * @returns {Promise<string>} - Promise, который разрешается с паролем.
 */
function requestPassword() {
  return new Promise((resolve, reject) => {
    const cachedPassword = sessionStorage.getItem(SESSION_PASSWORD_KEY);
    if (cachedPassword) {
      resolve(cachedPassword);
      return;
    }

    const content = `
            <p class="text-sm mb-2 text-gray-600 dark:text-gray-400">Для выполнения этого действия требуется пароль.</p>
            <input type="password" id="sync-password-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Введите пароль">
        `;

    new Modal({
      title: "Требуется аутентификация",
      content: content,
      confirmText: "Подтвердить",
      onConfirm: () => {
        const input = document.getElementById("sync-password-input");
        const password = input ? input.value : "";
        if (password) {
          sessionStorage.setItem(SESSION_PASSWORD_KEY, password);
          resolve(password);
        } else {
          reject("Пароль не введен.");
        }
      },
      onClose: () => {
        reject("Окно было закрыто.");
      },
    }).open();
  });
}

export default {
  hashSHA256,
  requestPassword,
};
