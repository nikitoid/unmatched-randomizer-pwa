$(document).ready(function () {
  // --- Глобальные переменные ---
  let currentPlayers = [];
  let currentHeroes = [];
  let heroData = {}; // Локальный кэш данных
  const CACHE_KEY = "heroListsCache";

  // --- Функции для работы с кэшем (localStorage) ---
  function saveDataToCache(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }

  function loadDataFromCache() {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // --- Функции для работы с API ---
  async function loadListsFromServer() {
    const response = await fetch("/api/lists");
    if (!response.ok) {
      throw new Error(
        `Network response was not ok, status: ${response.status}`
      );
    }
    return await response.json();
  }

  // --- Функции для обновления UI ---
  function populateSelects(data) {
    if (!data || !data.lists) {
      console.error("Попытка заполнить списки неверными данными", data);
      return;
    }
    const mainSelect = $("#hero-list");
    const modalSelect = $("#modal-list-select");

    mainSelect.empty();
    modalSelect.empty();

    for (const listName in data.lists) {
      mainSelect.append($("<option>", { value: listName, text: listName }));
      modalSelect.append($("<option>", { value: listName, text: listName }));
    }
    mainSelect.val(data.selected);
    modalSelect.val(data.selected);
    updateModalTextarea();
  }

  function updateModalTextarea() {
    const selectedList = $("#modal-list-select").val();
    if (selectedList && heroData.lists && heroData.lists[selectedList]) {
      $("#heroes-textarea").val(heroData.lists[selectedList].join("\n"));
    }
  }

  // --- Основная логика рандомизации ---
  function generateTeams() {
    if (!heroData.selected || !heroData.lists) {
      alert(
        "Списки героев не загружены. Проверьте соединение с сервером или попробуйте перезагрузить страницу."
      );
      return;
    }
    const selectedListName = heroData.selected;
    const heroes = heroData.lists[selectedListName];

    if (!heroes || heroes.length < 4) {
      alert("В выбранном списке должно быть не менее 4 героев!");
      return;
    }

    currentPlayers = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    currentHeroes = [...heroes].sort(() => Math.random() - 0.5).slice(0, 4);

    displayResults();
    $("#results-section, #controls-panel").removeClass("hidden");
  }

  function displayResults() {
    for (let i = 0; i < 4; i++) {
      $(`#player${i + 1}`).text(
        `Игрок ${currentPlayers[i]}: ${currentHeroes[i]}`
      );
    }
  }

  function rerollTeams() {
    currentPlayers.sort(() => Math.random() - 0.5);
    displayResults();
  }

  function rerollHeroes() {
    const heroes = heroData.lists[heroData.selected];
    if (!heroes || heroes.length < 4) return;
    currentHeroes = [...heroes].sort(() => Math.random() - 0.5).slice(0, 4);
    displayResults();
  }

  // --- Инициализация и обработчики событий ---
  async function initApp() {
    const settingsBtn = $("#settings-btn");
    const syncIndicator = $("#update-indicator");

    syncIndicator.removeClass("hidden");
    settingsBtn.addClass("hidden");

    try {
      const serverData = await loadListsFromServer();
      heroData = serverData;
      saveDataToCache(serverData);
      console.log("Данные успешно загружены с сервера и кэшированы.");
    } catch (error) {
      console.warn(
        "Не удалось подключиться к серверу. Загрузка данных из кэша.",
        error
      );
      heroData = loadDataFromCache();
      if (!heroData) {
        alert(
          "Ошибка сети. Не удалось загрузить данные ни с сервера, ни из локального кэша."
        );
      }
    } finally {
      populateSelects(heroData);
      syncIndicator.addClass("hidden");
      settingsBtn.removeClass("hidden");
    }

    // -- Обработчики главного экрана --
    $("#generate-btn").on("click", generateTeams);
    $("#remix-teams-btn").on("click", rerollTeams);
    $("#remix-heroes-btn").on("click", rerollHeroes);
    $("#reset-btn").on("click", generateTeams);

    $("#hero-list").on("change", async function () {
      const password = prompt("Для смены списка по-умолчанию введите пароль:");
      if (!password) return populateSelects(heroData);

      try {
        const response = await fetch("/api/lists", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected: $(this).val(), password: password }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        heroData = result.data;
        saveDataToCache(heroData); // Обновляем кэш
        populateSelects(heroData);
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
        populateSelects(heroData);
      }
    });

    // -- Обработчики модального окна --
    $("#login-btn").on("click", () => {
      $("#password-section").addClass("hidden");
      $("#management-section").removeClass("hidden");
    });

    $("#modal-list-select").on("change", updateModalTextarea);

    $("#save-list-btn").on("click", async function () {
      const listName = $("#modal-list-select").val();
      const heroes = $("#heroes-textarea")
        .val()
        .split("\n")
        .map((h) => h.trim())
        .filter((h) => h);
      const password = $("#password-input").val();
      if (!password) return alert("Введите пароль!");

      try {
        const response = await fetch("/api/lists", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: listName,
            heroes: heroes,
            selected: heroData.selected,
            password: password,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        heroData = result.data;
        saveDataToCache(heroData);
        populateSelects(heroData);
        alert(`Список "${listName}" сохранен!`);
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    });

    $("#create-list-btn").on("click", async function () {
      const newName = $("#new-list-name").val().trim();
      if (!newName) return alert("Введите имя нового списка!");
      const password = $("#password-input").val();
      if (!password) return alert("Введите пароль!");

      try {
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newName,
            password: password,
            selected: heroData.selected,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        heroData = result.data;
        saveDataToCache(heroData);
        populateSelects(heroData);
        $("#modal-list-select").val(newName);
        updateModalTextarea();
        $("#new-list-name").val("");
        alert(`Список "${newName}" создан!`);
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    });

    $("#delete-list-btn").on("click", async function () {
      const listName = $("#modal-list-select").val();
      const password = $("#password-input").val();
      if (!password) return alert("Введите пароль!");

      if (confirm(`Вы уверены, что хотите удалить список "${listName}"?`)) {
        try {
          const response = await fetch(`/api/lists/${listName}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: password }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);

          heroData = result.data;
          saveDataToCache(heroData);
          populateSelects(heroData);
          alert(`Список "${listName}" удален!`);
        } catch (error) {
          alert(`Ошибка: ${error.message}`);
        }
      }
    });
  }

  initApp();
});
