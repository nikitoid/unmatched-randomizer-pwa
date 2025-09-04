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
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Globals & Config ---
const { CryptoJS } = window;
const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : {};
let db, auth, listsDocRef;
let localListsCache = { lists: {}, selected: "", heroes: [] };
let currentGeneration = { teams: [], heroes: [] };
let isSettingsAuthenticated = false; // Manages auth state for the settings session
const TEMP_LIST_SUFFIX = " (искл.)";

// --- App Initialization ---
$(document).ready(function () {
  // --- Initialize UI elements ---
  const generateBtn = $("#generate-btn"),
    heroListSelect = $("#hero-list-select");
  const themeToggle = $("#theme-toggle"),
    sunIcon = $("#theme-icon-sun"),
    moonIcon = $("#theme-icon-moon"),
    html = $("html");
  const modalContainer = $("#results-modal-container"),
    modalPanel = $("#results-modal-panel"),
    closeModalBtn = $("#close-modal-btn");
  const resultsList = $("#results-list"),
    shuffleTeamsBtn = $("#shuffle-teams-btn"),
    shuffleHeroesBtn = $("#shuffle-heroes-btn"),
    shuffleAllBtn = $("#shuffle-all-btn");
  const prevGenBtn = $("#prev-gen-btn"),
    resetSessionBtn = $("#reset-session-btn"),
    excludeAllBtn = $("#exclude-all-btn");
  const settingsBtn = $("#settings-btn"),
    settingsModalContainer = $("#settings-modal-container"),
    settingsModalPanel = $("#settings-modal-panel");
  const passwordModalContainer = $("#password-modal-container"),
    passwordModalPanel = $("#password-modal-panel");

  // --- Setup Firebase ---
  function initializeFirebase() {
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      listsDocRef = doc(db, "lists", "main");
      handleAuthentication();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      showNotification("Не удалось инициализировать базу данных.", "error");
      loadFromLocalStorage();
      populateHeroListsFromCache();
    }
  }

  // --- Authentication & Data Fetching ---
  function handleAuthentication() {
    onAuthStateChanged(auth, (user) => {
      if (user) syncWithFirebase();
    });
    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous sign-in failed:", error);
      showNotification(
        error.code === "auth/operation-not-allowed"
          ? "Анонимный вход не включен."
          : "Ошибка аутентификации.",
        "error"
      );
      loadFromLocalStorage();
      populateHeroListsFromCache();
    });
  }

  // --- Theme Logic ---
  const applyTheme = (theme) => {
    if (theme === "dark") {
      html.addClass("dark").removeClass("light");
      sunIcon.removeClass("hidden");
      moonIcon.addClass("hidden");
    } else {
      html.removeClass("dark").addClass("light");
      moonIcon.removeClass("hidden");
      sunIcon.addClass("hidden");
    }
    localStorage.setItem("theme", theme);
  };
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(savedTheme);
  themeToggle.on("click", () =>
    applyTheme(html.hasClass("dark") ? "light" : "dark")
  );

  // --- Data Sync & Caching ---
  async function syncWithFirebase() {
    if (!navigator.onLine) {
      loadFromLocalStorage();
      populateHeroListsFromCache();
      return;
    }
    try {
      const docSnap = await getDoc(listsDocRef);
      const firebaseData = docSnap.exists()
        ? docSnap.data()
        : { lists: {}, selected: "" };
      const localTempLists = getLocalTempLists();
      localListsCache.lists = { ...firebaseData.lists, ...localTempLists };
      localListsCache.selected = firebaseData.selected || "";
      localStorage.setItem(
        "randomatched_lists",
        JSON.stringify(firebaseData.lists)
      );
      localStorage.setItem("randomatched_selected", firebaseData.selected);
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
      showNotification("Не удалось загрузить списки из базы.", "error");
      loadFromLocalStorage();
    } finally {
      populateHeroListsFromCache();
    }
  }

  function loadFromLocalStorage() {
    try {
      const storedLists =
        JSON.parse(localStorage.getItem("randomatched_lists")) || {};
      const localTempLists = getLocalTempLists();
      localListsCache.lists = { ...storedLists, ...localTempLists };
      localListsCache.selected =
        localStorage.getItem("randomatched_selected") || "";
      const lastGen = JSON.parse(localStorage.getItem("lastGeneration"));
      if (lastGen) currentGeneration = lastGen;
    } catch (e) {
      console.error("Failed to parse data from localStorage", e);
      localListsCache = { lists: {}, selected: "", heroes: [] };
    } finally {
      updateSessionButtons();
    }
  }

  const getLocalTempLists = () =>
    Object.fromEntries(
      Object.entries(localStorage)
        .filter(([key]) => key.startsWith("temp_list_"))
        .map(([key, value]) => [
          key.replace("temp_list_", ""),
          JSON.parse(value),
        ])
    );

  function populateHeroListsFromCache() {
    const currentVal = heroListSelect.val();
    heroListSelect.empty();
    const listNames = Object.keys(localListsCache.lists);
    if (listNames.length === 0) {
      heroListSelect.append('<option value="">Нет доступных списков</option>');
      generateBtn
        .prop("disabled", true)
        .addClass("opacity-50 cursor-not-allowed");
      return;
    }
    listNames
      .sort()
      .forEach((name) =>
        heroListSelect.append(`<option value="${name}">${name}</option>`)
      );
    const tempListName = listNames.find((name) =>
      name.endsWith(TEMP_LIST_SUFFIX)
    );
    let selected =
      tempListName ||
      currentVal ||
      (localListsCache.selected &&
      localListsCache.lists[localListsCache.selected]
        ? localListsCache.selected
        : listNames[0]);
    heroListSelect.val(selected);
    updateCurrentHeroList();
    generateBtn
      .prop("disabled", false)
      .removeClass("opacity-50 cursor-not-allowed");
  }

  const updateCurrentHeroList = () => {
    localListsCache.heroes = localListsCache.lists[heroListSelect.val()] || [];
  };
  heroListSelect.on("change", updateCurrentHeroList);

  // --- Generation Logic ---
  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);
  function generateNew() {
    if (localListsCache.heroes.length < 4) {
      showNotification(
        "В списке недостаточно героев (нужно минимум 4).",
        "error"
      );
      return;
    }
    currentGeneration = {
      teams: shuffleArray([1, 2, 3, 4]),
      heroes: shuffleArray([...localListsCache.heroes]).slice(0, 4),
    };
    renderResults();
    saveGenerationToLocalStorage();
    openModal();
  }
  generateBtn.on("click", generateNew);
  shuffleTeamsBtn.on("click", () => {
    currentGeneration.teams = shuffleArray(currentGeneration.teams);
    renderResults();
    saveGenerationToLocalStorage();
  });
  shuffleHeroesBtn.on("click", () => {
    const availableHeroes = localListsCache.heroes.filter(
      (h) => !currentGeneration.heroes.includes(h)
    );
    if (availableHeroes.length < 4) {
      showNotification("Недостаточно героев для полной замены.", "error");
      return;
    }
    currentGeneration.heroes = shuffleArray(availableHeroes).slice(0, 4);
    renderResults();
    saveGenerationToLocalStorage();
  });
  shuffleAllBtn.on("click", generateNew);

  // --- Session Management ---
  function updateSessionButtons() {
    const hasLastGen = !!localStorage.getItem("lastGeneration");
    const hasTempList = Object.keys(localListsCache.lists).some((name) =>
      name.endsWith(TEMP_LIST_SUFFIX)
    );
    prevGenBtn
      .prop("disabled", !hasLastGen)
      .toggleClass("opacity-50 cursor-not-allowed", !hasLastGen);
    resetSessionBtn
      .prop("disabled", !hasLastGen && !hasTempList)
      .toggleClass(
        "opacity-50 cursor-not-allowed",
        !hasLastGen && !hasTempList
      );
  }
  prevGenBtn.on("click", () => {
    if (localStorage.getItem("lastGeneration")) {
      renderResults();
      openModal();
    }
  });
  resetSessionBtn.on("click", () =>
    showConfirmationModal({
      title: "Сбросить сессию?",
      message: "Временный список и последняя генерация будут удалены.",
      confirmText: "Сбросить",
      onConfirm: () => {
        const tempListName = Object.keys(localListsCache.lists).find((name) =>
          name.endsWith(TEMP_LIST_SUFFIX)
        );
        if (tempListName) {
          delete localListsCache.lists[tempListName];
          localStorage.removeItem(`temp_list_${tempListName}`);
        }
        localStorage.removeItem("lastGeneration");
        currentGeneration = { teams: [], heroes: [] };
        populateHeroListsFromCache();
        updateSessionButtons();
        showNotification("Сессия сброшена.", "success");
      },
    })
  );

  // --- Exclusion Logic ---
  function handleExclusion(heroesToExclude) {
    let currentListName = heroListSelect.val();
    let currentList = [...localListsCache.heroes];
    let tempListName = currentListName.endsWith(TEMP_LIST_SUFFIX)
      ? currentListName
      : `${currentListName}${TEMP_LIST_SUFFIX}`;
    const updatedList = currentList.filter(
      (hero) => !heroesToExclude.includes(hero)
    );
    localStorage.setItem(
      `temp_list_${tempListName}`,
      JSON.stringify(updatedList)
    );
    localListsCache.lists[tempListName] = updatedList;
    if (!currentListName.endsWith(TEMP_LIST_SUFFIX))
      populateHeroListsFromCache();
    heroListSelect.val(tempListName).trigger("change");
    if (heroesToExclude.length === 1) {
      const heroIndex = currentGeneration.heroes.indexOf(heroesToExclude[0]);
      const availableHeroes = localListsCache.heroes.filter(
        (h) => !currentGeneration.heroes.includes(h) && h !== heroesToExclude[0]
      );
      if (availableHeroes.length < 1) {
        showNotification("Нет героев для замены.", "error");
        closeModal();
        return;
      }
      if (heroIndex !== -1) {
        currentGeneration.heroes[heroIndex] = shuffleArray(availableHeroes)[0];
        renderResults();
        saveGenerationToLocalStorage();
      }
    } else closeModal();
    updateSessionButtons();
  }
  resultsList.on("click", ".exclude-hero-btn", function () {
    handleExclusion([$(this).data("hero")]);
  });
  excludeAllBtn.on("click", () =>
    showConfirmationModal({
      title: "Исключить всех?",
      message: "Все 4 героя будут удалены из временного списка.",
      confirmText: "Исключить",
      onConfirm: () => handleExclusion([...currentGeneration.heroes]),
    })
  );

  // --- Modals Logic (Results, Settings, etc.) ---
  const openModal = () => {
    modalContainer.removeClass("opacity-0 pointer-events-none");
    modalPanel.removeClass("translate-y-full");
  };
  const closeModal = () => {
    modalPanel.addClass("translate-y-full");
    modalContainer.addClass("opacity-0 pointer-events-none");
  };
  closeModalBtn.on("click", closeModal);
  modalContainer.on("click", function (e) {
    if (e.target === this) closeModal();
  });

  function renderResults() {
    resultsList.empty();
    if (!currentGeneration.teams || !currentGeneration.heroes) return;
    currentGeneration.heroes.forEach((heroName, i) =>
      resultsList.append(`
            <li class="flex items-center justify-between p-3 rounded-lg bg-light-secondary dark:bg-dark-secondary">
                <span class="font-bold text-xl text-blue-500 w-10 text-center">${currentGeneration.teams[i]}</span>
                <span class="text-lg text-center mx-2 flex-1">${heroName}</span>
                <button class="p-1 text-gray-400 hover:text-red-500 transition-colors exclude-hero-btn" data-hero="${heroName}" title="Исключить героя"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
            </li>`)
    );
  }
  const saveGenerationToLocalStorage = () => {
    localStorage.setItem("lastGeneration", JSON.stringify(currentGeneration));
    updateSessionButtons();
  };

  // --- New Settings Modal Logic ---
  const openSettingsModal = async () => {
    await renderListManagementUI();
    settingsModalContainer.removeClass(
      "opacity-0 pointer-events-none translate-y-full"
    );
  };
  const closeSettingsModal = () => {
    settingsModalContainer.addClass(
      "opacity-0 pointer-events-none translate-y-full"
    );
    isSettingsAuthenticated = false;
  };
  settingsBtn.on("click", openSettingsModal);

  const openPasswordModal = () => {
    passwordModalPanel.removeClass("scale-95 opacity-0");
    passwordModalContainer.removeClass("opacity-0 pointer-events-none");
    $("#password-input").val("").focus();
  };
  const closePasswordModal = () => {
    passwordModalPanel.addClass("scale-95 opacity-0");
    passwordModalContainer.addClass("opacity-0 pointer-events-none");
  };
  $("#cancel-password-btn").on("click", closePasswordModal);
  $("#submit-password-btn").on("click", async () => {
    if (!navigator.onLine) {
      showNotification("Редактирование доступно только онлайн.", "error");
      return;
    }
    const hash = CryptoJS.SHA256($("#password-input").val()).toString();
    try {
      const docSnap = await getDoc(listsDocRef);
      if (docSnap.exists() && docSnap.data().passwordHash === hash) {
        isSettingsAuthenticated = true;
        closePasswordModal();
        await renderListManagementUI(false);
        showNotification("Доступ предоставлен.", "success");
      } else $("#password-error").removeClass("hidden");
    } catch (error) {
      $("#password-error").text("Ошибка при проверке.").removeClass("hidden");
    }
  });

  async function renderListManagementUI(showSpinner = true) {
    if (showSpinner)
      settingsModalPanel.html(
        '<div class="flex-grow flex justify-center items-center"><div class="update-spinner"></div></div>'
      );
    const docSnap = await getDoc(listsDocRef);
    const remoteData = docSnap.exists()
      ? docSnap.data()
      : { lists: {}, selected: "" };
    let ui = `<header class="flex justify-between items-center p-4 border-b border-light-accent dark:border-dark-accent flex-shrink-0">
            <h2 class="text-2xl font-bold">Управление списками</h2>
            <div class="flex items-center space-x-2">
                <button id="add-list-btn" class="p-2 w-10 h-10 flex items-center justify-center text-xl rounded-full bg-blue-500 text-white hover:bg-blue-600">+</button>
                <button id="close-settings-btn-inner" class="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 hover:opacity-80"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
        </header>
        <div id="lists-editor" class="flex-grow space-y-3 overflow-y-auto p-4">${
          !navigator.onLine && !isSettingsAuthenticated
            ? '<p class="text-center text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 p-2 rounded-md">Офлайн-режим: редактирование глобальных списков недоступно.</p>'
            : ""
        }`;

    const allLists = { ...remoteData.lists, ...getLocalTempLists() };
    Object.keys(allLists)
      .sort()
      .forEach((name) => {
        const isTemp = name.endsWith(TEMP_LIST_SUFFIX);
        const isLocked = !isTemp && !isSettingsAuthenticated;
        ui += `<div class="list-item" data-list-name="${name}">
                <div class="flex items-center justify-between p-3 rounded-lg bg-light-secondary dark:bg-dark-secondary cursor-pointer list-item-header">
                    <div class="flex items-center space-x-2 truncate">
                        ${
                          isLocked
                            ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" /></svg>'
                            : ""
                        }
                        <span class="font-semibold truncate">${name}</span>
                    </div>
                    <div class="flex items-center space-x-2 flex-shrink-0">
                        ${
                          !isTemp
                            ? `<button class="set-default-btn p-1 ${
                                remoteData.selected === name
                                  ? "text-yellow-500"
                                  : "text-gray-400 hover:text-yellow-400"
                              }" title="Сделать по умолчанию"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></button>`
                            : ""
                        }
                        ${
                          !isTemp
                            ? `<button class="delete-list-btn p-1 text-gray-400 hover:text-red-500" title="Удалить список"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`
                            : ""
                        }
                    </div>
                </div>
                <div class="list-item-content hidden p-3 border-t border-light-accent dark:border-dark-accent">
                    <textarea class="w-full h-48 p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">${allLists[
                      name
                    ].join("\n")}</textarea>
                    <button class="mt-2 px-4 py-2 w-full rounded-lg bg-blue-500 text-white hover:bg-blue-600 save-list-btn">Сохранить</button>
                </div>
            </div>`;
      });
    ui += `</div>`;
    settingsModalPanel.html(ui);
    if (!navigator.onLine && !isSettingsAuthenticated)
      settingsModalPanel
        .find("button")
        .not("#close-settings-btn-inner")
        .prop("disabled", true);
    $("#close-settings-btn-inner").on("click", closeSettingsModal);
  }

  settingsModalPanel.on("click", ".list-item-header", function () {
    const item = $(this).closest(".list-item");
    if (item.find(".list-item-content").is(":animated")) return;
    const isLocked =
      !item.data("list-name").endsWith(TEMP_LIST_SUFFIX) &&
      !isSettingsAuthenticated;
    if (isLocked) openPasswordModal();
    else item.find(".list-item-content").slideToggle(200);
  });
  settingsModalPanel.on("click", "#add-list-btn", (e) => {
    e.stopPropagation();
    if (!isSettingsAuthenticated) {
      openPasswordModal();
      return;
    }
    const newListName = prompt("Введите название нового списка:");
    if (newListName && !localListsCache.lists[newListName]) {
      const key = `lists.${newListName.replace(/\./g, "_")}`;
      updateDoc(listsDocRef, { [key]: [] }).then(() => {
        showNotification(`Список "${newListName}" создан.`, "success");
        syncWithFirebase().then(() => renderListManagementUI(false));
      });
    } else if (newListName)
      showNotification("Список с таким именем уже существует.", "error");
  });
  settingsModalPanel.on("click", ".save-list-btn", async function (e) {
    e.stopPropagation();
    const listName = $(this).closest(".list-item").data("list-name");
    const heroes = $(this)
      .siblings("textarea")
      .val()
      .split("\n")
      .map((h) => h.trim())
      .filter(Boolean);
    if (listName.endsWith(TEMP_LIST_SUFFIX)) {
      localStorage.setItem(`temp_list_${listName}`, JSON.stringify(heroes));
      localListsCache.lists[listName] = heroes;
      showNotification(`Локальный список "${listName}" обновлен.`, "success");
    } else {
      const key = `lists.${listName.replace(/\./g, "_")}`;
      await updateDoc(listsDocRef, { [key]: heroes });
      showNotification(`Список "${listName}" сохранен в Firebase.`, "success");
      await syncWithFirebase();
    }
    $(this).closest(".list-item-content").slideUp(200);
  });
  settingsModalPanel.on(
    "click",
    ".set-default-btn, .delete-list-btn",
    function (e) {
      e.stopPropagation();
      if (!isSettingsAuthenticated) {
        openPasswordModal();
        return;
      }
      const listName = $(this).closest(".list-item").data("list-name");
      const isDelete = $(this).hasClass("delete-list-btn");
      const action = isDelete
        ? async () => {
            const docSnap = await getDoc(listsDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              delete data.lists[listName];
              if (data.selected === listName) data.selected = "";
              await setDoc(listsDocRef, data);
              showNotification(`Список "${listName}" удален.`, "success");
              await syncWithFirebase();
              await renderListManagementUI(false);
              populateHeroListsFromCache();
            }
          }
        : async () => {
            await updateDoc(listsDocRef, { selected: listName });
            showNotification(
              `Список "${listName}" установлен по умолчанию.`,
              "success"
            );
            await syncWithFirebase();
            renderListManagementUI(false);
          };
      if (isDelete)
        showConfirmationModal({
          title: "Удалить список?",
          message: `Вы уверены, что хотите удалить "${listName}"?`,
          confirmText: "Удалить",
          onConfirm: action,
        });
      else action();
    }
  );

  const confModal = $("#confirmation-modal-container"),
    confPanel = $("#confirmation-modal-panel");
  function showConfirmationModal({
    title,
    message,
    confirmText,
    onConfirm,
    isDestructive = true,
  }) {
    confModal.find("#confirmation-title").text(title);
    confModal.find("#confirmation-message").text(message);
    const confirmBtn = confModal
      .find("#confirmation-confirm-btn")
      .text(confirmText);
    confirmBtn
      .toggleClass("bg-red-500 hover:bg-red-600", isDestructive)
      .toggleClass("bg-blue-500 hover:bg-blue-600", !isDestructive);
    confModal.removeClass("opacity-0 pointer-events-none");
    confPanel.removeClass("scale-95 opacity-0");
    confirmBtn.off("click").on("click", () => {
      onConfirm();
      closeConfirmationModal();
    });
  }
  const closeConfirmationModal = () => {
    confPanel.addClass("scale-95 opacity-0");
    confModal.addClass("opacity-0 pointer-events-none");
  };
  confModal.on("click", function (e) {
    if (e.target === this) closeConfirmationModal();
  });
  $("#confirmation-cancel-btn").on("click", closeConfirmationModal);

  function showNotification(message, type = "error", duration = 4000) {
    const color = type === "success" ? "bg-green-500" : "bg-red-500";
    const notificationId = `notification-${Date.now()}`;
    const notificationDiv = $(
      `<div id="${notificationId}" class="absolute top-20 text-center w-full max-w-sm p-3 ${color} text-white rounded-lg shadow-lg transition-opacity duration-300">${message}</div>`
    );
    $("#app").prepend(notificationDiv);
    setTimeout(
      () => $(`#${notificationId}`).addClass("opacity-0").delay(300).remove(),
      duration
    );
  }

  // --- Service Worker ---
  if ("serviceWorker" in navigator) {
    $(window).on("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              )
                $("#update-indicator").removeClass("hidden");
            });
          });
        })
        .catch((err) => console.error("SW registration failed:", err));
      navigator.serviceWorker.addEventListener("controllerchange", () =>
        window.location.reload()
      );
    });
  }

  // --- Initial Load ---
  initializeFirebase();
  loadFromLocalStorage();
  populateHeroListsFromCache();
});
