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
import ListManager from "./modules/listManager.js";

// --- Инициализация темы ---
Theme.init();

// --- Глобальное состояние и данные ---
const allHeroes = [
  { name: "Король Артур", set: "BoL: Vol 1" },
  { name: "Алиса", set: "BoL: Vol 1" },
  { name: "Медуза", set: "BoL: Vol 1" },
  { name: "Синдбад", set: "BoL: Vol 1" },
  { name: "Красная Шапочка", set: "Cobble & Fog" },
  { name: "Беовульф", set: "Cobble & Fog" },
  { name: "Дракула", set: "Cobble & Fog" },
  { name: "Человек-невидимка", set: "Cobble & Fog" },
  { name: "Ахиллес", set: "BoL: Vol 2" },
  { name: "Кровавая Мэри", set: "BoL: Vol 2" },
  { name: "Сунь Укун", set: "BoL: Vol 2" },
  { name: "Енанга", set: "BoL: Vol 2" },
];
let heroLists = {};

/**
 * Обновляет выпадающий список героев на главном экране.
 */
function updateHeroSelect() {
  const heroSelect = document.getElementById("hero-select");
  heroLists = Storage.loadHeroLists();
  const activeList = Storage.loadActiveList();
  const defaultList = Storage.loadDefaultList();
  const targetSelection = activeList || defaultList;

  heroSelect.innerHTML = ""; // Очищаем старые опции

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
 * Инициализирует состояние приложения при первой загрузке.
 * Создает список по умолчанию, если он не существует.
 */
function initializeAppState() {
  let lists = Storage.loadHeroLists();
  let defaultList = Storage.loadDefaultList();

  if (!lists || Object.keys(lists).length === 0) {
    const allHeroNames = allHeroes.map((h) => h.name);
    lists = { "Все герои": allHeroNames };
    defaultList = "Все герои";

    Storage.saveHeroLists(lists);
    Storage.saveDefaultList(defaultList);
    Storage.saveActiveList(defaultList);
    Toast.info("Создан стандартный список 'Все герои'");
  }

  heroLists = lists;
  updateHeroSelect();
}

// --- Обработчики событий ---
document.addEventListener("DOMContentLoaded", () => {
  // Переключение темы
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

  // Инициализация состояния приложения
  initializeAppState();

  // Кнопка настроек
  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      ListManager.show(allHeroes, Storage.loadHeroLists(), updateHeroSelect);
    });
  }

  // Кнопка генерации
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

      const heroesForGeneration = allHeroes.filter((hero) =>
        heroNamesInList.includes(hero.name)
      );
      const excludedHeroes = Storage.loadExcludedHeroes();

      const availableForGen = heroesForGeneration.filter(
        (h) => !excludedHeroes.includes(h.name)
      );
      if (availableForGen.length < 4) {
        Toast.error(
          `В списке "${selectedListName}" недостаточно героев для генерации (нужно минимум 4, доступно ${availableForGen.length}).`
        );
        return;
      }

      const generation = Generator.generateAll(
        heroesForGeneration,
        excludedHeroes
      );

      if (generation) {
        Storage.saveLastGeneration(generation);
        Toast.success("Команды сгенерированы!");
        Results.show(generation, allHeroes);
      } else {
        Toast.error("Не удалось сгенерировать команды!");
      }
    });
  }

  // Смена активного списка
  const heroSelect = document.getElementById("hero-select");
  if (heroSelect) {
    heroSelect.addEventListener("change", (e) => {
      Storage.saveActiveList(e.target.value);
    });
  }

  // Кнопка последней генерации
  const lastGenBtn = document.getElementById("last-gen-btn");
  if (lastGenBtn) {
    lastGenBtn.addEventListener("click", () => {
      const lastGen = Storage.loadLastGeneration();
      if (lastGen) {
        Results.show(lastGen, allHeroes);
      } else {
        Toast.info("Нет данных о последней генерации.");
      }
    });
  }

  // Кнопка сброса сессии
  const resetBtn = document.getElementById("reset-session-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      new Modal({
        type: "dialog",
        title: "Подтверждение",
        content:
          "Вы уверены, что хотите сбросить сессию? Данные о последней генерации и список исключенных героев будут удалены.",
        onConfirm: () => {
          Storage.clearSession();
          Toast.success("Сессия сброшена.");
        },
      }).open();
    });
  }
});
