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

let firebaseSyncStarted = false; // Флаг для предотвращения повторного запуска

// --- Логика обновления Service Worker ---
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker зарегистрирован:", registration);

          // Если нет нового SW в ожидании или установке, можно безопасно синхронизироваться
          if (!registration.installing && !registration.waiting) {
            console.log(
              "Обновление Service Worker не найдено. Запускаем синхронизацию."
            );
            startFirebaseSync();
          }

          registration.addEventListener("updatefound", () => {
            console.log("Найден новый Service Worker, начинается установка...");
            // Показываем спиннер, но НЕ запускаем синхронизацию.
            // Слушатель 'controllerchange' обработает перезагрузку.
            document
              .getElementById("update-spinner")
              ?.classList.remove("invisible");
          });
        })
        .catch((error) => {
          console.log("Ошибка регистрации Service Worker:", error);
          // Если SW не удалось зарегистрировать, все равно пытаемся синхронизироваться.
          startFirebaseSync();
        });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Это событие срабатывает, когда новый SW взял управление.
      // Самый надежный способ применить все обновления кэша - перезагрузить страницу.
      if (navigator.serviceWorker.controller) {
        console.log(
          "Новый Service Worker активирован. Перезагрузка для применения обновления."
        );
        Toast.success("Приложение обновлено! Перезагрузка...");
        // Даем время на отображение уведомления перед перезагрузкой.
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  } else {
    console.log("Service Worker не поддерживается. Запускаем синхронизацию.");
    startFirebaseSync();
  }
}

// --- Глобальное состояние и данные ---
let heroLists = {};

// --- Иконки для статуса БД ---
const dbStatusIcons = {
  connecting: `<svg class="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`,
  connected: `<svg class="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
  error: `<svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
};

function updateDbStatusIndicator(status) {
  const dbStatusEl = document.getElementById("db-status");
  if (dbStatusEl) dbStatusEl.innerHTML = dbStatusIcons[status] || "";
}

function updateHeroSelect() {
  const heroSelect = document.getElementById("hero-select");
  heroLists = Storage.loadHeroLists() || {};
  const activeList = Storage.loadActiveList();
  const defaultList = Storage.loadDefaultList();
  let targetSelection = activeList || defaultList || Object.keys(heroLists)[0];
  if (!heroLists[targetSelection]) {
    targetSelection = Object.keys(heroLists)[0];
  }
  Storage.saveActiveList(targetSelection);

  heroSelect.innerHTML = "";
  const generateBtn = document.getElementById("generate-teams-btn");

  if (Object.keys(heroLists).length === 0) {
    heroSelect.innerHTML = `<option disabled>Списки не найдены</option>`;
    generateBtn.disabled = true;
  } else {
    for (const listName in heroLists) {
      const option = document.createElement("option");
      option.value = listName;
      option.textContent = listName;
      if (listName === targetSelection) option.selected = true;
      heroSelect.appendChild(option);
    }
    generateBtn.disabled = false;
  }
}

function initializeAppState() {
  heroLists = Storage.loadHeroLists() || {};
  updateHeroSelect();
}

function startFirebaseSync() {
  if (firebaseSyncStarted) return;
  firebaseSyncStarted = true;
  console.log("Запускаем синхронизацию с Firebase...");

  if (navigator.onLine) {
    Toast.info("Синхронизация с облаком...");
    updateDbStatusIndicator("connecting");
    Firebase.syncLists((isSuccess) => {
      if (isSuccess) {
        updateDbStatusIndicator("connected");
        Toast.success("Данные синхронизированы.");
      } else {
        updateDbStatusIndicator("error");
        Toast.warning("Не удалось получить данные из облака.");
      }
      initializeAppState();
    });
  } else {
    updateDbStatusIndicator("error");
    Toast.warning("Нет сети. Работа в офлайн-режиме.");
    initializeAppState();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeAppState();
  registerServiceWorker();

  Theme.init();
  const themeToggle = document.getElementById("theme-toggle");
  const updateThemeIcons = () => {
    const isDark = document.documentElement.classList.contains("dark");
    document
      .getElementById("theme-icon-light")
      ?.classList.toggle("hidden", isDark);
    document
      .getElementById("theme-icon-dark")
      ?.classList.toggle("hidden", !isDark);
  };
  if (themeToggle) themeToggle.addEventListener("click", Theme.toggleTheme);
  window.addEventListener("theme-changed", updateThemeIcons);
  updateThemeIcons();

  window.addEventListener("online", startFirebaseSync);
  window.addEventListener("offline", () => updateDbStatusIndicator("error"));

  document.getElementById("settings-btn")?.addEventListener("click", () => {
    ListManager.show(Storage.loadHeroLists(), initializeAppState);
  });

  document
    .getElementById("generate-teams-btn")
    ?.addEventListener("click", () => {
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
      const generation = Generator.generateAll(heroesForGeneration);
      if (generation) {
        Storage.saveLastGeneration(generation);
        Toast.success("Команды сгенерированы!");
        const allUniqueHeroNames = [
          ...new Set(Object.values(heroLists).flat()),
        ];
        Results.show(
          generation,
          allUniqueHeroNames.map((name) => ({ name })),
          initializeAppState
        );
      } else {
        Toast.error("Не удалось сгенерировать команды!");
      }
    });

  document.getElementById("hero-select")?.addEventListener("change", (e) => {
    Storage.saveActiveList(e.target.value);
  });

  document.getElementById("last-gen-btn")?.addEventListener("click", () => {
    const lastGen = Storage.loadLastGeneration();
    if (lastGen) {
      const allHeroNames = [
        ...new Set(Object.values(Storage.loadHeroLists() || {}).flat()),
      ];
      Results.show(
        lastGen,
        allHeroNames.map((name) => ({ name })),
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
