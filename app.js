// --- Service Worker Registration ---
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
  const APP_VERSION = "v0.2";

  // --- DOM Elements ---
  const generateBtn = document.getElementById("generate-btn");
  const resultsOutput = document.getElementById("results-output");
  const rerollTeamsBtn = document.getElementById("reroll-teams-btn");
  const rerollHeroesBtn = document.getElementById("reroll-heroes-btn");
  const newHeroesBtn = document.getElementById("new-heroes-btn");
  const header = document.querySelector("header");
  const versionInfo = document.getElementById("version-info");

  // Modal elements
  const modalOverlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalDragArea = document.getElementById("modal-drag-area");

  // --- State ---
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
  let currentPlayers = [];
  let currentHeroes = [];

  // --- Initial Setup ---
  versionInfo.textContent = APP_VERSION;

  // --- Utility Functions ---
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const renderResults = () => {
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

  // --- Core Logic ---
  const generateTeams = () => {
    currentPlayers = shuffleArray([1, 2, 3, 4]);
    const shuffledHeroes = shuffleArray(defaultHeroes);
    currentHeroes = shuffledHeroes.slice(0, 4);
    renderResults();
    openModal();
  };

  const rerollTeams = () => {
    currentPlayers = shuffleArray(currentPlayers);
    renderResults();
  };

  const rerollHeroes = () => {
    currentHeroes = shuffleArray(currentHeroes);
    renderResults();
  };

  const getNewHeroes = () => {
    const shuffledHeroes = shuffleArray(defaultHeroes);
    currentHeroes = shuffledHeroes.slice(0, 4);
    renderResults();
  };

  // --- Modal Logic ---
  const openModal = () => {
    modalOverlay.classList.remove("hidden");
    header.classList.add("hidden-by-modal");
    // Delay to allow the browser to render the initial state before animating
    requestAnimationFrame(() => {
      setTimeout(() => {
        modal.style.transform = "translateY(0)";
        modalOverlay.style.opacity = "1";
      }, 10);
    });
  };

  const closeModal = () => {
    modal.style.transform = "translateY(100%)";
    modalOverlay.style.opacity = "0";
    header.classList.remove("hidden-by-modal");
    setTimeout(() => {
      modalOverlay.classList.add("hidden");
    }, 300); // Match the CSS transition duration
  };

  // --- Swipe to close modal logic ---
  let touchStartY = 0;
  let touchMoveY = 0;

  modalDragArea.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
    modal.style.transition = "none"; // Disable transition during drag
  });

  modalDragArea.addEventListener("touchmove", (e) => {
    touchMoveY = e.touches[0].clientY;
    const diff = touchMoveY - touchStartY;
    if (diff > 0) {
      // Only allow dragging down
      modal.style.transform = `translateY(${diff}px)`;
    }
  });

  modalDragArea.addEventListener("touchend", () => {
    modal.style.transition = "transform 0.3s ease-in-out";
    const dragDistance = touchMoveY - touchStartY;
    if (dragDistance > 100) {
      // If dragged more than 100px, close
      closeModal();
    } else {
      // Otherwise, snap back
      modal.style.transform = "translateY(0)";
    }
    // Reset values
    touchStartY = 0;
    touchMoveY = 0;
  });

  // --- Event Listeners ---
  generateBtn.addEventListener("click", generateTeams);
  rerollTeamsBtn.addEventListener("click", rerollTeams);
  rerollHeroesBtn.addEventListener("click", rerollHeroes);
  newHeroesBtn.addEventListener("click", getNewHeroes);
  modalCloseBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
});
