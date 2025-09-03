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
const header = document.querySelector("header"); // Добавлен селектор для хедера
const generateBtn = document.getElementById("generate-btn");
const rerollTeamsBtn = document.getElementById("reroll-teams-btn");
const rerollHeroesBtn = document.getElementById("reroll-heroes-btn");
const newHeroesBtn = document.getElementById("new-heroes-btn");
const playerRows = [
  document.getElementById("player-1"),
  document.getElementById("player-2"),
  document.getElementById("player-3"),
  document.getElementById("player-4"),
];

// Элементы модального окна
const resultsModal = document.getElementById("results-modal");
const modalOverlay = document.getElementById("modal-overlay");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalDragArea = document.getElementById("modal-drag-area");

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
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function renderResults() {
  for (let i = 0; i < 4; i++) {
    playerRows[
      i
    ].textContent = `Игрок ${currentState.players[i]}: ${currentState.heroes[i]}`;
  }
}

// --- Функции модального окна ---
let touchStartY = 0;
let touchMoveY = 0;

function openModal() {
  header.classList.add("hidden-by-modal"); // Скрываем хедер
  modalOverlay.classList.remove("hidden");
  resultsModal.classList.remove("hidden");

  resultsModal.style.transition = "none";
  resultsModal.style.transform = "translateY(100%)";

  requestAnimationFrame(() => {
    resultsModal.style.transition = "transform 0.3s ease-in-out";
    resultsModal.style.transform = "translateY(0)";
  });
}

function closeModal() {
  header.classList.remove("hidden-by-modal"); // Возвращаем хедер
  modalOverlay.classList.add("hidden");
  resultsModal.style.transform = "translateY(100%)";

  const onTransitionEnd = () => {
    resultsModal.classList.add("hidden");
    resultsModal.style.transform = "";
    resultsModal.style.transition = "";
    resultsModal.removeEventListener("transitionend", onTransitionEnd);
  };
  resultsModal.addEventListener("transitionend", onTransitionEnd);
}

function handleTouchStart(e) {
  touchStartY = e.touches[0].clientY;
  resultsModal.style.transition = "none";
}

function handleTouchMove(e) {
  touchMoveY = e.touches[0].clientY;
  const deltaY = touchMoveY - touchStartY;

  if (deltaY > 0) {
    e.preventDefault();
    resultsModal.style.transform = `translateY(${deltaY}px)`;
  }
}

function handleTouchEnd() {
  const deltaY = touchMoveY - touchStartY;
  resultsModal.style.transition = "transform 0.3s ease-in-out";

  if (deltaY > 100) {
    closeModal();
  } else {
    resultsModal.style.transform = "translateY(0)";
  }

  touchStartY = 0;
  touchMoveY = 0;
}

// --- Основные функции ---
function generateTeams() {
  currentState.players = shuffleArray([1, 2, 3, 4]);
  const shuffledHeroes = shuffleArray(defaultHeroes);
  currentState.heroes = shuffledHeroes.slice(0, 4);

  renderResults();
  openModal();
}

function rerollTeams() {
  currentState.players = shuffleArray(currentState.players);
  renderResults();
}

function rerollHeroes() {
  currentState.heroes = shuffleArray(currentState.heroes);
  renderResults();
}

function getNewHeroes() {
  const shuffledHeroes = shuffleArray(defaultHeroes);
  let newHeroesSet = shuffledHeroes.slice(0, 4);
  if (newHeroesSet.every((hero) => currentState.heroes.includes(hero))) {
    newHeroesSet = shuffledHeroes.slice(1, 5);
  }
  currentState.heroes = newHeroesSet;
  renderResults();
}

// --- Обработчики событий ---
generateBtn.addEventListener("click", generateTeams);
rerollTeamsBtn.addEventListener("click", rerollTeams);
rerollHeroesBtn.addEventListener("click", rerollHeroes);
newHeroesBtn.addEventListener("click", getNewHeroes);

modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
modalDragArea.addEventListener("touchstart", handleTouchStart, {
  passive: false,
});
modalDragArea.addEventListener("touchmove", handleTouchMove, {
  passive: false,
});
modalDragArea.addEventListener("touchend", handleTouchEnd);
