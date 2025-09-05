import Modal from "./modal.js";
import Storage from "./storage.js";
import Generator from "./generator.js";
import Toast from "./toast.js";

let currentGeneration = null;
let allHeroesData = [];
let resultsModal = null;

/**
 * Создает HTML-разметку для отображения результатов.
 * @param {object} generation - Объект с данными генерации.
 * @returns {string} - HTML-строка.
 */
function createResultsHTML(generation) {
  const { assignment } = generation;
  const team1 = [],
    team2 = [];

  // Распределяем игроков по командам
  for (const playerNum in assignment) {
    const data = { playerNum, hero: assignment[playerNum] };
    if (parseInt(playerNum) % 2 === 0) {
      team1.push(data);
    } else {
      team2.push(data);
    }
  }

  const createTeamHTML = (team, teamName) => `
        <div class="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <h3 class="text-xl font-bold text-teal-500 dark:text-teal-400 mb-3">${teamName}</h3>
            <div class="space-y-3">
                ${team
                  .map(
                    (p) => `
                    <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <div class="text-left">
                            <p class="font-semibold">Игрок ${p.playerNum}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${p.hero.name}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="p-2 text-gray-500 hover:text-teal-500 transition-colors focus:outline-none" data-action="reshuffle-hero" data-player="${p.playerNum}" title="Сменить героя">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5"></path></svg>
                            </button>
                            <button class="p-2 text-gray-500 hover:text-red-500 transition-colors focus:outline-none" data-action="exclude-hero" data-hero-name="${p.hero.name}" title="Исключить героя">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                            </button>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    `;

  return `
        <div id="results-content">
            ${createTeamHTML(team1, "Команда 1 (Четные)")}
            ${createTeamHTML(team2, "Команда 2 (Нечетные)")}
        </div>
        <div class="grid grid-cols-2 gap-3 mt-6 text-sm">
            <button data-action="reshuffle-teams" class="w-full bg-gray-600 active:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg">Перемешать команды</button>
            <button data-action="reshuffle-heroes" class="w-full bg-gray-600 active:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg">Перемешать героев</button>
            <button data-action="reshuffle-all" class="col-span-2 w-full bg-teal-500 active:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg">Перемешать всё</button>
        </div>
    `;
}

/**
 * Обновляет содержимое модального окна новыми данными.
 * @param {object} generation - Новый объект генерации.
 */
function updateResults(generation) {
  currentGeneration = generation;
  Storage.saveLastGeneration(generation);
  const newHTML = createResultsHTML(generation);
  const contentElement = document.querySelector(".modal-content");
  if (contentElement) {
    contentElement.innerHTML = newHTML;
    addEventListeners(); // Переназначаем слушатели
  }
}

/**
 * Назначает обработчики событий на кнопки внутри модального окна.
 */
function addEventListeners() {
  const modalElement = document.querySelector(".fullscreen");
  if (!modalElement) return;

  modalElement.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const excludedHeroes = Storage.loadExcludedHeroes();

    switch (action) {
      case "reshuffle-all":
        const newFullGen = Generator.generateAll(allHeroesData, excludedHeroes);
        if (newFullGen) updateResults(newFullGen);
        else Toast.error("Недостаточно героев");
        break;

      case "reshuffle-teams":
        const newPlayers = Generator.shuffleNumbers();
        const newTeamGen = {
          ...currentGeneration,
          shuffledPlayers: newPlayers,
        };
        // Пересобираем assignment
        newTeamGen.assignment = {};
        newPlayers.forEach((playerNum, index) => {
          newTeamGen.assignment[playerNum] = newTeamGen.shuffledHeroes[index];
        });
        updateResults(newTeamGen);
        break;

      case "reshuffle-heroes":
        const newHeroes = Generator.shuffleHeroes(
          allHeroesData,
          excludedHeroes,
          4
        );
        if (newHeroes) {
          const newHeroGen = {
            ...currentGeneration,
            shuffledHeroes: newHeroes,
          };
          // Пересобираем assignment
          newHeroGen.assignment = {};
          newHeroGen.shuffledPlayers.forEach((playerNum, index) => {
            newHeroGen.assignment[playerNum] = newHeroGen.shuffledHeroes[index];
          });
          updateResults(newHeroGen);
        } else {
          Toast.error("Недостаточно героев");
        }
        break;

      case "reshuffle-hero":
        const playerToReshuffle = button.dataset.player;
        const currentHeroNames = Object.values(
          currentGeneration.assignment
        ).map((h) => h.name);
        const heroesForReshuffle = allHeroesData.filter(
          (h) =>
            !currentHeroNames.includes(h.name) &&
            !excludedHeroes.includes(h.name)
        );
        if (heroesForReshuffle.length > 0) {
          const newHero = Generator.shuffle(heroesForReshuffle)[0];
          const newAssignment = { ...currentGeneration.assignment };
          newAssignment[playerToReshuffle] = newHero;

          const heroIndex = currentGeneration.shuffledHeroes.findIndex(
            (h) =>
              h.name === currentGeneration.assignment[playerToReshuffle].name
          );
          const newShuffledHeroes = [...currentGeneration.shuffledHeroes];
          if (heroIndex !== -1) newShuffledHeroes[heroIndex] = newHero;

          updateResults({
            ...currentGeneration,
            assignment: newAssignment,
            shuffledHeroes: newShuffledHeroes,
          });
        } else {
          Toast.warning("Нет свободных героев для замены");
        }
        break;

      case "exclude-hero":
        const heroNameToExclude = button.dataset.heroName;
        new Modal({
          type: "dialog",
          title: "Исключить героя?",
          content: `Герой "${heroNameToExclude}" не будет появляться в следующих генерациях до сброса сессии.`,
          onConfirm: () => {
            const currentExcluded = Storage.loadExcludedHeroes();
            if (!currentExcluded.includes(heroNameToExclude)) {
              Storage.saveExcludedHeroes([
                ...currentExcluded,
                heroNameToExclude,
              ]);
              Toast.success(`Герой "${heroNameToExclude}" исключен.`);
              // Запускаем полную перегенерацию, так как один герой стал недоступен
              const newGenAfterExclude = Generator.generateAll(
                allHeroesData,
                Storage.loadExcludedHeroes()
              );
              if (newGenAfterExclude) updateResults(newGenAfterExclude);
              else {
                Toast.error("Недостаточно героев для новой генерации.");
                resultsModal.close();
              }
            }
          },
        }).open();
        break;
    }
  });
}

/**
 * Открывает модальное окно с результатами.
 * @param {object} generation - Объект с данными генерации.
 * @param {object[]} allHeroes - Полный список героев.
 */
function show(generation, allHeroes) {
  currentGeneration = generation;
  allHeroesData = allHeroes;

  resultsModal = new Modal({
    type: "fullscreen",
    title: "Результаты генерации",
    content: createResultsHTML(generation),
    confirmText: "Готово",
  });
  resultsModal.open();
  addEventListeners();
}

export default { show };
