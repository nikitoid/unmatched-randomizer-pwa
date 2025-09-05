/**
 * Класс для генерации команд и случайного распределения героев.
 */
export default class Generator {
  constructor(heroList) {
    this.heroes = [...heroList];
  }

  /**
   * Перемешивает массив чисел от 1 до 4.
   * @returns {number[]} Массив [1, 2, 3, 4] в случайном порядке.
   */
  shuffleNumbers() {
    const numbers = [1, 2, 3, 4];
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
  }

  /**
   * Определяет команды на основе массива чисел.
   * Четные - команда 1, нечетные - команда 2.
   * @param {number[]} numbers - Массив чисел [1, 2, 3, 4].
   * @returns {object} Объект с двумя командами.
   */
  getTeams(numbers) {
    const teams = {
      team1: [],
      team2: [],
    };
    numbers.forEach((num) => {
      if (num % 2 === 0) {
        teams.team1.push(num);
      } else {
        teams.team2.push(num);
      }
    });
    return teams;
  }

  /**
   * Выбирает 4 случайных уникальных героя из списка.
   * @returns {string[]} Массив из 4 героев.
   */
  shuffleHeroes() {
    const shuffled = [...this.heroes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }

  /**
   * Выполняет полную генерацию: перемешивает числа, героев и распределяет их.
   * @returns {object} Объект с результатами генерации.
   */
  generateAll() {
    const shuffledNumbers = this.shuffleNumbers();
    const shuffledHeroes = this.shuffleHeroes();

    const players = shuffledNumbers.map((num, index) => ({
      playerNumber: num,
      hero: shuffledHeroes[index],
      team: num % 2 === 0 ? 1 : 2,
    }));

    return {
      players: players.sort((a, b) => a.playerNumber - b.playerNumber), // Сортируем для отображения 1, 2, 3, 4
    };
  }
}
