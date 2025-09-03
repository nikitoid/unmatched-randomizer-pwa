// Импортируем функции Firestore из глобального window
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

$(document).ready(function () {
  // --- Глобальные переменные ---
  let currentPlayers = [];
  let currentHeroes = [];
  let heroData = {}; // Локальная копия данных из Firestore
  const db = window.db; // Получаем инстанс Firestore из index.html

  // --- Ссылка на наш единственный документ в Firestore ---
  const listsDocRef = doc(db, "lists", "main");

  // --- Функции для обновления UI ---
  function populateSelects(data) {
    if (!data || !data.lists) return;
    heroData = data; // Обновляем локальный кэш

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
      alert("Данные о героях еще не загружены.");
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

    // Показываем индикатор загрузки
    syncIndicator.removeClass("hidden");
    settingsBtn.addClass("hidden");

    // Подписываемся на изменения в документе в реальном времени!
    onSnapshot(
      listsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Получены данные из Firestore:", data);
          populateSelects(data);
        } else {
          console.log("Документ не найден! Создайте его в консоли Firebase.");
          alert("База данных не найдена. Обратитесь к администратору.");
        }
        // Прячем индикатор после первой загрузки
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      },
      (error) => {
        console.error("Ошибка при получении данных из Firestore: ", error);
        alert(
          "Не удалось подключиться к базе данных. Проверьте интернет-соединение."
        );
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      }
    );

    // -- ОБРАБОТЧИКИ СОБЫТИЙ --

    $("#generate-btn").on("click", generateTeams);
    $("#remix-teams-btn").on("click", rerollTeams);
    $("#remix-heroes-btn").on("click", rerollHeroes);
    $("#reset-btn").on("click", generateTeams);

    $("#hero-list").on("change", async function () {
      const newSelectedList = $(this).val();
      heroData.selected = newSelectedList;
      try {
        await setDoc(listsDocRef, heroData);
        console.log("Список по умолчанию изменен.");
      } catch (error) {
        console.error("Ошибка при обновлении списка по умолчанию: ", error);
        alert("Не удалось сохранить изменения.");
      }
    });

    $("#modal-list-select").on("change", updateModalTextarea);

    $("#save-list-btn").on("click", async function () {
      const listName = $("#modal-list-select").val();
      const heroes = $("#heroes-textarea")
        .val()
        .split("\n")
        .map((h) => h.trim())
        .filter((h) => h);

      heroData.lists[listName] = heroes;
      try {
        await setDoc(listsDocRef, heroData);
        alert(`Список "${listName}" сохранен!`);
      } catch (error) {
        console.error("Ошибка сохранения: ", error);
        alert("Не удалось сохранить изменения.");
      }
    });

    $("#create-list-btn").on("click", async function () {
      const newName = $("#new-list-name").val().trim();
      if (!newName) return alert("Введите имя нового списка!");
      if (heroData.lists[newName])
        return alert("Список с таким именем уже существует!");

      heroData.lists[newName] = [];
      try {
        await setDoc(listsDocRef, heroData);
        $("#new-list-name").val("");
        alert(`Список "${newName}" создан!`);
      } catch (error) {
        console.error("Ошибка создания: ", error);
        alert("Не удалось создать список.");
      }
    });

    $("#delete-list-btn").on("click", async function () {
      const listName = $("#modal-list-select").val();
      if (Object.keys(heroData.lists).length <= 1) {
        return alert("Нельзя удалить последний список!");
      }

      if (confirm(`Вы уверены, что хотите удалить список "${listName}"?`)) {
        delete heroData.lists[listName];
        // Если удалили активный список, переключаемся на первый доступный
        if (heroData.selected === listName) {
          heroData.selected = Object.keys(heroData.lists)[0];
        }
        try {
          await setDoc(listsDocRef, heroData);
          alert(`Список "${listName}" удален!`);
        } catch (error) {
          console.error("Ошибка удаления: ", error);
          alert("Не удалось удалить список.");
        }
      }
    });
  }

  initApp();
});
