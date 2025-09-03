$(document).ready(function () {
  // --- ИСХОДНЫЕ ДАННЫЕ ---
  const defaultHeroes = [
    "Алиса",
    "Медуза",
    "Синдбад",
    "Король Артур",
    "Бигфут",
    "Робин Гуд",
  ];

  // --- ТЕКУЩЕЕ СОСТОЯНИЕ ---
  // Эти массивы будут хранить текущее состояние для функций "перемешивания"
  let currentPlayers = [];
  let currentHeroes = [];

  // --- UI ЭЛЕМЕНТЫ ---
  const generateBtn = $("#generate-btn");
  const resultsSection = $("#results-section");
  const controlsPanel = $("#controls-panel");
  const remixTeamsBtn = $("#remix-teams-btn");
  const remixHeroesBtn = $("#remix-heroes-btn");
  const resetBtn = $("#reset-btn");

  // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

  /**
   * Перемешивает массив на месте, используя алгоритм Фишера-Йетса.
   * @param {Array} array Массив для перемешивания.
   * @returns {Array} Перемешанный массив.
   */
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Обновляет DOM, отображая текущее распределение игроков и героев.
   */
  function displayResults() {
    // Проходимся по 4 строкам для игроков
    for (let i = 0; i < 4; i++) {
      const playerNumber = currentPlayers[i];
      const heroName = currentHeroes[i];
      // ID блоков для игроков - "player1", "player2" и т.д.
      // Индекс цикла `i` (0-3), поэтому добавляем 1, чтобы выбрать нужный div.
      $(`#player${i + 1}`).text(`Игрок ${playerNumber}: ${heroName}`);
    }
  }

  // --- ОСНОВНЫЕ ФУНКЦИИ ---

  /**
   * Основная функция для генерации команд и героев с нуля.
   */
  function generateTeams() {
    // 1. Создаем и перемешиваем номера игроков [1, 2, 3, 4]
    currentPlayers = shuffleArray([1, 2, 3, 4]);

    // 2. Создаем копию списка героев, перемешиваем ее и берем первых 4-х.
    const shuffledHeroes = shuffleArray([...defaultHeroes]);
    currentHeroes = shuffledHeroes.slice(0, 4);

    // 3. Отображаем результат в UI.
    displayResults();

    // 4. Показываем секцию с результатами и панель с доп. кнопками.
    resultsSection.removeClass("hidden");
    controlsPanel.removeClass("hidden");
  }

  /**
   * Перемешивает только номера игроков, оставляя героев на их местах.
   */
  function rerollTeams() {
    // Защита от запуска до первой генерации
    if (currentPlayers.length === 0) return;

    currentPlayers = shuffleArray(currentPlayers);
    displayResults();
  }

  /**
   * Перемешивает только героев, оставляя номера игроков на их местах.
   */
  function rerollHeroes() {
    // Защита от запуска до первой генерации
    if (currentPlayers.length === 0) return;

    const shuffledHeroes = shuffleArray([...defaultHeroes]);
    currentHeroes = shuffledHeroes.slice(0, 4);
    displayResults();
  }

  /**
   * Выполняет полный сброс (аналогично первой генерации).
   */
  function fullReset() {
    generateTeams();
  }

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
  generateBtn.on("click", generateTeams);
  remixTeamsBtn.on("click", rerollTeams);
  remixHeroesBtn.on("click", rerollHeroes);
  resetBtn.on("click", fullReset);
});
