// --- Регистрация Service Worker ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed: ", error);
      });
  });
}

// --- DOM Элементы ---
const generateBtn = document.getElementById("generate-btn");
const resultsSection = document.getElementById("results-section");
const actionsPanel = document.getElementById("actions-panel");
const rerollTeamsBtn = document.getElementById("reroll-teams-btn");
const rerollHeroesBtn = document.getElementById("reroll-heroes-btn");
// Кнопка "Полный сброс" заменена на "Новые герои"
const newHeroesBtn = document.getElementById("new-heroes-btn");
const playerRows = [
  document.getElementById("player-1"),
  document.getElementById("player-2"),
  document.getElementById("player-3"),
  document.getElementById("player-4"),
];

// --- Исходные данные ---
const defaultHeroes = [
  "Алиса",
  "Медуза",
  "Синдбад",
  "Король Артур",
  "Бигфут",
  "Робин Гуд",
  "Дракула",
  "Шерлок Холмс",
];

// --- Состояние приложения ---
let currentState = {
  players: [],
  heroes: [],
};

// --- Вспомогательные функции ---

/**
 * Перемешивает массив в случайном порядке (алгоритм Фишера—Йетса)
 * @param {Array} array Массив для перемешивания
 * @returns {Array} Перемешанный массив
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Отображает результаты в DOM
 */
function renderResults() {
  for (let i = 0; i < 4; i++) {
    playerRows[
      i
    ].textContent = `Игрок ${currentState.players[i]}: ${currentState.heroes[i]}`;
  }
}

// --- Основные функции ---

/**
 * Генерирует новые команды и героев
 */
function generateTeams() {
  currentState.players = shuffleArray([1, 2, 3, 4]);
  const shuffledHeroes = shuffleArray(defaultHeroes);
  currentState.heroes = shuffledHeroes.slice(0, 4);

  renderResults();

  resultsSection.classList.remove("hidden");
  actionsPanel.classList.remove("hidden");
}

/**
 * Перемешивает только номера игроков
 */
function rerollTeams() {
  currentState.players = shuffleArray(currentState.players);
  renderResults();
}

/**
 * Перемешивает только текущих героев между собой
 */
function rerollHeroes() {
  currentState.heroes = shuffleArray(currentState.heroes);
  renderResults();
}

/**
 * Заменяет текущих героев на 4 новых из общего списка, сохраняя порядок игроков
 */
function getNewHeroes() {
  const shuffledHeroes = shuffleArray(defaultHeroes);
  // Проверяем, чтобы новые герои не совпадали полностью со старыми
  // Это редкий случай, но возможный. Простая проверка для улучшения UX.
  let newHeroesSet = shuffledHeroes.slice(0, 4);
  if (newHeroesSet.every((hero) => currentState.heroes.includes(hero))) {
    newHeroesSet = shuffledHeroes.slice(1, 5); // Берем другой срез, если вдруг выпало то же самое
  }
  currentState.heroes = newHeroesSet;
  renderResults();
}

// --- Обработчики событий ---
generateBtn.addEventListener("click", generateTeams);
rerollTeamsBtn.addEventListener("click", rerollTeams);
rerollHeroesBtn.addEventListener("click", rerollHeroes);
newHeroesBtn.addEventListener("click", getNewHeroes);
