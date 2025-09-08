// --- Импорт и использование модулей ---
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Theme from "./modules/theme.js";
import Storage from "./modules/storage.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/listManager.js";

// --- Инициализация темы ---
Theme.init();

// --- Меню ---
function initializeMenu() {
  const menuToggleBtn = document.getElementById("menu-toggle-btn");
  const menuDrawer = document.getElementById("menu-drawer");
  const menuOverlay = document.getElementById("menu-overlay");
  const appContainer = document.getElementById("app-container");

  const openMenu = () => {
    menuDrawer.classList.add("open");
    menuOverlay.classList.add("visible");
    appContainer.classList.add("menu-open");
  };

  const closeMenu = () => {
    menuDrawer.classList.remove("open");
    menuOverlay.classList.remove("visible");
    appContainer.classList.remove("menu-open");
  };

  if (menuToggleBtn) menuToggleBtn.addEventListener("click", openMenu);
  if (menuOverlay) menuOverlay.addEventListener("click", closeMenu);

  // Закрывать меню при клике на любой пункт
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", closeMenu);
  });
}

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
 * Рендерит списки героев в основном контенте.
 */
function renderHeroLists() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

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

  mainContent.innerHTML = ""; // Очищаем содержимое

  if (Object.keys(heroLists).length === 0) {
    mainContent.innerHTML = `<div class="placeholder">Списки не найдены. Создайте новый в настройках.</div>`;
    document.getElementById("generate-teams-btn").disabled = true;
    return;
  }

  document.getElementById("generate-teams-btn").disabled = false;

  const listContainer = document.createElement("div");
  listContainer.className = "list-container";

  for (const listName in heroLists) {
    const listItem = document.createElement("div");
    listItem.className = "list-item";
    if (listName === targetSelection) {
      listItem.classList.add("active");
    }
    listItem.dataset.listName = listName;

    listItem.innerHTML = `
      <div class="list-item-icon">
        <svg fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z"></path></svg>
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${listName}</div>
        <div class="list-item-subtitle">${heroLists[listName].length} героев</div>
      </div>
      <div class="list-item-active-indicator"></div>
    `;

    listItem.addEventListener("click", () => {
      Storage.saveActiveList(listName);
      renderHeroLists(); // Перерисовываем, чтобы обновить активный элемент
    });
    listContainer.appendChild(listItem);
  }

  mainContent.appendChild(listContainer);
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
  renderHeroLists();
}

// --- Обработчики событий ---
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker(); // Запускаем логику SW
  initializeMenu(); // Инициализируем меню

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
      ListManager.show(Storage.loadHeroLists(), initializeAppState);
    });
  }

  const generateBtn = document.getElementById("generate-teams-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const selectedListName = Storage.loadActiveList();
      if (!selectedListName) {
        Toast.error("Активный список не выбран.");
        return;
      }
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
