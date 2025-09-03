// --- PWA Service Worker Registration ---
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

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const generateBtn = document.getElementById("generate-btn");
  const resultsContainer = document.getElementById("results-container");
  const resultsOutput = document.getElementById("results-output");
  const actionsPanel = document.getElementById("actions-panel");
  const rerollTeamsBtn = document.getElementById("reroll-teams-btn");
  const rerollHeroesBtn = document.getElementById("reroll-heroes-btn");
  const newHeroesBtn = document.getElementById("new-heroes-btn");

  // Modal elements
  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalDragArea = document.getElementById("modal-drag-area");

  // Background elements to hide
  const header = document.querySelector("header");
  const mainContent = document.querySelector("main");

  // --- Data ---
  const defaultHeroes = [
    "Алиса",
    "Медуза",
    "Синдбад",
    "Король Артур",
    "Бигфут",
    "Робин Гуд",
    "Шерлок Холмс",
    "Дракула",
  ];
  const players = [1, 2, 3, 4];

  let currentHeroes = [];
  let currentPlayers = [];

  // --- Utility Functions ---
  const shuffleArray = (array) => array.slice().sort(() => Math.random() - 0.5);

  // --- Core Logic ---
  const displayResults = () => {
    resultsOutput.innerHTML = "";
    const combined = currentPlayers.map((player, index) => ({
      player,
      hero: currentHeroes[index],
    }));

    combined.sort((a, b) => a.player - b.player);

    combined.forEach((item) => {
      const row = document.createElement("div");
      row.className = "player-row";
      row.textContent = `Игрок ${item.player}: ${item.hero}`;
      resultsOutput.appendChild(row);
    });
  };

  const generateTeams = () => {
    currentPlayers = shuffleArray(players);
    const shuffledHeroes = shuffleArray(defaultHeroes);
    currentHeroes = shuffledHeroes.slice(0, 4);
    displayResults();
    openModal();
  };

  const rerollTeams = () => {
    currentPlayers = shuffleArray(players);
    displayResults();
  };

  const rerollHeroes = () => {
    currentHeroes = shuffleArray(currentHeroes);
    displayResults();
  };

  const newHeroes = () => {
    const shuffledHeroes = shuffleArray(defaultHeroes);
    currentHeroes = shuffledHeroes.slice(0, 4);
    displayResults();
  };

  // --- Modal Logic ---
  let isModalOpen = false;

  const openModal = () => {
    if (isModalOpen) return;
    isModalOpen = true;
    modalOverlay.classList.remove("hidden");
    modal.classList.remove("hidden");

    // Allow browser to paint the hidden state first
    requestAnimationFrame(() => {
      modalOverlay.style.opacity = "1";
      modal.style.transform = "translateY(0)";
      header.classList.add("hidden-by-modal");
      mainContent.classList.add("hidden-by-modal");
    });
  };

  const closeModal = () => {
    if (!isModalOpen) return;
    isModalOpen = false;
    modalOverlay.style.opacity = "0";
    modal.style.transform = "translateY(100%)";
    header.classList.remove("hidden-by-modal");
    mainContent.classList.remove("hidden-by-modal");

    // Hide after animation
    setTimeout(() => {
      modalOverlay.classList.add("hidden");
    }, 300);
  };

  // --- Modal Drag/Swipe Logic ---
  let touchStartY = 0;
  let touchMoveY = 0;

  const handleTouchStart = (e) => {
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchMoveY = e.touches[0].clientY;
    const deltaY = touchMoveY - touchStartY;
    // Allow dragging down only
    if (deltaY > 0) {
      modal.style.transition = "none"; // Disable transition while dragging
      modal.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    const deltaY = touchMoveY - touchStartY;
    modal.style.transition = "transform 0.3s ease-in-out"; // Re-enable transition
    // If dragged more than 1/4 of the modal height, close it
    if (deltaY > modal.clientHeight / 4) {
      closeModal();
    } else {
      // Otherwise, snap back
      modal.style.transform = "translateY(0)";
    }
    // Reset values
    touchStartY = 0;
    touchMoveY = 0;
  };

  // --- Event Listeners ---
  generateBtn.addEventListener("click", generateTeams);
  rerollTeamsBtn.addEventListener("click", rerollTeams);
  rerollHeroesBtn.addEventListener("click", rerollHeroes);
  newHeroesBtn.addEventListener("click", newHeroes);

  // Modal listeners
  modalOverlay.addEventListener("click", closeModal);
  modalCloseBtn.addEventListener("click", closeModal);
  modalDragArea.addEventListener("touchstart", handleTouchStart, {
    passive: true,
  });
  modalDragArea.addEventListener("touchmove", handleTouchMove, {
    passive: true,
  });
  modalDragArea.addEventListener("touchend", handleTouchEnd);
});
