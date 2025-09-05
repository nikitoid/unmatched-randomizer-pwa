/**
 * Утилита для перемешивания массива (алгоритм Фишера-Йейтса).
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
 */
function shuffleNumbers() {
  return shuffle([1, 2, 3, 4]);
}

/**
 * Выбирает случайных героев из предоставленного списка.
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
 * Выполняет полный цикл генерации.
 */
function generateAll(allHeroes, excludedHeroes = []) {
  const shuffledPlayers = shuffleNumbers();
  const shuffledHeroes = shuffleHeroes(allHeroes, excludedHeroes, 4);

  if (!shuffledHeroes) {
    return null;
  }

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
