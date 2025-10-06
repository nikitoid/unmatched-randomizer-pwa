// --- Импорт и использование модулей ---
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Theme from "./modules/theme.js";
import Storage from "./modules/storage.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/listManager.js";

import { initFirebase } from "./modules/firebase.js";
import FirebaseManager from "./modules/firebase-manager.js";
import OfflineManager from "./modules/offline-manager.js";
import CloudListManager from "./modules/cloud-list-manager.js";

// --- Инициализация Firebase ---
const firebaseInstances = initFirebase();
let firebaseManager = null;
let offlineManager = null;
let cloudListManager = null;

if (firebaseInstances) {
  firebaseManager = new FirebaseManager(firebaseInstances.database);
  offlineManager = new OfflineManager(firebaseManager);
  offlineManager.init(); // Инициализируем OfflineManager
  cloudListManager = new CloudListManager(firebaseManager, offlineManager);

  // --- Обновление индикатора статуса сети ---
  function updateNetworkStatusIndicator(isConnected) {
    const statusElement = document.getElementById("network-status-text");
    const iconElement = document.getElementById("network-status-icon");
    if (!statusElement || !iconElement) return;

    if (isConnected) {
      statusElement.textContent = "Синхронизировано";
      statusElement.className = "ml-1 text-green-500"; // Зеленый цвет при подключении
      iconElement.innerHTML = "☁️"; // Обычная иконка облака
    } else {
      statusElement.textContent = "Офлайн";
      statusElement.className = "ml-1 text-gray-500"; // Серый цвет при отключении
      iconElement.innerHTML = "☁️"; // Иконка облака с предупреждением
    }
  }

  // Инициализируем состояние при загрузке
  updateNetworkStatusIndicator(offlineManager.checkConnection());

  // Подписываемся на изменения статуса в OfflineManager
  offlineManager.onStatusChange(updateNetworkStatusIndicator);
}

// --- Инициализация темы ---
Theme.init();

// --- Логика обновления Service Worker ---
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker зарегистрирован:", registration);

          // Показываем спиннер при обнаружении нового SW
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

    // Слушаем событие, когда новый SW берет управление на себя.
    // Это инициирует перезагрузку для применения обновления.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Убеждаемся, что это не первоначальная установка, а именно обновление
      if (navigator.serviceWorker.controller) {
        console.log(
          "Контроллер Service Worker изменился, инициирую перезагрузку."
        );
        // Устанавливаем флаг, чтобы показать уведомление после перезагрузки
        sessionStorage.setItem("appUpdated", "true");
        window.location.reload();
      }
    });
  }
}

// --- Глобальное состояние и данные ---
let heroLists = {};

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

// --- Обработчики событий ---
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker(); // Запускаем логику SW

  // Проверяем, было ли обновление, и показываем уведомление
  if (sessionStorage.getItem("appUpdated") === "true") {
    Toast.success("Приложение обновлено!");
    sessionStorage.removeItem("appUpdated");
  }

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

  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      ListManager.show(
        Storage.loadHeroLists(),
        initializeAppState,
        cloudListManager
      );
    });
  }

  const generateBtn = document.getElementById("generate-teams-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const heroSelect = document.getElementById("hero-select");
      const selectedListName = heroSelect.value;
      const heroNamesInList = heroLists[selectedListName];

      if (!heroNamesInList) {
        Toast.error("Пожалуйста, выберите корректный список.");
        return;
      }

      const heroesForGeneration = heroNamesInList.map((name) => ({ name }));

      if (heroesForGeneration.length < 4) {
        Toast.error(
          `В списке "${selectedListName}" недостаточно героев для генерации (нужно минимум 4, доступно ${heroesForGeneration.length}).`
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

  const heroSelect = document.getElementById("hero-select");
  if (heroSelect) {
    heroSelect.addEventListener("change", (e) => {
      Storage.saveActiveList(e.target.value);
    });
  }

  const lastGenBtn = document.getElementById("last-gen-btn");
  if (lastGenBtn) {
    lastGenBtn.addEventListener("click", () => {
      const lastGen = Storage.loadLastGeneration();
      if (lastGen) {
        const currentHeroLists = Storage.loadHeroLists() || {};
        const allUniqueHeroNames = [
          ...new Set(Object.values(currentHeroLists).flat()),
        ];
        const allUniqueHeroes = allUniqueHeroNames.map((name) => ({ name }));
        Results.show(lastGen, allUniqueHeroes, initializeAppState);
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
          "Вы уверены, что хотите сбросить сессию? Все временные списки (с пометкой 'искл.') и последняя генерация будут удалены.",
        onConfirm: () => {
          Storage.clearSession(); // Новая логика теперь здесь
          initializeAppState(); // Обновляем UI
          Toast.success("Сессия сброшена.");
        },
      }).open();
    });
  }
});
