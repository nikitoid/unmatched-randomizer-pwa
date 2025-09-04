// Ждем, пока Alpine.js и Firebase будут готовы
$(document).ready(function () {
  // --- Глобальные переменные и константы ---
  let currentPlayers = [];
  let currentHeroes = [];
  let heroData = {}; // Локальная копия данных
  const PWD_HASH =
    "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // sha256 from '1234'
  const EXCLUSION_SUFFIX = " (искл.)";
  const getAlpineState = () => document.querySelector("[x-data]").__x.$data;

  // --- Вспомогательные функции ---
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-26", msgBuffer);
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
    const hasExclusionLists = Object.keys(heroData.lists || {}).some((name) =>
      name.endsWith(EXCLUSION_SUFFIX)
    );
    const hasLastGen = !!localStorage.getItem("lastGeneration");

    hasLastGen
      ? $("#show-last-gen-btn").removeClass("hidden")
      : $("#show-last-gen-btn").addClass("hidden");
    hasExclusionLists || hasLastGen
      ? $("#reset-session-btn").removeClass("hidden")
      : $("#reset-session-btn").addClass("hidden");
  }

  // --- Функции для обновления UI ---
  function populateSelects(data, source) {
    if (!data || !data.lists) return;
    heroData = data;

    const mainSelect = $("#hero-list");
    const modalSelect = $("#modal-list-select");
    const currentMainVal = mainSelect.val();

    mainSelect.empty();
    modalSelect.empty();

    Object.keys(data.lists)
      .sort()
      .forEach((listName) => {
        mainSelect.append($("<option>", { value: listName, text: listName }));
        modalSelect.append($("<option>", { value: listName, text: listName }));
      });

    const newSelected = data.selected || Object.keys(data.lists)[0];
    mainSelect.val(
      Object.keys(data.lists).includes(currentMainVal)
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
    if (selectedList && heroData.lists && heroData.lists[selectedList]) {
      $("#heroes-textarea").val(heroData.lists[selectedList].join("\n"));
    }
  }

  // --- Основная логика рандомизации ---
  function generateTeams() {
    if (!heroData || Object.keys(heroData).length === 0) {
      return getAlpineState().showToast(
        "Списки героев еще не загружены. Попробуйте позже.",
        "error"
      );
    }
    const selectedListName = $("#hero-list").val();
    const heroes = heroData.lists[selectedListName];

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

  // --- Логика исключения героев ---
  async function excludeHeroes(heroesToExclude) {
    const currentListName = $("#hero-list").val();
    const baseListName = getBaseListName(currentListName);
    const exclusionListName = baseListName + EXCLUSION_SUFFIX;
    const sourceHeroes = heroData.lists[currentListName];
    const newHeroList = sourceHeroes.filter(
      (h) => !heroesToExclude.includes(h)
    );

    if (newHeroList.length < 4) {
      return getAlpineState().showToast(
        "После исключения в списке останется меньше 4 героев.",
        "error"
      );
    }

    const updatedData = { ...heroData };
    updatedData.lists[exclusionListName] = newHeroList;
    updatedData.selected = exclusionListName;

    try {
      await window.firestore.setDoc(window.listsDocRef, updatedData);
      $("#trigger-close-results-modal").click();
      localStorage.removeItem("lastGeneration");
      updateSessionButtonsVisibility();
    } catch (error) {
      getAlpineState().showToast("Ошибка при исключении героев.", "error");
    }
  }

  async function excludeSingleHero(heroToExclude, playerIndex) {
    const currentListName = $("#hero-list").val();
    const baseListName = getBaseListName(currentListName);
    const exclusionListName = baseListName + EXCLUSION_SUFFIX;
    const sourceList = heroData.lists[currentListName];
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

    const updatedData = { ...heroData };
    updatedData.lists[exclusionListName] = newExclusionList;
    updatedData.selected = exclusionListName;

    currentHeroes[playerIndex] =
      replacementPool[Math.floor(Math.random() * replacementPool.length)];

    try {
      await window.firestore.setDoc(window.listsDocRef, updatedData);
      displayResults();
      saveLastGeneration();
    } catch (error) {
      getAlpineState().showToast("Ошибка при замене героя.", "error");
    }
  }

  async function resetSession() {
    const listsToDelete = Object.keys(heroData.lists).filter((name) =>
      name.endsWith(EXCLUSION_SUFFIX)
    );
    const updatedData = { ...heroData };
    let wasChanged = false;

    if (listsToDelete.length > 0) {
      listsToDelete.forEach((listName) => delete updatedData.lists[listName]);
      if (updatedData.selected.endsWith(EXCLUSION_SUFFIX)) {
        updatedData.selected = getBaseListName(updatedData.selected);
      }
      wasChanged = true;
    }

    if (localStorage.getItem("lastGeneration")) {
      localStorage.removeItem("lastGeneration");
      wasChanged = true;
    }

    if (wasChanged) {
      try {
        await window.firestore.setDoc(window.listsDocRef, updatedData);
        getAlpineState().showToast("Сессия сброшена!", "success");
      } catch (error) {
        getAlpineState().showToast("Не удалось сбросить сессию.", "error");
      }
    }
    updateSessionButtonsVisibility();
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

    syncIndicator.removeClass("hidden");
    settingsBtn.addClass("hidden");

    onSnapshot(
      window.listsDocRef,
      (docSnap) => {
        const source = docSnap.metadata.fromCache ? "кэша" : "сервера";
        if (docSnap.exists()) {
          populateSelects(docSnap.data(), source);
        } else {
          getAlpineState().showToast("База данных не найдена.", "error");
        }
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      },
      (error) => {
        getAlpineState().showToast("Ошибка подключения к базе.", "error");
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

    // -- Логика модального окна настроек --
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

    const saveChanges = async (updatedData, successMsg, errorMsg) => {
      try {
        await window.firestore.setDoc(window.listsDocRef, updatedData);
        getAlpineState().showToast(successMsg, "success");
      } catch (error) {
        getAlpineState().showToast(errorMsg, "error");
      }
    };

    $("#set-default-btn").on("click", () => {
      const updatedData = {
        ...heroData,
        selected: $("#modal-list-select").val(),
      };
      saveChanges(
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
      const updatedData = { ...heroData };
      updatedData.lists[listName] = heroes;
      saveChanges(
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
      if (heroData.lists[newName])
        return getAlpineState().showToast(
          "Список с таким именем уже существует!",
          "error"
        );
      const updatedData = { ...heroData };
      updatedData.lists[newName] = [];
      saveChanges(
        updatedData,
        `Список "${newName}" создан!`,
        "Не удалось создать список."
      ).then(() => $("#new-list-name").val(""));
    });
    $("#delete-list-btn").on("click", () => {
      const listName = $("#modal-list-select").val();
      if (Object.keys(heroData.lists).length <= 1) {
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
            const updatedData = { ...heroData };
            delete updatedData.lists[listName];
            if (updatedData.selected === listName) {
              updatedData.selected = Object.keys(updatedData.lists)[0];
            }
            await saveChanges(
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
