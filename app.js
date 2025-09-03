// Убедимся, что DOM полностью загружен
$(document).ready(function () {
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
