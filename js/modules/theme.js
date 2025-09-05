/**
 * Класс для управления темой (светлая/темная).
 * Сохраняет выбор пользователя в localStorage.
 */
export default class Theme {
  constructor() {
    this.themeToggleBtn = document.getElementById("theme-toggle");
    this.sunIcon = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m8.66-15.66l-.7.7M4.04 19.96l-.7.7M21 12h-1M4 12H3m15.66 8.66l-.7-.7M4.04 4.04l-.7-.7M12 18a6 6 0 100-12 6 6 0 000 12z"></path>
            </svg>`;
    this.moonIcon = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>`;

    this.init();
  }

  init() {
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      this.themeToggleBtn.innerHTML = this.sunIcon;
    } else {
      document.documentElement.classList.remove("dark");
      this.themeToggleBtn.innerHTML = this.moonIcon;
    }
  }

  toggle() {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
      this.themeToggleBtn.innerHTML = this.moonIcon;
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
      this.themeToggleBtn.innerHTML = this.sunIcon;
    }
  }
}
