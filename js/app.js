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

// --- Инициализация темы ---
Theme.init();

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
      const teams = { team1: "Король Артур", team2: "Медуза" }; // Пример
      Storage.saveLastGeneration(teams);
      Toast.success("Команды сгенерированы!");
    });
  }

  // Кнопка последней генерации
  const lastGenBtn = document.getElementById("last-gen-btn");
  if (lastGenBtn) {
    lastGenBtn.addEventListener("click", () => {
      const lastGen = Storage.loadLastGeneration();
      if (lastGen) {
        new Modal({
          type: "dialog",
          title: "Последняя генерация",
          content: `<div class="text-left"><p class="mb-2"><span class="font-semibold text-teal-400">Команда 1:</span> ${lastGen.team1}</p><p><span class="font-semibold text-teal-400">Команда 2:</span> ${lastGen.team2}</p></div>`,
          confirmText: "OK",
        }).open();
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
          "Вы уверены, что хотите сбросить сессию? Данные о последней генерации будут удалены.",
        onConfirm: () => {
          Storage.clearSession();
          Toast.success("Сессия сброшена.");
        },
      }).open();
    });
  }
});
