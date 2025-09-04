// Ждем, пока Alpine.js и Firebase будут готовы
$(document).ready(function () {
  // --- Глобальные переменные и константы ---
  let currentPlayers = [];
  let currentHeroes = [];
  let heroDataFromFirebase = {};
  let localExclusionLists = {};
  let isDbAuthenticated = false;

  const EXCLUSION_SUFFIX = " (искл.)";
  const getAlpineState = () => document.querySelector("[x-data]").__x.$data;

  // --- Вспомогательные функции ---
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
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
    const isOnline = navigator.onLine;
    const onlineLists = heroDataFromFirebase.lists || {};
    const mergedLists = { ...onlineLists, ...localExclusionLists };

    const mainSelect = $("#hero-list");
    const modalSelect = $("#modal-list-select");
    const currentMainVal = mainSelect.val();

    mainSelect.empty();
    modalSelect.empty();

    const defaultList =
      heroDataFromFirebase.selected || Object.keys(onlineLists)[0];

    Object.keys(mergedLists)
      .sort()
      .forEach((listName) => {
        const isDefault = listName === defaultList;
        const optionText = isDefault ? `★ ${listName}` : listName;
        mainSelect.append($("<option>", { value: listName, text: optionText }));
      });

    if (isOnline) {
      Object.keys(onlineLists)
        .sort()
        .forEach((name) => {
          const isDefault = name === defaultList;
          const optionText = isDefault ? `★ ${name}` : name;
          modalSelect.append($("<option>", { value: name, text: optionText }));
        });
    }
    Object.keys(localExclusionLists)
      .sort()
      .forEach((name) => {
        modalSelect.append($("<option>", { value: name, text: name }));
      });

    mainSelect.val(
      Object.keys(mergedLists).includes(currentMainVal)
        ? currentMainVal
        : defaultList
    );

    if (modalSelect.find("option").length > 0) {
      modalSelect.val(modalSelect.find("option:first").val());
    }

    handleSettingsListChange();
    updateSessionButtonsVisibility();
    console.log(`Списки обновлены из: ${source}`);
  }

  function handleSettingsListChange() {
    let selectedList = $("#modal-list-select").val();
    if (!selectedList) {
      $("#heroes-textarea").val("");
      $(
        "#save-list-btn, #set-default-btn, #delete-list-btn, #create-list-btn"
      ).prop("disabled", true);
      return;
    }

    const isLocal = selectedList.endsWith(EXCLUSION_SUFFIX);
    const mergedLists = {
      ...(heroDataFromFirebase.lists || {}),
      ...localExclusionLists,
    };

    $("#heroes-textarea").val(mergedLists[selectedList].join("\n"));

    if (isLocal) {
      $("#save-list-btn, #delete-list-btn").prop("disabled", false);
      $("#set-default-btn, #create-list-btn").prop("disabled", true);
    } else {
      $(
        "#save-list-btn, #set-default-btn, #delete-list-btn, #create-list-btn"
      ).prop("disabled", !isDbAuthenticated);
    }
  }

  // --- Основная логика рандомизации ---
  function generateTeams() {
    const mergedLists = {
      ...(heroDataFromFirebase.lists || {}),
      ...localExclusionLists,
    };
    if (Object.keys(mergedLists).length === 0) {
      return getAlpineState().showToast(
        "Списки героев еще не загружены.",
        "error"
      );
    }
    const selectedListName = $("#hero-list").val();
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
      const textSpan = $("<span>", { class: "pr-2" }).text(
        `Игрок ${currentPlayers[i]}: ${hero}`
      );
      const excludeBtn = $("<button>", {
        class:
          "p-1 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0 ml-auto",
        "data-hero-name": hero,
        "data-player-index": i,
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
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

  // --- Логика исключения героев (полностью локальная) ---
  function excludeHeroes(heroesToExclude) {
    const mergedLists = {
      ...(heroDataFromFirebase.lists || {}),
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
    $("#hero-list").val(exclusionListName);

    $("#trigger-close-results-modal").click();
    localStorage.removeItem("lastGeneration");
    updateSessionButtonsVisibility();
  }

  function excludeSingleHero(heroToExclude, playerIndex) {
    const mergedLists = {
      ...(heroDataFromFirebase.lists || {}),
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
    if (!window.db || !window.firestore) return;

    const { onSnapshot, doc } = window.firestore;
    window.listsDocRef = doc(window.db, "lists", "main");

    const settingsBtn = $("#settings-btn");
    const syncIndicator = $("#sync-indicator");

    loadLocalExclusions();

    syncIndicator.removeClass("hidden");
    settingsBtn.addClass("hidden");

    onSnapshot(
      window.listsDocRef,
      (docSnap) => {
        const source = docSnap.metadata.fromCache ? "кэша" : "сервера";
        if (docSnap.exists()) {
          heroDataFromFirebase = docSnap.data();
          isDbAuthenticated = false;
          rebuildAndPopulateSelects(source);
        } else {
          getAlpineState().showToast("База данных не найдена.", "error");
        }
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      },
      (error) => {
        getAlpineState().showToast(
          "Нет связи с БД. Работа в оффлайн-режиме.",
          "error"
        );
        rebuildAndPopulateSelects("ошибки сети");
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      }
    );

    updateSessionButtonsVisibility();

    // -- ОСНОВНЫЕ ОБРАБОТЧИКИ --
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

    // -- ОБРАБОТЧИКИ НАСТРОЕК --
    window.addEventListener("settings-opened", () => {
      const currentList = $("#hero-list").val();
      $("#modal-list-select").val(currentList);
      handleSettingsListChange();
    });
    window.addEventListener("settings-closed", () => {
      isDbAuthenticated = false;
    });

    $("#modal-list-select").on("change", function () {
      const selectedList = $(this).val();
      if (
        selectedList &&
        !selectedList.endsWith(EXCLUSION_SUFFIX) &&
        !isDbAuthenticated
      ) {
        $("#trigger-db-password-modal").click();
      }
      handleSettingsListChange();
    });

    $("#check-db-password-btn").on("click", async () => {
      const hash = await sha256($("#db-password-input").val());
      if (hash === heroDataFromFirebase.passwordHash) {
        isDbAuthenticated = true;
        handleSettingsListChange(); // ИСПРАВЛЕНО: Немедленно обновляем UI
        getAlpineState().isDbPasswordModalOpen = false;
        getAlpineState().showToast("Доступ предоставлен!", "success");
      } else {
        getAlpineState().showToast("Неверный пароль!", "error");
      }
    });

    const saveFirebaseChanges = async (updatedData, successMsg, errorMsg) => {
      try {
        await window.firestore.setDoc(window.listsDocRef, updatedData);
        getAlpineState().showToast(successMsg, "success");
      } catch (error) {
        getAlpineState().showToast(errorMsg, "error");
      }
    };

    const saveLocalListChanges = (listName, heroes, successMsg) => {
      localExclusionLists[listName] = heroes;
      saveLocalExclusions();
      rebuildAndPopulateSelects("локального сохранения");
      getAlpineState().showToast(successMsg, "success");
    };

    $("#save-list-btn").on("click", () => {
      const listName = $("#modal-list-select").val();
      const heroes = $("#heroes-textarea")
        .val()
        .split("\n")
        .map((h) => h.trim())
        .filter((h) => h);

      if (listName.endsWith(EXCLUSION_SUFFIX)) {
        saveLocalListChanges(
          listName,
          heroes,
          `Локальный список "${listName}" сохранен!`
        );
      } else {
        const updatedData = { ...heroDataFromFirebase };
        updatedData.lists[listName] = heroes;
        saveFirebaseChanges(
          updatedData,
          `Список "${listName}" сохранен в БД!`,
          "Не удалось сохранить изменения."
        );
      }
    });

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

    $("#confirm-create-list-btn").on("click", async () => {
      const newName = $("#new-list-name-input").val().trim();
      if (!newName)
        return getAlpineState().showToast(
          "Введите имя нового списка!",
          "error"
        );
      if (heroDataFromFirebase.lists[newName] || localExclusionLists[newName])
        return getAlpineState().showToast(
          "Список с таким именем уже существует!",
          "error"
        );

      const updatedData = { ...heroDataFromFirebase };
      updatedData.lists[newName] = [];
      await saveFirebaseChanges(
        updatedData,
        `Список "${newName}" создан!`,
        "Не удалось создать список."
      );

      getAlpineState().isCreateListModalOpen = false;
      $("#modal-list-select").val(newName); // Автоматический выбор нового списка
      handleSettingsListChange();
    });

    $("#delete-list-btn").on("click", () => {
      const listName = $("#modal-list-select").val();
      if (!listName) return;

      const onConfirm = () => {
        if (listName.endsWith(EXCLUSION_SUFFIX)) {
          delete localExclusionLists[listName];
          saveLocalExclusions();
          rebuildAndPopulateSelects("локального удаления");
          getAlpineState().showToast(
            `Локальный список "${listName}" удален!`,
            "success"
          );
        } else {
          if (Object.keys(heroDataFromFirebase.lists).length <= 1) {
            return getAlpineState().showToast(
              "Нельзя удалить последний список из БД!",
              "error"
            );
          }
          const updatedData = { ...heroDataFromFirebase };
          delete updatedData.lists[listName];
          if (updatedData.selected === listName) {
            updatedData.selected = Object.keys(updatedData.lists)[0];
          }
          saveFirebaseChanges(
            updatedData,
            `Список "${listName}" удален из БД!`,
            "Не удалось удалить список."
          );
        }
      };

      const event = new CustomEvent("open-confirm-modal", {
        detail: {
          title: "Удалить список?",
          message: `Вы уверены, что хотите удалить список "${listName}"? Это действие нельзя отменить.`,
          onConfirm,
        },
      });
      window.dispatchEvent(event);
    });
  }

  if (window.db) {
    initApp();
  }
});
