// --- Импорт и использование модулей ---
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Theme from "./modules/theme.js";
import Storage from "./modules/storage.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/listManager.js";
import Firebase from "./modules/firebase.js";

// --- Инициализация темы ---
Theme.init();

let isSWUpdateComplete = false;

// --- Логика обновления Service Worker ---
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker зарегистрирован:", registration);

          // Если уже есть активный SW, значит, обновление не требуется при первой загрузке
          if (registration.active) {
            isSWUpdateComplete = true;
          }

          registration.addEventListener("updatefound", () => {
            console.log("Найден новый Service Worker, начинается установка...");
            const spinner = document.getElementById("update-spinner");
            if (spinner) spinner.classList.remove("invisible");
          });
        })
        .catch((error) => {
          console.log("Ошибка регистрации Service Worker:", error);
        });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (navigator.serviceWorker.controller) {
        console.log(
          "Контроллер Service Worker изменился, обновление завершено."
        );
        isSWUpdateComplete = true; // --- Флаг завершения обновления
        const spinner = document.getElementById("update-spinner");
        if (spinner) spinner.classList.add("invisible");
        Toast.success("Приложение обновлено!");
        startFirebaseSync(); // --- Запускаем синхронизацию ПОСЛЕ обновления
      }
    });
  } else {
    console.log("Service Worker не поддерживается, обновление не требуется.");
    isSWUpdateComplete = true; // Если SW не поддерживается, считаем "обновление" завершенным
  }
}

// --- Глобальное состояние и данные ---
let heroLists = {};
let isInitialSyncDone = false;

// --- Иконки для статуса БД ---
const dbStatusIcons = {
  connecting: `<svg class="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`,
  connected: `<svg class="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
  error: `<svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
};

/**
 * Обновляет иконку статуса подключения к БД
 * @param {'connecting' | 'connected' | 'error' | 'hidden'} status
 */
function updateDbStatusIndicator(status) {
  const dbStatusEl = document.getElementById("db-status");
  if (!dbStatusEl) return;
  if (status === "hidden") {
    dbStatusEl.innerHTML = "";
  } else {
    dbStatusEl.innerHTML = dbStatusIcons[status] || "";
  }
}

/**
 * Обновляет выпадающий список героев на главном экране.
 */
