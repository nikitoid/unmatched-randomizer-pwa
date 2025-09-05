import Theme from "./modules/theme.js";
import Storage from "./modules/storage.js";
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/lists.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- Инициализация модулей ---
  const storage = new Storage("randomatched_");
  const listManager = new ListManager(storage);

  // --- Глобальные переменные ---
  let lastGeneration = storage.getItem("lastGeneration", null);

  // --- Инициализация темы (с проверкой) ---
  const themeToggleBtn = document.getElementById("theme-toggle");
  let theme;
  if (themeToggleBtn) {
    theme = new Theme();
  } else {
    console.error(
      "Кнопка смены темы не найдена! Модуль Theme не будет инициализирован."
    );
  }

  // --- Функции обновления UI ---
  function updateActiveListDisplay() {
    const activeList = listManager.getActiveList();
    const listNameEl = document.getElementById("current-list-name");
    if (listNameEl && activeList) {
      listNameEl.textContent = activeList.name;
    }
  }

  // --- Инициализация UI ---
  updateActiveListDisplay();

  // --- Обработчики событий ---
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => theme.toggle());
  }

  document.getElementById("settings-btn").addEventListener("click", () => {
    listManager.showManagementModal();
  });

  document.getElementById("generate-btn").addEventListener("click", () => {
    const activeList = listManager.getActiveList();
    if (!activeList || activeList.heroes.length < 4) {
      new Toast().error(
        "Недостаточно героев в списке для генерации (нужно минимум 4)."
      );
      return;
    }

    const generator = new Generator(activeList.heroes);
    const result = generator.generateAll();
    lastGeneration = result;
    storage.setItem("lastGeneration", lastGeneration);

    const resultsManager = new Results({
      ...result,
      generator: generator, // Передаем сам генератор
      onRegenerate: (newResult) => {
        lastGeneration = newResult;
        storage.setItem("lastGeneration", lastGeneration);
      },
    });
    resultsManager.show();
  });

  document.getElementById("last-gen-btn").addEventListener("click", () => {
    if (lastGeneration) {
      const activeList = listManager.getActiveList();
      const generator = new Generator(activeList.heroes);

      const resultsManager = new Results({
        ...lastGeneration,
        generator: generator,
        onRegenerate: (newResult) => {
          lastGeneration = newResult;
          storage.setItem("lastGeneration", lastGeneration);
        },
      });
      resultsManager.show();
    } else {
      new Toast().info("Сначала сгенерируйте команды.");
    }
  });

  document.getElementById("reset-session-btn").addEventListener("click", () => {
    new Modal({
      title: "Сброс сессии",
      content: "Вы уверены, что хотите сбросить временные списки исключений?",
      onConfirm: () => {
        listManager.clearTempLists();
        updateActiveListDisplay();
      },
    }).open();
  });
});
