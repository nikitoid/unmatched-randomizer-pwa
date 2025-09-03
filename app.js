$(document).ready(function () {
  // --- Глобальные переменные и константы ---
  let currentPlayers = [];
  let currentHeroes = [];
  const PWD_HASH =
    "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // SHA-256 for '1234'
  const defaultHeroes = [
    "Алиса",
    "Медуза",
    "Синдбад",
    "Король Артур",
    "Бигфут",
    "Робин Гуд",
  ];

  // --- Функции для работы с localStorage ---

  /**
   * Загружает списки героев из localStorage или создает дефолтный.
   * @returns {object} - Объект со списками героев.
   */
  function loadListsFromStorage() {
    let data = localStorage.getItem("heroLists");
    if (!data) {
      data = {
        selected: "Default",
        lists: {
          Default: defaultHeroes,
        },
      };
      saveListsToStorage(data);
      return data;
    }
    return JSON.parse(data);
  }

  /**
   * Сохраняет объект со списками в localStorage.
   * @param {object} data - Объект для сохранения.
   */
  function saveListsToStorage(data) {
    localStorage.setItem("heroLists", JSON.stringify(data));
  }

  // --- Функции для хэширования ---

  /**
   * Асинхронно хэширует строку с помощью SHA-256.
   * @param {string} message - Строка для хэширования.
   * @returns {Promise<string>} - Хэш в виде hex-строки.
   */
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  // --- Функции для обновления UI ---

  /**
   * Заполняет выпадающие списки (select) на основе данных из localStorage.
   */
  function populateSelects() {
    const data = loadListsFromStorage();
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
    const data = loadListsFromStorage();
    const selectedList = $("#modal-list-select").val();
    if (selectedList && data.lists[selectedList]) {
      const heroesText = data.lists[selectedList].join("\n");
      $("#heroes-textarea").val(heroesText);
    }
  }

  // --- Основная логика рандомизации ---

  /**
   * Основная функция для генерации команд.
   */
  function generateTeams() {
    const data = loadListsFromStorage();
    const selectedListName = data.selected;
    const heroes = data.lists[selectedListName];

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

  /**
   * Отображает результаты в UI.
   */
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
    const data = loadListsFromStorage();
    const heroes = data.lists[data.selected];
    if (!heroes || heroes.length < 4) return;

    const shuffledHeroes = [...heroes].sort(() => Math.random() - 0.5);
    currentHeroes = shuffledHeroes.slice(0, 4);
    displayResults();
  }

  // --- Инициализация и обработчики событий ---

  function initApp() {
    populateSelects();

    // -- Обработчики главного экрана --
    $("#generate-btn").on("click", generateTeams);
    $("#remix-teams-btn").on("click", rerollTeams);
    $("#remix-heroes-btn").on("click", rerollHeroes);
    $("#reset-btn").on("click", generateTeams);

    $("#hero-list").on("change", function () {
      const data = loadListsFromStorage();
      data.selected = $(this).val();
      saveListsToStorage(data);
    });

    // -- Обработчики модального окна --
    $("#login-btn").on("click", async function () {
      const password = $("#password-input").val();
      const hash = await sha256(password);
      if (hash === PWD_HASH) {
        $("#password-section").addClass("hidden");
        $("#management-section").removeClass("hidden");
      } else {
        alert("Неверный пароль!");
        $("#password-input").val("");
      }
    });

    $("#modal-list-select").on("change", updateModalTextarea);

    $("#save-list-btn").on("click", function () {
      const listName = $("#modal-list-select").val();
      const heroesText = $("#heroes-textarea").val();
      const heroes = heroesText
        .split("\n")
        .map((h) => h.trim())
        .filter((h) => h);

      const data = loadListsFromStorage();
      data.lists[listName] = heroes;
      saveListsToStorage(data);
      alert(`Список "${listName}" сохранен!`);
    });

    $("#create-list-btn").on("click", function () {
      const newName = $("#new-list-name").val().trim();
      if (!newName) {
        alert("Введите имя нового списка!");
        return;
      }
      const data = loadListsFromStorage();
      if (data.lists[newName]) {
        alert("Список с таким именем уже существует!");
        return;
      }
      data.lists[newName] = [];
      saveListsToStorage(data);
      populateSelects();
      $("#modal-list-select").val(newName);
      updateModalTextarea();
      $("#new-list-name").val("");
      alert(`Список "${newName}" создан!`);
    });

    $("#delete-list-btn").on("click", function () {
      const listName = $("#modal-list-select").val();
      const data = loadListsFromStorage();
      if (Object.keys(data.lists).length <= 1) {
        alert("Нельзя удалить последний список!");
        return;
      }
      if (confirm(`Вы уверены, что хотите удалить список "${listName}"?`)) {
        delete data.lists[listName];
        // Если удалили активный список, переключаемся на первый доступный
        if (data.selected === listName) {
          data.selected = Object.keys(data.lists)[0];
        }
        saveListsToStorage(data);
        populateSelects();
      }
    });
  }

  // Запускаем приложение
  initApp();
});
