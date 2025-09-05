/**
 * Модуль для управления темой (светлая/темная).
 * Сохраняет выбор пользователя в localStorage.
 */
const themeKey = "randomatched-theme";

const applyTheme = (theme) => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  // Отправляем событие для обновления UI в других компонентах
  window.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme } }));
};

const getSavedTheme = () => {
  return localStorage.getItem(themeKey);
};

const saveTheme = (theme) => {
  localStorage.setItem(themeKey, theme);
};

const toggleTheme = () => {
  const currentTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  saveTheme(newTheme);
};

const init = () => {
  const savedTheme = getSavedTheme();
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Применяем тему: сохраненная > системная > светлая по умолчанию
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (systemPrefersDark) {
    applyTheme("dark");
  } else {
    applyTheme("light");
  }

  // Слушаем изменения системной темы, если пользователь не выбрал свою
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!getSavedTheme()) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
};

export default { init, toggleTheme };
