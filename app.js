// Импортируем функции Firestore из глобального window
import {
  doc,
  onSnapshot,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

$(document).ready(function () {
  // --- Глобальные переменные и константы ---
  let currentPlayers = [];
  let currentHeroes = [];
  let heroData = {}; // Локальная копия данных из Firestore
  const db = window.db; // Получаем инстанс Firestore из index.html
  const listsDocRef = doc(db, "lists", "main"); // Ссылка на наш единственный документ
  const PWD_HASH =
    "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

  // --- Вспомогательные функции ---
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
  function populateSelects(data) {
    if (!data || !data.lists) return;
    heroData = data;

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
    const selectedListName = $("#hero-list").val();
    if (!selectedListName || !heroData.lists[selectedListName]) {
      alert("Данные о героях еще не загружены или список пуст.");
      return;
    }
    const heroes = heroData.lists[selectedListName];

    if (!heroes || heroes.length < 4) {
      alert("В выбранном списке должно быть не менее 4 героев!");
      return;
    }

    currentPlayers = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    currentHeroes = [...heroes].sort(() => Math.random() - 0.5).slice(0, 4);

    displayResults();

    // Открываем модальное окно через кастомное событие
    window.dispatchEvent(new CustomEvent("open-results"));
  }

  function displayResults() {
    // Теперь результаты отображаются в модальном окне
    const resultsContent = $("#results-content");
    for (let i = 0; i < 4; i++) {
      resultsContent
        .find(`#player${i + 1}`)
        .text(`Игрок ${currentPlayers[i]}: ${currentHeroes[i]}`);
    }
  }

  function rerollTeams() {
    currentPlayers.sort(() => Math.random() - 0.5);
    displayResults();
  }

  function rerollHeroes() {
    const selectedListName = $("#hero-list").val();
    const heroes = heroData.lists[selectedListName];
    if (!heroes || heroes.length < 4) return;
    currentHeroes = [...heroes].sort(() => Math.random() - 0.5).slice(0, 4);
    displayResults();
  }

  // --- Логика свайпа для закрытия модального окна результатов ---
  function setupSwipeToClose() {
    const panel = document.getElementById("results-panel");
    const handle = document.getElementById("drag-handle");
    let startY;

    const onTouchStart = (e) => {
      startY = e.touches[0].clientY;
      panel.style.transition = "none"; // Отключаем анимацию во время свайпа
    };

    const onTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      let deltaY = currentY - startY;
      if (deltaY < 0) deltaY = 0; // Не даем свайпать вверх

      panel.style.transform = `translateY(${deltaY}px)`;
    };

    const onTouchEnd = (e) => {
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startY;
      panel.style.transition = "transform 0.3s ease-out"; // Включаем анимацию обратно

      if (deltaY > 100) {
        // Если свайпнули достаточно далеко
        // Закрываем модальное окно через Alpine
        const alpineComponent = document.querySelector("[x-data]").__x;
        alpineComponent.data.isResultsModalOpen = false;
      } else {
        panel.style.transform = "translateY(0)"; // Возвращаем панель на место
      }
    };

    handle.addEventListener("touchstart", onTouchStart, { passive: true });
    handle.addEventListener("touchmove", onTouchMove, { passive: true });
    handle.addEventListener("touchend", onTouchEnd);
  }

  // --- Инициализация и обработчики событий ---
  function initApp() {
    const settingsBtn = $("#settings-btn");
    const syncIndicator = $("#update-indicator");

    syncIndicator.removeClass("hidden");
    settingsBtn.addClass("hidden");

    onSnapshot(
      listsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          populateSelects(docSnap.data());
        } else {
          alert("База данных не найдена. Обратитесь к администратору.");
        }
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      },
      (error) => {
        alert(
          "Не удалось подключиться к базе данных. Проверьте интернет-соединение."
        );
        syncIndicator.addClass("hidden");
        settingsBtn.removeClass("hidden");
      }
    );

    setupSwipeToClose();

    // -- ОБРАБОТЧИКИ СОБЫТИЙ --
    $("#generate-btn").on("click", generateTeams);
    $("#remix-teams-btn").on("click", rerollTeams);
    $("#remix-heroes-btn").on("click", rerollHeroes);
    $("#reset-btn").on("click", generateTeams);

    // -- Логика модального окна настроек --
    $("#login-btn").on("click", async () => {
      const password = $("#password-input").val();
      const hash = await sha256(password);

      if (hash === PWD_HASH) {
        $("#password-section").addClass("hidden");
        $("#management-section").removeClass("hidden");
      } else {
        alert("Неверный пароль!");
      }
    });

    $("#modal-list-select").on("change", updateModalTextarea);

    $("#set-default-btn").on("click", async function () {
      const newSelectedList = $("#modal-list-select").val();
      heroData.selected = newSelectedList;
      try {
        await setDoc(listsDocRef, heroData);
        alert(`Список "${newSelectedList}" установлен по умолчанию!`);
      } catch (error) {
        alert("Не удалось сохранить изменения.");
      }
    });

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
        if (heroData.selected === listName) {
          heroData.selected = Object.keys(heroData.lists)[0];
        }
        try {
          await setDoc(listsDocRef, heroData);
          alert(`Список "${listName}" удален!`);
        } catch (error) {
          alert("Не удалось удалить список.");
        }
      }
    });
  }

  initApp();
});