function updateHeroSelect() {
  const heroSelect = document.getElementById("hero-select");
  heroLists = Storage.loadHeroLists() || {};
  const activeList = Storage.loadActiveList();
  const defaultList = Storage.loadDefaultList();

  let targetSelection = activeList;
  if (!heroLists[targetSelection]) {
    targetSelection = defaultList;
    if (!heroLists[targetSelection]) {
      targetSelection = Object.keys(heroLists)[0];
    }
    Storage.saveActiveList(targetSelection);
  }

  heroSelect.innerHTML = "";
  if (Object.keys(heroLists).length === 0) {
    const option = document.createElement("option");
    option.textContent = "Списки не найдены";
    option.disabled = true;
    heroSelect.appendChild(option);
    document.getElementById("generate-teams-btn").disabled = true;
    return;
  }
  document.getElementById("generate-teams-btn").disabled = false;

  for (const listName in heroLists) {
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
 * Инициализирует состояние приложения при загрузке.
 */
function initializeAppState() {
  heroLists = Storage.loadHeroLists();
  let defaultList = Storage.loadDefaultList();

  if (!heroLists || Object.keys(heroLists).length === 0) {
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
    heroLists = { "Стартовый набор": starterHeroes };
    defaultList = "Стартовый набор";
    Storage.saveHeroLists(heroLists);
    Storage.saveDefaultList(defaultList);
    Storage.saveActiveList(defaultList);
    Toast.info("Создан стартовый набор героев.");
  }
  updateHeroSelect();
}

// --- Логика синхронизации с Firebase ---
function startFirebaseSync() {
  if (!isSWUpdateComplete) {
    console.log(
      "Запуск синхронизации отложен: обновление Service Worker еще не завершено."
    );
    return;
  }

  if (navigator.onLine) {
    if (!isInitialSyncDone) {
      Toast.info("Синхронизация с облаком...");
      updateDbStatusIndicator("connecting");
    }

    Firebase.syncLists((isSuccess) => {
      if (isSuccess) {
        updateDbStatusIndicator("connected");
        if (isInitialSyncDone) {
          Toast.success("Данные обновлены из облака.");
        } else {
          Toast.success("Данные синхронизированы.");
          isInitialSyncDone = true;
        }
        initializeAppState(); // Перезагружаем UI с объединенными данными
      } else {
        updateDbStatusIndicator("error");
        if (!isInitialSyncDone) {
          Toast.warning("Не удалось получить данные из облака.");
        }
      }
    });
  } else {
    updateDbStatusIndicator("error");
    Toast.warning("Нет сети. Работа в офлайн-режиме.");
  }
}

// --- Обработчики событий ---
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();

  Theme.init();
  const themeToggle = document.getElementById("theme-toggle");
  const updateThemeIcons = () => {
    const isDark = document.documentElement.classList.contains("dark");
    document
      .getElementById("theme-icon-light")
      .classList.toggle("hidden", isDark);
    document
      .getElementById("theme-icon-dark")
      .classList.toggle("hidden", !isDark);
  };
  if (themeToggle) themeToggle.addEventListener("click", Theme.toggleTheme);
  window.addEventListener("theme-changed", updateThemeIcons);
  updateThemeIcons();

  initializeAppState();

  // Отложенный запуск, чтобы дать SW время на первоначальную регистрацию
  setTimeout(() => {
    if (isSWUpdateComplete) {
      startFirebaseSync();
    }
  }, 1000);

  window.addEventListener("online", startFirebaseSync);
  window.addEventListener("offline", () => updateDbStatusIndicator("error"));

  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      ListManager.show(Storage.loadHeroLists(), initializeAppState);
    });
  }

  const generateBtn = document.getElementById("generate-teams-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const selectedListName = document.getElementById("hero-select").value;
      const heroNamesInList = heroLists[selectedListName];
      if (!heroNamesInList) {
        Toast.error("Выберите корректный список.");
        return;
      }

      const heroesForGeneration = heroNamesInList.map((name) => ({ name }));
      if (heroesForGeneration.length < 4) {
        Toast.error(
          `В списке "${selectedListName}" мало героев (нужно 4, есть ${heroesForGeneration.length}).`
        );
        return;
      }
      const generation = Generator.generateAll(heroesForGeneration, []);
      if (generation) {
        Storage.saveLastGeneration(generation);
        Toast.success("Команды сгенерированы!");
        const allUniqueHeroNames = [
          ...new Set(Object.values(heroLists).flat()),
        ];
        const allUniqueHeroes = allUniqueHeroNames.map((name) => ({ name }));
        Results.show(generation, allUniqueHeroes, initializeAppState);
      } else {
        Toast.error("Не удалось сгенерировать команды!");
      }
    });
  }

  document.getElementById("hero-select")?.addEventListener("change", (e) => {
    Storage.saveActiveList(e.target.value);
  });

  document.getElementById("last-gen-btn")?.addEventListener("click", () => {
    const lastGen = Storage.loadLastGeneration();
    if (lastGen) {
      const allUniqueHeroNames = [
        ...new Set(Object.values(Storage.loadHeroLists() || {}).flat()),
      ];
      Results.show(
        lastGen,
        allUniqueHeroNames.map((name) => ({ name })),
        initializeAppState
      );
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
          "Сбросить сессию? Все временные списки (с пометкой 'искл.') будут удалены.",
        onConfirm: () => {
          Storage.clearSession();
          initializeAppState();
          Toast.success("Сессия сброшена.");
        },
      }).open();
    });
});
