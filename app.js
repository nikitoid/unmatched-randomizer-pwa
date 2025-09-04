// Ждем, пока Alpine.js и Firebase будут готовы
$(document).ready(function () {
  // --- Глобальные переменные и константы ---
  let currentPlayers = [];
  let currentHeroes = [];
  let heroDataFromFirebase = {}; // Данные из Firestore
  let localExclusionLists = {}; // Локальные списки исключений

  const PWD_HASH =
    "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // sha256 from '1234'
  const EXCLUSION_SUFFIX = " (искл.)";
  const getAlpineState = () => document.querySelector("[x-data]").__x.$data;

  // --- Вспомогательные функции ---
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    // ИСПРАВЛЕНО: Был указан неверный алгоритм SHA-26
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function saveLastGeneration() {
    try {
      const data = JSON.stringify({
        players: currentPlayers,
        heroes: currentHeroes,
      });
      localStorage.setItem("lastGeneration", data);
      updateSessionButtonsVisibility();
    } catch (e) {
      console.error("Не удалось сохранить последнюю генерацию:", e);
    }
  }

  function loadLastGeneration() {
    try {
      const data = localStorage.getItem("lastGeneration");
      if (data) {
        const parsed = JSON.parse(data);
        currentPlayers = parsed.players;
        currentHeroes = parsed.heroes;
        return true;
      }
    } catch (e) {
      console.error("Не удалось загрузить последнюю генерацию:", e);
    }
    return false;
  }

  function getBaseListName(listName) {
    return listName.endsWith(EXCLUSION_SUFFIX)
      ? listName.slice(0, -EXCLUSION_SUFFIX.length)
      : listName;
  }

  function updateSessionButtonsVisibility() {
    const hasExclusionLists = Object.keys(localExclusionLists).length > 0;
    const hasLastGen = !!localStorage.getItem("lastGeneration");

    hasLastGen
      ? $("#show-last-gen-btn").removeClass("hidden")
      : $("#show-last-gen-btn").addClass("hidden");
    hasExclusionLists || hasLastGen
      ? $("#reset-session-btn").removeClass("hidden")
      : $("#reset-session-btn").addClass("hidden");
  }

  // --- Локальное хранилище для исключений ---
  function loadLocalExclusions() {
    try {
      localExclusionLists =
        JSON.parse(localStorage.getItem("localExclusions")) || {};
    } catch (e) {
      localExclusionLists = {};
    }
  }

  function saveLocalExclusions() {
    localStorage.setItem(
      "localExclusions",
      JSON.stringify(localExclusionLists)
    );
  }

  // --- Функции для обновления UI ---
  function rebuildAndPopulateSelects(source) {
    if (!heroDataFromFirebase.lists) return;

    const mergedLists = {
      ...heroDataFromFirebase.lists,
      ...localExclusionLists,
    };

    const mainSelect = $("#hero-list");
    const modalSelect = $("#modal-list-select");
    const currentMainVal = mainSelect.val();

    mainSelect.empty();
    modalSelect.empty();

    Object.keys(mergedLists)
      .sort()
      .forEach((listName) => {
        mainSelect.append($("<option>", { value: listName, text: listName }));
        // В модальное окно настроек добавляем только "чистые" списки
        if (!listName.endsWith(EXCLUSION_SUFFIX)) {
          modalSelect.append(
            $("<option>", { value: listName, text: listName })
          );
        }
      });

    const newSelected =
      heroDataFromFirebase.selected ||
      Object.keys(heroDataFromFirebase.lists)[0];
    mainSelect.val(
      Object.keys(mergedLists).includes(currentMainVal)
        ? currentMainVal
        : newSelected
    );
    modalSelect.val(newSelected);
    updateModalTextarea();
    updateSessionButtonsVisibility();
    console.log(`Списки обновлены из: ${source}`);
  }

  function updateModalTextarea() {
    const selectedList = $("#modal-list-select").val();
    if (
      selectedList &&
      heroDataFromFirebase.lists &&
      heroDataFromFirebase.lists[selectedList]
    ) {
      $("#heroes-textarea").val(
        heroDataFromFirebase.lists[selectedList].join("\n")
      );
    }
  }

  // --- Основная логика рандомизации ---
  function generateTeams() {
    if (!heroDataFromFirebase.lists) {
      return getAlpineState().showToast(
        "Списки героев еще не загружены.",
        "error"
      );
    }
    const selectedListName = $("#hero-list").val();
    const mergedLists = {
      ...heroDataFromFirebase.lists,
      ...localExclusionLists,
    };
    const heroes = mergedLists[selectedListName];

    if (!heroes || heroes.length < 4) {
      return getAlpineState().showToast(
        "В выбранном списке должно быть не менее 4 героев!",
        "error"
      );
    }

    currentPlayers = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    currentHeroes = [...heroes].sort(() => Math.random() - 0.5).slice(0, 4);

    displayResults();
    saveLastGeneration();
    $("#trigger-results-modal").click();
  }

  function displayResults() {
    const resultsContent = $("#results-content").empty();
    currentHeroes.forEach((hero, i) => {
      const playerDiv = $("<div>", {
        class:
          "py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center",
      });
      const textSpan = $("<span>").text(`Игрок ${currentPlayers[i]}: ${hero}`);
      const excludeBtn = $("<button>", {
        class:
          "p-1 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0 ml-2",
        "data-hero-name": hero,
        "data-player-index": i,
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      });
      playerDiv.append(textSpan, excludeBtn);
      resultsContent.append(playerDiv);
    });
  }

  function rerollTeams() {
    currentPlayers.sort(() => 0.5 - Math.random());
    displayResults();
    saveLastGeneration();
  }
  function rerollHeroes() {
    generateTeams();
  }

  // --- Логика исключения героев (теперь полностью локальная) ---
  function excludeHeroes(heroesToExclude) {
    const mergedLists = {
      ...heroDataFromFirebase.lists,
      ...localExclusionLists,
    };
    const currentListName = $("#hero-list").val();
    const baseListName = getBaseListName(currentListName);
    const exclusionListName = baseListName + EXCLUSION_SUFFIX;
    const sourceHeroes = mergedLists[currentListName];
    const newHeroList = sourceHeroes.filter(
      (h) => !heroesToExclude.includes(h)
    );

    if (newHeroList.length < 4) {
      return getAlpineState().showToast(
        "После исключения в списке останется меньше 4 героев.",
        "error"
      );
    }

    localExclusionLists[exclusionListName] = newHeroList;
    saveLocalExclusions();
    rebuildAndPopulateSelects("локальной сессии");
    $("#hero-list").val(exclusionListName); // ИСПРАВЛЕНО: Автоматически выбираем новый список

    $("#trigger-close-results-modal").click();
    localStorage.removeItem("lastGeneration");
    updateSessionButtonsVisibility();
  }

  function excludeSingleHero(heroToExclude, playerIndex) {
    const mergedLists = {
      ...heroDataFromFirebase.lists,
      ...localExclusionLists,
    };
    const currentListName = $("#hero-list").val();
    const baseListName = getBaseListName(currentListName);
    const exclusionListName = baseListName + EXCLUSION_SUFFIX;
    const sourceList = mergedLists[currentListName];
    const newExclusionList = sourceList.filter((h) => h !== heroToExclude);
    const otherHeroes = currentHeroes.filter((h) => h !== heroToExclude);
    const replacementPool = newExclusionList.filter(
      (h) => !otherHeroes.includes(h)
    );

    if (replacementPool.length === 0) {
      return getAlpineState().showToast(
        "Нет доступных героев для замены!",
        "error"
      );
    }

    localExclusionLists[exclusionListName] = newExclusionList;
    saveLocalExclusions();
    rebuildAndPopulateSelects("локальной сессии");
    $("#hero-list").val(exclusionListName);

    currentHeroes[playerIndex] =
      replacementPool[Math.floor(Math.random() * replacementPool.length)];

    displayResults();
    saveLastGeneration();
  }

  function resetSession() {
    localExclusionLists = {};
    saveLocalExclusions();
    localStorage.removeItem("lastGeneration");
    rebuildAndPopulateSelects("сброса сессии");
    getAlpineState().showToast("Сессия сброшена!", "success");
  }

  // --- Инициализация и обработчики событий ---
  function initApp() {
    if (!window.db || !window.firestore) {
      return;
    }
    const { onSnapshot, doc } = window.firestore;
    window.listsDocRef = doc(window.db, "lists", "main");

    const settingsBtn = $("#settings-btn");
    const syncIndicator = $("#sync-indicator");

    loadLocalExclusions(); // Загружаем локальные исключения при старте

    syncIndicator.removeClass("hidden");
    settingsBtn.addClass("hidden");

    onSnapshot(
      window.listsDocRef,
      (docSnap) => {
        const source = docSnap.metadata.fromCache ? "кэша" : "сервера";
        if (docSnap.exists()) {
          heroDataFromFirebase = docSnap.data();
          rebuildAndPopulateSelects(source);
        } else {
          getAlpineState().showToast("База данных не найдена.", "error");
        }
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      },
      (error) => {
        getAlpineState().showToast(
          "Ошибка подключения к базе. Работа в оффлайн-режиме.",
          "error"
        );
        console.error("Firestore snapshot error:", error);
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      }
    );

    updateSessionButtonsVisibility();

    // -- ОБРАБОТЧИКИ СОБЫТИЙ --
    $("#generate-btn").on("click", generateTeams);
    $("#remix-teams-btn").on("click", rerollTeams);
    $("#remix-heroes-btn").on("click", rerollHeroes);
    $("#reset-btn").on("click", generateTeams);
    $("#show-last-gen-btn").on("click", () => {
      if (loadLastGeneration()) {
        displayResults();
        $("#trigger-results-modal").click();
      } else {
        getAlpineState().showToast("Нет данных о последней генерации.");
      }
    });

    // ИСПРАВЛЕНО: Надежный вызов модального окна подтверждения
    $("#reset-session-btn").on("click", () => {
      const event = new CustomEvent("open-confirm-modal", {
        detail: {
          title: "Сбросить сессию?",
          message:
            "Все временные списки и последняя генерация будут удалены. Это действие нельзя отменить.",
          onConfirm: resetSession,
        },
      });
      window.dispatchEvent(event);
    });

    $("#exclude-all-btn").on("click", () => excludeHeroes(currentHeroes));
    $("#results-content").on("click", "button", function () {
      excludeSingleHero(
        $(this).data("hero-name"),
        $(this).data("player-index")
      );
    });

    // -- Логика модального окна настроек (работает только с Firebase) --
    $("#login-btn").on("click", async () => {
      const hash = await sha256($("#password-input").val());
      if (hash === PWD_HASH) {
        $("#password-section").addClass("hidden");
        $("#management-section").removeClass("hidden");
      } else {
        getAlpineState().showToast("Неверный пароль!", "error");
      }
    });
    $("#modal-list-select").on("change", updateModalTextarea);

    const saveFirebaseChanges = async (updatedData, successMsg, errorMsg) => {
      try {
        await window.firestore.setDoc(window.listsDocRef, updatedData);
        getAlpineState().showToast(successMsg, "success");
      } catch (error) {
        getAlpineState().showToast(errorMsg, "error");
      }
    };

    $("#set-default-btn").on("click", () => {
      const updatedData = {
        ...heroDataFromFirebase,
        selected: $("#modal-list-select").val(),
      };
      saveFirebaseChanges(
        updatedData,
        `Список "${updatedData.selected}" установлен по умолчанию!`,
        "Не удалось сохранить изменения."
      );
    });
    $("#save-list-btn").on("click", () => {
      const listName = $("#modal-list-select").val();
      const heroes = $("#heroes-textarea")
        .val()
        .split("\n")
        .map((h) => h.trim())
        .filter((h) => h);
      const updatedData = { ...heroDataFromFirebase };
      updatedData.lists[listName] = heroes;
      saveFirebaseChanges(
        updatedData,
        `Список "${listName}" сохранен!`,
        "Не удалось сохранить изменения."
      );
    });
    $("#create-list-btn").on("click", () => {
      const newName = $("#new-list-name").val().trim();
      if (!newName)
        return getAlpineState().showToast(
          "Введите имя нового списка!",
          "error"
        );
      if (heroDataFromFirebase.lists[newName])
        return getAlpineState().showToast(
          "Список с таким именем уже существует!",
          "error"
        );
      const updatedData = { ...heroDataFromFirebase };
      updatedData.lists[newName] = [];
      saveFirebaseChanges(
        updatedData,
        `Список "${newName}" создан!`,
        "Не удалось создать список."
      ).then(() => $("#new-list-name").val(""));
    });
    $("#delete-list-btn").on("click", () => {
      const listName = $("#modal-list-select").val();
      if (Object.keys(heroDataFromFirebase.lists).length <= 1) {
        return getAlpineState().showToast(
          "Нельзя удалить последний список!",
          "error"
        );
      }
      const event = new CustomEvent("open-confirm-modal", {
        detail: {
          title: "Удалить список?",
          message: `Вы уверены, что хотите удалить список "${listName}"? Это действие нельзя отменить.`,
          onConfirm: async () => {
            const updatedData = { ...heroDataFromFirebase };
            delete updatedData.lists[listName];
            if (updatedData.selected === listName) {
              updatedData.selected = Object.keys(updatedData.lists)[0];
            }
            await saveFirebaseChanges(
              updatedData,
              `Список "${listName}" удален!`,
              "Не удалось удалить список."
            );
          },
        },
      });
      window.dispatchEvent(event);
    });
  }

  if (window.db) {
    initApp();
  }
});
