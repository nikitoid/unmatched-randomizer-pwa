// --- Импорт и использование модулей ---
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Theme from "./modules/theme.js";
import Storage from "./modules/storage.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/listManager.js";
import { firebaseManager } from "./modules/firebase.js";

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
    // Это надежный способ узнать, что обновление завершено.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Убеждаемся, что это не первоначальная установка, а именно обновление
      if (navigator.serviceWorker.controller) {
        console.log(
          "Контроллер Service Worker изменился, обновление завершено."
        );
        const spinner = document.getElementById("update-spinner");
        if (spinner) spinner.classList.add("invisible");
        Toast.success("Приложение обновлено!");
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
 * Миграция не требуется, сразу работаем с новым форматом.
 */
function initializeAppState() {
  heroLists = Storage.loadHeroLists();
  let defaultList = Storage.loadDefaultList();

  // Если списков нет, создаем стартовый набор.
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
    // Сразу создаем в новом формате.
    heroLists = {
      "Стартовый набор": { heroes: starterHeroes, type: "local" },
    };
    defaultList = "Стартовый набор";

    // Сохраняем.
    Storage.saveHeroLists(heroLists);
    Storage.saveDefaultList(defaultList);
    Storage.saveActiveList(defaultList);
    Toast.info("Создан стартовый набор героев.");
  }

  updateHeroSelect();
}

// --- Обработчики событий ---
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Динамически импортируем Firebase SDK, загруженный через CDN
    const firebaseApp = await import(
      "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js"
    );
    const firestore = await import(
      "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js"
    );

    // Инициализируем Firebase с загруженными модулями
    firebaseManager.init(firebaseApp, firestore);
  } catch (error) {
    console.error("Не удалось загрузить Firebase SDK:", error);
    Toast.error("Ошибка загрузки облачных сервисов.");
  }

  registerServiceWorker(); // Запускаем логику SW

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
      const heroSelect = document.getElementById("hero-select");
      const selectedListName = heroSelect.value;
      const listData = heroLists[selectedListName];

      if (!listData || !listData.heroes) {
        Toast.error("Пожалуйста, выберите корректный список.");
        return;
      }

      const heroesForGeneration = listData.heroes.map((name) => ({ name }));

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
          ...new Set(
            Object.values(heroLists)
              .map((list) => list.heroes)
              .flat()
          ),
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
          ...new Set(
            Object.values(currentHeroLists)
              .map((list) => list.heroes)
              .flat()
          ),
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
