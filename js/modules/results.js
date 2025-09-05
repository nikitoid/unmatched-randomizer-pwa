import Modal from "./modal.js";
import Storage from "./storage.js";
import Generator from "./generator.js";
import Toast from "./toast.js";

let currentGeneration = null;
let allHeroesData = [];
let resultsModal = null;

/**
 * Создает HTML-разметку для отображения результатов.
 */
function createResultsHTML(generation) {
  const { assignment, shuffledPlayers } = generation;

  const playersHTML = shuffledPlayers
    .map((playerNum) => {
      const hero = assignment[playerNum];
      if (!hero) return "";
      const teamNum = playerNum % 2 === 0 ? 1 : 2;
      const teamColor =
        teamNum === 1
          ? "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300"
          : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300";

      return `
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md shadow-sm">
                <div class="text-left">
                    <p class="font-semibold text-lg text-gray-800 dark:text-gray-100">${hero.name}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Игрок ${playerNum} <span class="text-xs font-medium px-2 py-0.5 rounded-full ${teamColor}">Команда ${teamNum}</span></p>
                </div>
                <div class="flex items-center space-x-1">
                    <button class="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-teal-500 transition-colors focus:outline-none" data-action="reshuffle-hero" data-player="${playerNum}" title="Сменить героя">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5"></path></svg>
                    </button>
                    <button class="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500 transition-colors focus:outline-none" data-action="exclude-hero" data-hero-name="${hero.name}" title="Исключить героя">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                    </button>
                </div>
            </div>
        `;
    })
    .join("");

  return `
        <div id="results-content" class="space-y-3">
            ${playersHTML}
        </div>
        <div class="grid grid-cols-2 gap-3 mt-6 text-sm">
            <button data-action="reshuffle-teams" class="w-full bg-gray-600 active:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform active:scale-95">Перемешать команды</button>
            <button data-action="reshuffle-heroes" class="w-full bg-gray-600 active:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform active:scale-95">Перемешать героев</button>
            <button data-action="exclude-these-heroes" class="w-full bg-red-600 active:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform active:scale-95">Исключить этих героев</button>
            <button data-action="reshuffle-all" class="w-full bg-teal-500 active:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform active:scale-95">Перемешать всё</button>
        </div>
    `;
}

/**
 * Обновляет содержимое модального окна.
 */
function updateResults(generation) {
  currentGeneration = generation;
  Storage.saveLastGeneration(generation);
  const newHTML = createResultsHTML(generation);
  const contentElement = document.querySelector(
    ".modal-container .modal-content"
  );
  if (contentElement) {
    contentElement.innerHTML = newHTML;
  }
}

/**
 * Назначает обработчики событий.
 */
function addEventListeners() {
  const modalElement = document.querySelector(".modal-container");
  if (!modalElement) return;

  modalElement.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    e.stopPropagation();
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
        newTeamGen.assignment = {};
        newPlayers.forEach((playerNum, index) => {
          newTeamGen.assignment[playerNum] =
            currentGeneration.shuffledHeroes[index];
        });
        updateResults(newTeamGen);
        break;

      case "reshuffle-heroes":
        const newHeroes = Generator.shuffleHeroes(
          allHeroesData,
          excludedHeroes,
          4
        );

        if (newHeroes && newHeroes.length === 4) {
          const newHeroGen = {
            ...currentGeneration,
            shuffledHeroes: newHeroes,
          };
          newHeroGen.assignment = {};
          currentGeneration.shuffledPlayers.forEach((playerNum, index) => {
            newHeroGen.assignment[playerNum] = newHeroes[index];
          });
          updateResults(newHeroGen);
        } else {
          Toast.error("Недостаточно героев для замены.");
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

      case "exclude-these-heroes":
        new Modal({
          type: "dialog",
          title: "Исключить 4 героев?",
          content: `Герои из текущей генерации не будут появляться в следующих. Это действие нельзя отменить до сброса сессии.`,
          confirmText: "Да, исключить",
          onConfirm: () => {
            const heroesToExclude = currentGeneration.shuffledHeroes.map(
              (h) => h.name
            );
            const currentExcluded = Storage.loadExcludedHeroes();
            const newExcluded = [
              ...new Set([...currentExcluded, ...heroesToExclude]),
            ];
            Storage.saveExcludedHeroes(newExcluded);
            Toast.success("Герои исключены до сброса сессии.");
            resultsModal.close();
          },
        }).open();
        break;

      case "exclude-hero":
        const heroNameToExclude = button.dataset.heroName;
        new Modal({
          type: "dialog",
          title: "Исключить героя?",
          content: `Герой "${heroNameToExclude}" не будет появляться в следующих генерациях до сброса сессии.`,
          confirmText: "Да, исключить",
          onConfirm: () => {
            const currentExcluded = Storage.loadExcludedHeroes();
            const newExcluded = [
              ...new Set([...currentExcluded, heroNameToExclude]),
            ];
            Storage.saveExcludedHeroes(newExcluded);
            Toast.success(`Герой "${heroNameToExclude}" исключен.`);
            button.closest(".flex.items-center.justify-between").style.opacity =
              "0.5";
            button.disabled = true;
          },
        }).open();
        break;
    }
  });
}

/**
 * Открывает модальное окно с результатами.
 */
function show(generation, allHeroes) {
  currentGeneration = generation;
  allHeroesData = allHeroes;

  resultsModal = new Modal({
    type: "fullscreen",
    title: "Результаты генерации",
    content: createResultsHTML(generation),
    confirmText: null,
  });

  resultsModal.open();
  addEventListeners();
}

export default { show };
