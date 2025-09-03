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
const fullResetBtn = document.getElementById("full-reset-btn");
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
 * Перемешивает только героев
 */
function rerollHeroes() {
  currentState.heroes = shuffleArray(currentState.heroes);
  renderResults();
}

/**
 * Полный сброс, аналогично первой генерации
 */
function fullReset() {
  generateTeams();
}

// --- Обработчики событий ---
generateBtn.addEventListener("click", generateTeams);
rerollTeamsBtn.addEventListener("click", rerollTeams);
rerollHeroesBtn.addEventListener("click", rerollHeroes);
fullResetBtn.addEventListener("click", fullReset);
