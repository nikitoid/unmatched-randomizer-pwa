// --- Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Globals & Config ---
const { CryptoJS } = window;

const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : {};
const appId =
  typeof __app_id !== "undefined" ? __app_id : "randomatched-default";

let db, auth;
let listsDocRef;

let localListsCache = {
  lists: {},
  selected: "",
  heroes: [],
};

let currentGeneration = {
  teams: [],
  heroes: [],
};

// --- App Initialization ---
$(document).ready(function () {
  // --- Initialize UI elements ---
  const generateBtn = $("#generate-btn");
  const settingsBtn = $("#settings-btn");
  const heroListSelect = $("#hero-list-select");
  const themeToggle = $("#theme-toggle");
  const sunIcon = $("#theme-icon-sun");
  const moonIcon = $("#theme-icon-moon");
  const html = $("html");
  const modalContainer = $("#results-modal-container");
  const modalPanel = $("#results-modal-panel");
  const closeModalBtn = $("#close-modal-btn");
  const resultsList = $("#results-list");
  const shuffleTeamsBtn = $("#shuffle-teams-btn");
  const shuffleHeroesBtn = $("#shuffle-heroes-btn");
  const shuffleAllBtn = $("#shuffle-all-btn");

  // --- Setup Firebase ---
  function initializeFirebase() {
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      listsDocRef = doc(db, "lists", "main");
      console.log("Firebase initialized successfully.");

      // Start authentication process
      handleAuthentication();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      showError("Не удалось инициализировать базу данных.");
      loadFromLocalStorage(); // Fallback to offline mode
      populateHeroListsFromCache();
    }
  }

  // --- Authentication & Data Fetching ---
  function handleAuthentication() {
    // This listener will react to sign-in events
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Authenticated anonymously:", user.uid);
        syncWithFirebase(); // Fetch data once authenticated
      }
    });

    // Try to sign in
    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous sign-in failed:", error);
      if (error.code === "auth/operation-not-allowed") {
        showError("Анонимный вход не включен в настройках Firebase.");
      } else {
        showError("Ошибка аутентификации.");
      }
      loadFromLocalStorage(); // Fallback to offline mode
      populateHeroListsFromCache();
    });
  }

  // --- Theme Logic ---
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
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(savedTheme);
  themeToggle.on("click", () => {
    const newTheme = html.hasClass("dark") ? "light" : "dark";
    applyTheme(newTheme);
  });

  // --- Data Sync & Caching ---
  async function syncWithFirebase() {
    if (!navigator.onLine) {
      console.log("Offline mode. Loading data from cache.");
      loadFromLocalStorage();
      populateHeroListsFromCache();
      return;
    }
    try {
      const docSnap = await getDoc(listsDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        localListsCache.lists = data.lists || {};
        localListsCache.selected = data.selected || "";
        localStorage.setItem(
          "randomatched_lists",
          JSON.stringify(localListsCache.lists)
        );
        localStorage.setItem("randomatched_selected", localListsCache.selected);
        console.log("Data synced from Firebase and cached.");
      } else {
        console.log("No document found in Firebase. Using local cache.");
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
      showError("Не удалось загрузить списки из базы.");
      loadFromLocalStorage();
    } finally {
      populateHeroListsFromCache();
    }
  }

  function loadFromLocalStorage() {
    try {
      localListsCache.lists =
        JSON.parse(localStorage.getItem("randomatched_lists")) || {};
      localListsCache.selected =
        localStorage.getItem("randomatched_selected") || "";
      const lastGen = JSON.parse(localStorage.getItem("lastGeneration"));
      if (lastGen) currentGeneration = lastGen;
    } catch (e) {
      console.error("Failed to parse data from localStorage", e);
      localListsCache.lists = {};
      localListsCache.selected = "";
    }
  }

  function populateHeroListsFromCache() {
    heroListSelect.empty();
    const listNames = Object.keys(localListsCache.lists);

    if (listNames.length === 0) {
      heroListSelect.append('<option value="">Нет доступных списков</option>');
      generateBtn
        .prop("disabled", true)
        .addClass("opacity-50 cursor-not-allowed");
      return;
    }

    listNames.sort().forEach((name) => {
      heroListSelect.append(`<option value="${name}">${name}</option>`);
    });

    const selected =
      localListsCache.selected &&
      localListsCache.lists[localListsCache.selected]
        ? localListsCache.selected
        : listNames[0];

    if (selected) {
      heroListSelect.val(selected);
    }
    updateCurrentHeroList();
    generateBtn
      .prop("disabled", false)
      .removeClass("opacity-50 cursor-not-allowed");
  }

  function updateCurrentHeroList() {
    const selectedListName = heroListSelect.val();
    if (selectedListName) {
      localListsCache.heroes = localListsCache.lists[selectedListName] || [];
      console.log(
        `Selected list "${selectedListName}" with ${localListsCache.heroes.length} heroes.`
      );
    } else {
      localListsCache.heroes = [];
    }
  }

  heroListSelect.on("change", updateCurrentHeroList);

  // --- Generation Logic ---
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function generateNew() {
    const activeHeroes = getActiveHeroes();
    if (activeHeroes.length < 4) {
      showError(
        "В выбранном списке недостаточно героев (нужно минимум 4).",
        3000
      );
      return;
    }
    currentGeneration.teams = shuffleArray([1, 2, 3, 4]);
    currentGeneration.heroes = shuffleArray([...activeHeroes]).slice(0, 4);
    renderResults();
    saveGenerationToLocalStorage();
    openModal();
  }

  function shuffleTeams() {
    currentGeneration.teams = shuffleArray(currentGeneration.teams);
    renderResults();
    saveGenerationToLocalStorage();
  }

  function shuffleHeroes() {
    const activeHeroes = getActiveHeroes();

    const availableHeroes = activeHeroes.filter(
      (h) => !currentGeneration.heroes.includes(h)
    );

    if (availableHeroes.length < 4) {
      showError("Недостаточно героев для полной замены.", 3000);
      return;
    }

    currentGeneration.heroes = shuffleArray(availableHeroes).slice(0, 4);
    renderResults();
    saveGenerationToLocalStorage();
  }

  generateBtn.on("click", generateNew);
  shuffleTeamsBtn.on("click", shuffleTeams);
  shuffleHeroesBtn.on("click", shuffleHeroes);
  shuffleAllBtn.on("click", generateNew);

  // --- Results Modal Logic ---
  function renderResults() {
    resultsList.empty();
    if (!currentGeneration.teams || !currentGeneration.teams.length) return;

    for (let i = 0; i < 4; i++) {
      const teamNumber = currentGeneration.teams[i];
      const heroName = currentGeneration.heroes[i];
      const li = `
                <li class="flex items-center justify-between p-3 rounded-lg bg-light-secondary dark:bg-dark-secondary text-light-text dark:text-dark-text">
                    <span class="font-bold text-xl text-blue-500 w-10 text-center">${teamNumber}</span>
                    <span class="text-lg text-center mx-2 flex-1">${heroName}</span>
                    <button class="p-1 text-gray-400 hover:text-red-500 transition-colors exclude-hero-btn" data-hero="${heroName}" title="Исключить героя (без функции)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </button>
                </li>
            `;
      resultsList.append(li);
    }
  }

  function saveGenerationToLocalStorage() {
    localStorage.setItem("lastGeneration", JSON.stringify(currentGeneration));
  }

  function openModal() {
    modalContainer.removeClass("opacity-0 pointer-events-none");
    modalPanel.removeClass("translate-y-full");
  }

  function closeModal() {
    modalPanel.addClass("translate-y-full");
    modalContainer.addClass("opacity-0 pointer-events-none");
  }

  closeModalBtn.on("click", closeModal);
  modalContainer.on("click", function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

  // --- Settings Modal Logic ---
  const settingsModalContainer = $("#settings-modal-container");
  const passwordSection = $("#password-section");
  const managementSection = $("#lists-management-section");

  settingsBtn.on("click", () => {
    if (!navigator.onLine) {
      showError("Редактирование списков доступно только онлайн.", 3000);
      return;
    }
    passwordSection.show();
    managementSection.hide();
    $("#password-input").val("");
    $("#password-error").addClass("hidden");
    settingsModalContainer.removeClass("opacity-0 pointer-events-none");
  });

  $("#cancel-password-btn, #close-settings-btn").on("click", () => {
    settingsModalContainer.addClass("opacity-0 pointer-events-none");
  });

  $("#submit-password-btn").on("click", async () => {
    const password = $("#password-input").val();
    if (!password) return;
    const hash = CryptoJS.SHA256(password).toString();

    try {
      const docSnap = await getDoc(listsDocRef);
      if (docSnap.exists() && docSnap.data().passwordHash === hash) {
        passwordSection.hide();
        await renderListManagementUI();
        managementSection.show();
      } else {
        $("#password-error").removeClass("hidden");
      }
    } catch (error) {
      console.error("Password check failed:", error);
      $("#password-error").text("Ошибка при проверке.").removeClass("hidden");
    }
  });

  // --- CRUD Logic (Stubbed) ---
  async function renderListManagementUI() {
    managementSection.html(`
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Управление списками</h2>
                <button id="add-list-btn" class="p-2 w-10 h-10 flex items-center justify-center text-xl rounded-full bg-blue-500 text-white hover:bg-blue-600">+</button>
            </div>
            <div id="lists-editor" class="space-y-2 max-h-96 overflow-y-auto">
                <!-- Списки будут рендериться здесь -->
                <p>Функционал управления списками в разработке.</p>
            </div>
            <div class="flex justify-end mt-4">
               <button id="close-settings-btn-inner" class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:opacity-80">Закрыть</button>
            </div>
        `);
    $("#close-settings-btn-inner").on("click", () =>
      settingsModalContainer.addClass("opacity-0 pointer-events-none")
    );
  }

  // --- Helper Functions ---
  function getActiveHeroes() {
    const selectedList = heroListSelect.val();
    return localListsCache.lists[selectedList] || [];
  }

  function showError(message, duration = 5000) {
    const errorId = `error-${Date.now()}`;
    const errorDiv = $(
      `<div id="${errorId}" class="absolute top-20 text-center w-full max-w-sm p-3 bg-red-500 text-white rounded-lg shadow-lg transition-opacity duration-300">${message}</div>`
    );
    $("#app").prepend(errorDiv);
    setTimeout(() => {
      $(`#${errorId}`).addClass("opacity-0");
      setTimeout(() => $(`#${errorId}`).remove(), 300);
    }, duration);
  }

  // --- Service Worker ---
  if ("serviceWorker" in navigator) {
    let newWorker;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          newWorker = reg.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              $("#update-indicator").removeClass("hidden");
            }
          });
        });
      })
      .catch((err) =>
        console.error("Service Worker registration failed:", err)
      );

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }

  // --- Initial Load ---
  initializeFirebase();
  loadFromLocalStorage(); // Load from cache immediately for faster UI
  renderResults();
});
