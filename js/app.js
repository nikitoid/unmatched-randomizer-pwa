// --- Импорт модулей ---
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Theme from "./modules/theme.js";
import AppStorage from "./modules/storage.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/lists.js";

// --- Регистрация Service Worker ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service Worker registration failed:", err);
    });
  });
}

// --- Инициализация приложения ---
document.addEventListener("DOMContentLoaded", () => {
  const storage = new AppStorage();
  const listManager = new ListManager(storage);
  Theme.init();

  let lastGeneration = storage.get("lastGeneration");

  // --- Функции обновления UI ---
  const updateThemeIcons = () => {
    const themeIconLight = document.getElementById("theme-icon-light");
    const themeIconDark = document.getElementById("theme-icon-dark");
    if (!themeIconLight || !themeIconDark) return;
    if (document.documentElement.classList.contains("dark")) {
      themeIconLight.classList.add("hidden");
      themeIconDark.classList.remove("hidden");
    } else {
      themeIconLight.classList.remove("hidden");
      themeIconDark.classList.add("hidden");
    }
  };

  const updateActiveListDisplay = () => {
    const select = document.getElementById("hero-select");
    if (!select) return;

    const allLists = listManager.getLists();
    const activeListId = listManager.getActiveListId();

    select.innerHTML = allLists
      .map(
        (list) =>
          `<option value="${list.id}" ${
            list.id === activeListId ? "selected" : ""
          }>${list.name}</option>`
      )
      .join("");
  };

  // --- Первичная отрисовка ---
  updateThemeIcons();
  updateActiveListDisplay();

  // --- Обработчики событий ---
  window.addEventListener("listChanged", updateActiveListDisplay);

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    Theme.toggleTheme();
    updateThemeIcons();
  });

  document.getElementById("hero-select")?.addEventListener("change", (e) => {
    const selectedId = e.target.value;
    const list = listManager.getListById(selectedId);
    if (list && !list.isTemp) {
      listManager.setDefaultList(selectedId);
    }
    updateActiveListDisplay();
  });

  document.getElementById("settings-btn")?.addEventListener("click", () => {
    listManager.showManagementModal();
  });

  document
    .getElementById("generate-teams-btn")
    ?.addEventListener("click", () => {
      const activeList = listManager.getActiveList();
      if (!activeList || activeList.heroes.length < 4) {
        Toast.error("В активном списке должно быть не менее 4 героев.");
        return;
      }

      const generation = Generator.generateAll(activeList.heroes, []); // Исключения теперь обрабатываются через временные списки

      if (generation) {
        lastGeneration = generation;
        storage.set("lastGeneration", generation);
        Toast.success("Команды сгенерированы!");
        Results.show(generation, activeList.heroes, (excludedNames) => {
          listManager.createTempList(excludedNames);
          updateActiveListDisplay();
        });
      } else {
        Toast.error(
          "Недостаточно героев для генерации (с учетом исключенных)!"
        );
      }
    });

  document.getElementById("last-gen-btn")?.addEventListener("click", () => {
    if (lastGeneration) {
      const activeList = listManager.getActiveList();
      Results.show(lastGeneration, activeList.heroes, (excludedNames) => {
        listManager.createTempList(excludedNames);
        updateActiveListDisplay();
      });
    } else {
      Toast.info("Нет данных о последней генерации.");
    }
  });

  document
    .getElementById("reset-session-btn")
    ?.addEventListener("click", () => {
      new Modal({
        type: "dialog",
        title: "Подтверждение",
        content:
          "Сбросить сессию? Временные списки и последняя генерация будут удалены.",
        onConfirm: () => {
          storage.remove("lastGeneration");
          lastGeneration = null;
          listManager.clearTempLists();
          updateActiveListDisplay();
          Toast.success("Сессия сброшена.");
        },
      }).open();
    });
});
