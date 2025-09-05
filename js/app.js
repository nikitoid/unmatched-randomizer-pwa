// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker зарегистрирован успешно:", registration);
      })
      .catch((error) => {
        console.log("Ошибка регистрации Service Worker:", error);
      });
  });
}

// --- Импорт и использование модулей ---
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Theme from "./modules/theme.js";
import Storage from "./modules/storage.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/lists.js";

// --- Инициализация ---
Theme.init();
const listManager = new ListManager();

// --- UI Elements ---
const heroSelect = document.getElementById("hero-select");
const themeToggle = document.getElementById("theme-toggle");
const themeIconLight = document.getElementById("theme-icon-light");
const themeIconDark = document.getElementById("theme-icon-dark");
const settingsBtn = document.getElementById("settings-btn");
const generateBtn = document.getElementById("generate-teams-btn");
const lastGenBtn = document.getElementById("last-gen-btn");
const resetBtn = document.getElementById("reset-session-btn");

// --- UI Update Functions ---
function updateThemeIcons() {
  if (document.documentElement.classList.contains("dark")) {
    themeIconLight.classList.add("hidden");
    themeIconDark.classList.remove("hidden");
  } else {
    themeIconLight.classList.remove("hidden");
    themeIconDark.classList.add("hidden");
  }
}

function updateHeroSelect() {
  const lists = listManager.getLists().filter((l) => !l.isTemp);
  const activeList = listManager.getActiveList();

  heroSelect.innerHTML = ""; // Clear existing options

  if (lists.length === 0) {
    const option = document.createElement("option");
    option.textContent = "Нет списков";
    option.disabled = true;
    heroSelect.appendChild(option);
    return;
  }

  lists.forEach((list) => {
    const option = document.createElement("option");
    option.value = list.id;
    option.textContent = list.name;
    // An active list can be temporary, its parent is the one selected in the dropdown
    if (activeList?.isTemp) {
      if (list.id === activeList.parentList) {
        option.selected = true;
      }
    } else {
      if (list.id === activeList?.id) {
        option.selected = true;
      }
    }
    heroSelect.appendChild(option);
  });
}

// --- Обработчики событий ---
document.addEventListener("DOMContentLoaded", () => {
  // Initial UI setup
  updateThemeIcons();
  updateHeroSelect();

  // Переключение темы
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      Theme.toggleTheme();
    });
  }
  window.addEventListener("theme-changed", updateThemeIcons);

  // Обновление селектора списков после закрытия модального окна
  window.addEventListener("lists-changed", updateHeroSelect);

  // Установка списка по умолчанию при выборе
  heroSelect.addEventListener("change", (e) => {
    const selectedListId = e.target.value;
    listManager.setDefaultList(selectedListId);
    // We clear temp lists when user manually changes the main list
    listManager.clearTempLists();
  });

  // Кнопка настроек
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      listManager.showManagementModal();
    });
  }

  // Кнопка генерации
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const excludedHeroes = Storage.loadExcludedHeroes();
      const activeList = listManager.getActiveList();

      if (!activeList || activeList.heroes.length < 4) {
        Toast.error(
          "В активном списке недостаточно героев для генерации (нужно 4)."
        );
        return;
      }

      // The generator module expects an array of objects
      const heroData = activeList.heroes.map((name) => ({
        name,
        set: activeList.name,
      }));

      const generation = Generator.generateAll(heroData, excludedHeroes);

      if (generation) {
        Storage.saveLastGeneration(generation);
        Toast.success("Команды сгенерированы!");
        Results.show(generation, heroData);
      } else {
        Toast.error("Недостаточно героев для генерации!");
      }
    });
  }

  // Кнопка последней генерации
  if (lastGenBtn) {
    lastGenBtn.addEventListener("click", () => {
      const lastGen = Storage.loadLastGeneration();
      if (lastGen) {
        // Results.show needs the full hero list for reshuffling purposes.
        // We'll provide the heroes from the currently active list.
        const activeList = listManager.getActiveList();
        const heroData = activeList.heroes.map((name) => ({
          name,
          set: activeList.name,
        }));
        Results.show(lastGen, heroData);
      } else {
        Toast.info("Нет данных о последней генерации.");
      }
    });
  }

  // Кнопка сброса сессии
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      new Modal({
        type: "dialog",
        title: "Подтверждение",
        content:
          "Вы уверены, что хотите сбросить сессию? Данные о последней генерации и список исключенных героев будут удалены.",
        onConfirm: () => {
          Storage.clearSession();
          listManager.clearTempLists(); // Also clear temporary lists from session
          updateHeroSelect(); // Update UI
          Toast.success("Сессия сброшена.");
        },
      }).open();
    });
  }
});
