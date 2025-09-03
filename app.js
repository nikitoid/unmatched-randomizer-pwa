$(document).ready(function () {
  // --- Глобальные переменные ---
  let currentPlayers = [];
  let currentHeroes = [];
  let heroData = {}; // Кэш для данных с сервера

  // --- Функции для работы с API ---

  /**
   * Загружает списки героев с сервера.
   * @returns {Promise<object>} - Объект со списками героев.
   */
  async function loadListsFromServer() {
    try {
      const response = await fetch("/api/lists");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      heroData = await response.json();
      return heroData;
    } catch (error) {
      console.error("Failed to fetch lists:", error);
      alert("Не удалось загрузить списки с сервера!");
      return null;
    }
  }

  // --- Функции для обновления UI ---

  /**
   * Заполняет выпадающие списки (select) на основе данных с сервера.
   */
  function populateSelects(data) {
    if (!data) return;
    const mainSelect = $("#hero-list");
    const modalSelect = $("#modal-list-select");

    mainSelect.empty();
    modalSelect.empty();

    for (const listName in data.lists) {
      mainSelect.append(
        $("<option>", {
          value: listName,
          text: listName,
        })
      );
      modalSelect.append(
        $("<option>", {
          value: listName,
          text: listName,
        })
      );
    }
    mainSelect.val(data.selected);
    modalSelect.val(data.selected);
    updateModalTextarea();
  }

  /**
   * Обновляет textarea в модальном окне на основе выбранного списка.
   */
  function updateModalTextarea() {
    const selectedList = $("#modal-list-select").val();
    if (selectedList && heroData.lists && heroData.lists[selectedList]) {
      const heroesText = heroData.lists[selectedList].join("\n");
      $("#heroes-textarea").val(heroesText);
    }
  }

  // --- Основная логика рандомизации ---

  function generateTeams() {
    const selectedListName = heroData.selected;
    const heroes = heroData.lists[selectedListName];

    if (!heroes || heroes.length < 4) {
      alert("В выбранном списке должно быть не менее 4 героев!");
      return;
    }

    currentPlayers = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const shuffledHeroes = [...heroes].sort(() => Math.random() - 0.5);
    currentHeroes = shuffledHeroes.slice(0, 4);

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

    const shuffledHeroes = [...heroes].sort(() => Math.random() - 0.5);
    currentHeroes = shuffledHeroes.slice(0, 4);
    displayResults();
  }

  // --- Инициализация и обработчики событий ---

  async function initApp() {
    const data = await loadListsFromServer();
    populateSelects(data);

    // -- Обработчики главного экрана --
    $("#generate-btn").on("click", generateTeams);
    $("#remix-teams-btn").on("click", rerollTeams);
    $("#remix-heroes-btn").on("click", rerollHeroes);
    $("#reset-btn").on("click", generateTeams);

    $("#hero-list").on("change", async function () {
      const password = prompt("Для смены списка по-умолчанию введите пароль:");
      if (!password) return populateSelects(heroData); // Сбрасываем выбор если отмена

      try {
        const response = await fetch("/api/lists", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected: $(this).val(), password: password }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        heroData = result.data;
        populateSelects(heroData);
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
        populateSelects(heroData);
      }
    });

    // -- Обработчики модального окна --
    // Теперь пароль не проверяется на клиенте
    $("#login-btn").on("click", async function () {
      $("#password-section").addClass("hidden");
      $("#management-section").removeClass("hidden");
    });

    $("#modal-list-select").on("change", updateModalTextarea);

    $("#save-list-btn").on("click", async function () {
      const listName = $("#modal-list-select").val();
      const heroesText = $("#heroes-textarea").val();
      const heroes = heroesText
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
          body: JSON.stringify({ name: newName, password: password }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        heroData = result.data;
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
          populateSelects(heroData);
          alert(`Список "${listName}" удален!`);
        } catch (error) {
          alert(`Ошибка: ${error.message}`);
        }
      }
    });
  }

  // Запускаем приложение
  initApp();
});
