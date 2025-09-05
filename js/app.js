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

// --- Инициализация темы ---
Theme.init();

// --- Данные о героях (временно) ---
const HERO_DATA = [
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
  updateThemeIcons(); // Обновляем иконку при загрузке
  window.addEventListener("theme-changed", updateThemeIcons); // Обновляем при системных изменениях

  // Кнопка настроек
  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      new Modal({
        type: "bottom-sheet",
        title: "Настройки",
        content: "<p>Здесь будут настройки списков героев.</p>",
        confirmText: "Сохранить",
      }).open();
    });
  }

  // Кнопка генерации
  const generateBtn = document.getElementById("generate-teams-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const excludedHeroes = Storage.loadExcludedHeroes();
      const generation = Generator.generateAll(HERO_DATA, excludedHeroes);

      if (generation) {
        Storage.saveLastGeneration(generation);
        Toast.success("Команды сгенерированы!");
        Results.show(generation, HERO_DATA);
      } else {
        Toast.error("Недостаточно героев для генерации!");
      }
    });
  }

  // Кнопка последней генерации
  const lastGenBtn = document.getElementById("last-gen-btn");
  if (lastGenBtn) {
    lastGenBtn.addEventListener("click", () => {
      const lastGen = Storage.loadLastGeneration();
      if (lastGen) {
        Results.show(lastGen, HERO_DATA);
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
