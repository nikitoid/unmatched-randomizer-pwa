/**
 * Утилита для перемешивания массива (алгоритм Фишера-Йейтса).
 * @param {Array} array - Массив для перемешивания.
 * @returns {Array} - Новый перемешанный массив.
 */
function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Перемешивает номера игроков от 1 до 4.
 * @returns {number[]} - Массив с перемешанными номерами [1, 2, 3, 4].
 */
function shuffleNumbers() {
  return shuffle([1, 2, 3, 4]);
}

/**
 * Выбирает случайных героев из предоставленного списка.
 * @param {object[]} allHeroes - Полный список всех героев.
 * @param {string[]} excludedHeroes - Список имен героев для исключения.
 * @param {number} count - Количество героев для выбора.
 * @returns {object[] | null} - Массив выбранных героев или null, если доступных героев недостаточно.
 */
function shuffleHeroes(allHeroes, excludedHeroes = [], count = 4) {
  const availableHeroes = allHeroes.filter(
    (hero) => !excludedHeroes.includes(hero.name)
  );

  if (availableHeroes.length < count) {
    console.error("Недостаточно героев для генерации.");
    return null;
  }

  return shuffle(availableHeroes).slice(0, count);
}

/**
 * Выполняет полный цикл генерации: выбирает героев и распределяет игроков.
 * @param {object[]} allHeroes - Полный список всех героев.
 * @param {string[]} excludedHeroes - Список имен героев для исключения.
 * @returns {object | null} - Объект с результатами генерации или null в случае ошибки.
 */
function generateAll(allHeroes, excludedHeroes = []) {
  const shuffledPlayers = shuffleNumbers();
  const shuffledHeroes = shuffleHeroes(allHeroes, excludedHeroes, 4);

  if (!shuffledHeroes) {
    return null;
  }

  // Сопоставляем игроков и героев
  const assignment = {};
  shuffledPlayers.forEach((playerNum, index) => {
    assignment[playerNum] = shuffledHeroes[index];
  });

  return { shuffledPlayers, shuffledHeroes, assignment };
}

export default {
  generateAll,
  shuffleHeroes,
  shuffleNumbers,
  shuffle,
};
