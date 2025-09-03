// Убедимся, что DOM полностью загружен
$(document).ready(function () {
  // Версия приложения (должна совпадать с версией кэша в service-worker.js)
  const APP_VERSION = "v3";
  $("#app-version").text(`Версия: ${APP_VERSION}`);

  // Регистрация Service Worker для PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker зарегистрирован успешно:", registration);
      })
      .catch((error) => {
        console.log("Ошибка регистрации Service Worker:", error);
      });

    // Слушаем сообщения от Service Worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "UPDATING") {
        console.log("Начинается обновление приложения...");
        // Показываем индикатор загрузки вместо шестеренки
        $("#settings-btn").addClass("hidden");
        $("#update-indicator").removeClass("hidden");
      }
    });

    // Если Service Worker изменился, перезагружаем страницу, чтобы применить обновления
    let refreshing;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      console.log("Приложение обновлено. Перезагрузка...");
      window.location.reload();
      refreshing = true;
    });
  }

  // Получаем элементы со страницы
  const generateBtn = $("#generate-btn");
  const resultsSection = $("#results-section");
  const controlsPanel = $("#controls-panel");

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

  // Клик по главной кнопке "Сгенерировать"
  generateBtn.on("click", function () {
    console.log("Генерация команд...");

    // Показываем скрытые секции с результатами и кнопками
    resultsSection.removeClass("hidden");
    controlsPanel.removeClass("hidden");

    // Сюда будет добавлена основная логика рандомайзера
    // 1. Получить список героев
    // 2. Перемешать героев
    // 3. Распределить по игрокам
    // 4. Вывести результат в .player-row
  });

  // Клик по кнопке "Полный сброс"
  $("#reset-btn").on("click", function () {
    console.log("Полный сброс...");

    // Скрываем секции
    resultsSection.addClass("hidden");
    controlsPanel.addClass("hidden");

    // Очищаем результаты (если нужно)
    $(".player-row").each(function (index) {
      $(this).text(`Игрок ${index + 1}`);
    });
  });

  // Другие обработчики (перемешать команды, героев, настройки)
  // будут добавлены здесь
  $("#remix-teams-btn").on("click", function () {
    console.log("Перемешиваем команды...");
  });

  $("#remix-heroes-btn").on("click", function () {
    console.log("Перемешиваем героев...");
  });

  $("#settings-btn").on("click", function () {
    alert("Здесь откроется модальное окно с настройками списков героев.");
  });
});
