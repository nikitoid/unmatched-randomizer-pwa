import Modal from "./modal.js";
import Toast from "./toast.js";

/**
 * Класс для отображения результатов генерации в модальном окне.
 */
export default class Results {
  constructor(options) {
    this.players = options.players;
    this.generator = options.generator;
    this.onRegenerate = options.onRegenerate || (() => {});
    this.modal = null;
  }

  renderContent() {
    const playersHTML = this.players
      .map(
        (player) => `
            <div class="player-row flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2" data-hero="${player.hero}">
                <div class="flex flex-col text-left">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Игрок №${player.playerNumber} (Команда ${player.team})</span>
                    <span class="text-lg font-bold text-gray-800 dark:text-gray-100">${player.hero}</span>
                </div>
                <button class="exclude-hero-btn-single p-2 text-red-500 hover:text-red-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                </button>
            </div>
        `
      )
      .join("");

    return `
            <div>
                <div class="mb-4">${playersHTML}</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 text-sm">
                    <button id="reshuffle-teams-btn" class="p-2 rounded-md bg-sky-500 text-white active:bg-sky-600">Перемешать команды</button>
                    <button id="reshuffle-heroes-btn" class="p-2 rounded-md bg-blue-500 text-white active:bg-blue-600">Перемешать героев</button>
                    <button id="reshuffle-all-btn" class="p-2 rounded-md bg-purple-500 text-white active:bg-purple-600">Перемешать всё</button>
                </div>
                <button id="exclude-heroes-btn" class="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg active:bg-red-600">Исключить героев</button>
            </div>
        `;
  }

  show() {
    const content = this.renderContent();
    this.modal = new Modal({
      type: "dialog",
      title: "Результаты генерации",
      content: content,
      confirmText: null, // Убираем кнопки по умолчанию
    });
    this.modal.open();
    this.addEventListeners();
  }

  addEventListeners() {
    const modalContainer = document.querySelector(
      ".modal-container:last-of-type"
    );
    if (!modalContainer) return;

    modalContainer.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target) return;

      if (target.id === "reshuffle-teams-btn") this.reshuffleTeams();
      if (target.id === "reshuffle-heroes-btn") this.reshuffleHeroes();
      if (target.id === "reshuffle-all-btn") this.reshuffleAll();
      if (target.id === "exclude-heroes-btn") this.excludeMultipleHeroes();
      if (target.classList.contains("exclude-hero-btn-single")) {
        const heroName = target.closest(".player-row").dataset.hero;
        this.excludeSingleHero(heroName);
      }
    });
  }

  updateResults(newPlayers) {
    this.players = newPlayers;
    this.onRegenerate({ players: this.players });

    const modalContent = document.querySelector(
      ".modal-container:last-of-type .modal-content"
    );
    if (modalContent) {
      modalContent.innerHTML = this.renderContent();
    }
  }

  reshuffleTeams() {
    const currentHeroes = this.players.map((p) => p.hero);
    const newNumbers = this.generator.shuffleNumbers();
    const newPlayers = newNumbers
      .map((num, index) => ({
        playerNumber: num,
        hero: currentHeroes[index], // Герои остаются те же
        team: num % 2 === 0 ? 1 : 2,
      }))
      .sort((a, b) => a.playerNumber - b.playerNumber);

    this.updateResults(newPlayers);
    new Toast().success("Команды перемешаны!");
  }

  reshuffleHeroes() {
    const newHeroes = this.generator.shuffleHeroes();
    const newPlayers = this.players.map((player, index) => ({
      ...player,
      hero: newHeroes[index], // Новые герои, команды те же
    }));

    this.updateResults(newPlayers);
    new Toast().success("Герои перемешаны!");
  }

  reshuffleAll() {
    const result = this.generator.generateAll();
    this.updateResults(result.players);
    new Toast().success("Всё перемешано!");
  }

  excludeSingleHero(heroName) {
    new Modal({
      title: "Подтверждение",
      content: `Вы уверены, что хотите исключить героя "${heroName}" из следующих генераций в этой сессии?`,
      onConfirm: () => {
        // TODO: Реализовать логику исключения
        new Toast().info(
          `Функционал исключения для "${heroName}" будет добавлен позже.`
        );
      },
    }).open();
  }

  excludeMultipleHeroes() {
    new Modal({
      title: "Подтверждение",
      content:
        "Вы уверены, что хотите исключить всех показанных героев из следующих генераций в этой сессии?",
      onConfirm: () => {
        // TODO: Реализовать логику исключения
        new Toast().info(
          "Функционал массового исключения будет добавлен позже."
        );
      },
    }).open();
  }
}
