$(document).ready(function () {
  const themeToggle = $("#theme-toggle");
  const sunIcon = $("#theme-icon-sun");
  const moonIcon = $("#theme-icon-moon");
  const html = $("html");

  // --- Управление темой ---

  // Функция для установки темы
  const applyTheme = (theme) => {
    if (theme === "dark") {
      html.addClass("dark").removeClass("light");
      sunIcon.removeClass("hidden");
      moonIcon.addClass("hidden");
      localStorage.setItem("theme", "dark");
    } else {
      html.removeClass("dark").addClass("light");
      moonIcon.removeClass("hidden");
      sunIcon.addClass("hidden");
      localStorage.setItem("theme", "light");
    }
  };

  // При загрузке страницы проверяем localStorage и системные настройки
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(savedTheme);

  // Обработчик клика для переключения темы
  themeToggle.on("click", () => {
    const newTheme = html.hasClass("dark") ? "light" : "dark";
    applyTheme(newTheme);
  });

  // --- Логика генерации ---

  const HEROES = [
    "Герой 1",
    "Герой 2",
    "Герой 3",
    "Герой 4",
    "Герой 5",
    "Герой 6",
    "Герой 7",
    "Герой 8",
    "Герой 9",
    "Герой 10",
  ];
  let currentGeneration = {
    teams: [],
    heroes: [],
  };

  const generateBtn = $("#generate-btn");
  const modalContainer = $("#results-modal-container");
  const modalPanel = $("#results-modal-panel");
  const closeModalBtn = $("#close-modal-btn");
  const resultsList = $("#results-list");
  const shuffleTeamsBtn = $("#shuffle-teams-btn");
  const shuffleHeroesBtn = $("#shuffle-heroes-btn");
  const shuffleAllBtn = $("#shuffle-all-btn");

  // Универсальная функция для перемешивания массива (Fisher-Yates shuffle)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Функция для отрисовки результатов в модальном окне
  function renderResults() {
    resultsList.empty();
    for (let i = 0; i < 4; i++) {
      const teamNumber = currentGeneration.teams[i];
      const heroName = currentGeneration.heroes[i];

      const resultRow = `
                <div class="flex items-center justify-between p-3 bg-light-accent dark:bg-dark-accent rounded-lg">
                    <div class="flex items-center">
                        <span class="text-lg font-bold w-6 text-center mr-4">${teamNumber}</span>
                        <span class="text-lg">${heroName}</span>
                    </div>
                    <button class="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            `;
      resultsList.append(resultRow);
    }
  }

  // Сохранение в localStorage
  function saveToLocalStorage() {
    localStorage.setItem("lastGeneration", JSON.stringify(currentGeneration));
  }

  // Генерация новых героев и команд
  function generateNew() {
    currentGeneration.teams = shuffleArray([1, 2, 3, 4]);
    currentGeneration.heroes = shuffleArray([...HEROES]).slice(0, 4);
    renderResults();
    saveToLocalStorage();
  }

  // Перемешать только команды
  function shuffleTeams() {
    currentGeneration.teams = shuffleArray(currentGeneration.teams);
    renderResults();
    saveToLocalStorage();
  }

  // Перемешать только героев
  function shuffleHeroes() {
    // Исключаем текущих героев из пула для выбора
    const remainingHeroes = HEROES.filter(
      (h) => !currentGeneration.heroes.includes(h)
    );
    currentGeneration.heroes = shuffleArray(remainingHeroes).slice(0, 4);
    renderResults();
    saveToLocalStorage();
  }

  // --- Управление модальным окном ---

  function openModal() {
    modalContainer.removeClass("opacity-0 pointer-events-none");
    modalPanel.removeClass("translate-y-full");
  }

  function closeModal() {
    modalContainer.addClass("opacity-0 pointer-events-none");
    modalPanel.addClass("translate-y-full");
  }

  // --- Обработчики событий ---

  generateBtn.on("click", () => {
    generateNew();
    openModal();
  });

  shuffleTeamsBtn.on("click", shuffleTeams);
  shuffleHeroesBtn.on("click", shuffleHeroes);
  shuffleAllBtn.on("click", generateNew);

  closeModalBtn.on("click", closeModal);
  modalContainer.on("click", function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

  // --- PWA и Service Worker ---

  if ("serviceWorker" in navigator) {
    let refreshing;
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("ServiceWorker зарегистрирован: ", registration);

        // Отслеживаем установку нового SW
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            // Когда новый SW установлен и ждет активации
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              $("#update-indicator").removeClass("hidden").addClass("flex");
            }
          });
        });
      })
      .catch((error) => {
        console.log("Ошибка регистрации ServiceWorker: ", error);
      });

    // Когда новый SW активирован, перезагружаем страницу
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  }
});
