// --- Импорт и использование модулей ---
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Theme from "./modules/theme.js";
import Storage from "./modules/storage.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/listManager.js";
import Firebase from "./modules/firebase.js";

// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) =>
        console.log("Ошибка регистрации Service Worker:", error)
      );
  });
}

// --- Инициализация темы ---
Theme.init();

// --- Глобальное состояние ---
let heroLists = {};

/**
 * Обновляет UI индикатора статуса сети.
 */
function updateOnlineStatus() {
  const indicator = document.getElementById("sync-status-indicator");
  if (!indicator) return;

  if (navigator.onLine) {
    indicator.innerHTML = `<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    indicator.title = "Онлайн. Изменения будут синхронизированы.";
  } else {
    indicator.innerHTML = `<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    indicator.title = "Офлайн. Изменения сохраняются локально.";
  }
}

/**
 * Перезагружает данные из Storage и обновляет UI.
 */
function refreshUI() {
  const appData = Storage.getFullData();
  heroLists = appData.lists || {};
  updateHeroSelect();
}

/**
 * Обновляет выпадающий список героев на главном экране.
 */
function updateHeroSelect() {
  const heroSelect = document.getElementById("hero-select");
  const appData = Storage.getFullData();
  const currentHeroLists = appData.lists || {};
  const activeList = appData.activeList;
  const defaultList = appData.defaultList;

  let targetSelection = activeList;
  if (!currentHeroLists[targetSelection]) {
    targetSelection = defaultList;
    if (!currentHeroLists[targetSelection]) {
      targetSelection = Object.keys(currentHeroLists)[0];
    }
    Storage.saveActiveList(targetSelection);
  }

  heroSelect.innerHTML = "";

  if (Object.keys(currentHeroLists).length === 0) {
    heroSelect.innerHTML = `<option disabled>Списки не найдены</option>`;
    document.getElementById("generate-teams-btn").disabled = true;
    return;
  }

  document.getElementById("generate-teams-btn").disabled = false;

  for (const listName in currentHeroLists) {
    const option = document.createElement("option");
    option.value = listName;
    option.textContent = listName;
    if (listName === targetSelection) {
      option.selected = true;
    }
    heroSelect.appendChild(option);
  }
}

/**
 * Инициализирует состояние приложения.
 */
function initializeAppState() {
  let appData = Storage.getFullData();

  if (!appData || !appData.lists || Object.keys(appData.lists).length === 0) {
    const starterHeroes = [
      "Король Артур",
      "Алиса",
      "Медуза",
      "Синдбад",
      "Красная Шапочка",
      "Беовульф",
      "Дракула",
      "Человек-невидимка",
      "Ахиллес",
      "Кровавая Мэри",
      "Сунь Укун",
      "Енанга",
    ];
    const starterListName = "Стартовый набор";
    appData = {
      lists: { [starterListName]: starterHeroes },
      defaultList: starterListName,
      activeList: starterListName,
      originalMap: {},
    };
    Storage.setFullData(appData);
    Toast.info("Создан стартовый набор героев.");
  }

  heroLists = appData.lists;
  refreshUI();
  updateOnlineStatus();

  // Фоновая синхронизация после инициализации
  setTimeout(() => {
    if (navigator.onLine) {
      Firebase.syncLists().then((wasUpdated) => {
        if (wasUpdated) {
          refreshUI();
        }
      });
    }
  }, 1000); // Небольшая задержка для инициализации Firebase
}

// --- Обработчики событий ---
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const themeIconLight = document.getElementById("theme-icon-light");
  const themeIconDark = document.getElementById("theme-icon-dark");

  const updateThemeIcons = () => {
    if (document.documentElement.classList.contains("dark")) {
      themeIconLight.classList.add("hidden");
      themeIconDark.classList.remove("hidden");
    } else {
      themeIconLight.classList.remove("hidden");
      themeIconDark.classList.add("hidden");
    }
  };

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      Theme.toggleTheme();
      updateThemeIcons();
    });
  }
  updateThemeIcons();
  window.addEventListener("theme-changed", updateThemeIcons);

  initializeAppState();

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      ListManager.show(refreshUI);
    });
  }

  const generateBtn = document.getElementById("generate-teams-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const selectedListName = document.getElementById("hero-select").value;
      const currentHeroLists = Storage.loadHeroLists();
      const heroNamesInList = currentHeroLists[selectedListName];

      if (!heroNamesInList) {
        Toast.error("Пожалуйста, выберите корректный список.");
        return;
      }
      if (heroNamesInList.length < 4) {
        Toast.error(`В списке "${selectedListName}" нужно минимум 4 героя.`);
        return;
      }

      const heroesForGeneration = heroNamesInList.map((name) => ({ name }));
      const generation = Generator.generateAll(heroesForGeneration, []);

      if (generation) {
        Storage.saveLastGeneration(generation);
        Toast.success("Команды сгенерированы!");
        Results.show(generation, heroesForGeneration, refreshUI);
      } else {
        Toast.error("Не удалось сгенерировать команды!");
      }
    });
  }

  const heroSelect = document.getElementById("hero-select");
  if (heroSelect) {
    heroSelect.addEventListener("change", (e) =>
      Storage.saveActiveList(e.target.value)
    );
  }

  const lastGenBtn = document.getElementById("last-gen-btn");
  if (lastGenBtn) {
    lastGenBtn.addEventListener("click", () => {
      const lastGen = Storage.loadLastGeneration();
      if (lastGen) {
        const activeListHeroesRaw =
          Storage.loadHeroLists()[Storage.loadActiveList()] || [];
        const heroesForDisplay = activeListHeroesRaw.map((name) => ({ name }));
        Results.show(lastGen, heroesForDisplay, refreshUI);
      } else {
        Toast.info("Нет данных о последней генерации.");
      }
    });
  }

  const resetBtn = document.getElementById("reset-session-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      new Modal({
        type: "dialog",
        title: "Подтверждение",
        content:
          "Вы уверены, что хотите сбросить сессию? Все временные списки будут удалены.",
        onConfirm: () => {
          Storage.clearSession();
          refreshUI();
          Toast.success("Сессия сброшена.");
        },
      }).open();
    });
  }
});
