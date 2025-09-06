import Modal from "./modal.js";
import Storage from "./storage.js";
import Toast from "./toast.js";

/**
 * Модуль для управления списками героев.
 */
const ListManager = {
  // --- Состояние модуля ---
  modal: null,
  container: null,
  heroLists: {},
  defaultList: "",
  onUpdateCallback: () => {},
  currentView: "manager",
  listToEdit: null,
  isListenerAttached: false,
  isCopyRegex: /\(искл\.( \d+)?\)$/, // Регулярное выражение для обнаружения копий

  // ... (иконки остаются без изменений)
  icons: {
    rename: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>`,
    delete: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`,
    star: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`,
    starFilled: `<svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`,
    back: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>`,
    add: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>`,
  },

  show(heroLists, onUpdate) {
    this.heroLists = { ...heroLists };
    this.defaultList = Storage.loadDefaultList();
    this.onUpdateCallback = onUpdate;
    this.currentView = "manager";
    this.isListenerAttached = false;

    this.modal = new Modal({
      type: "fullscreen",
      title: "Управление списками",
      content: '<div class="modal-content-wrapper h-full"></div>',
      confirmText: null,
      onClose: () => {
        this.onUpdateCallback();
        this.isListenerAttached = false;
      },
    });

    this.modal.open();
    this.container = document.querySelector(".modal-content-wrapper");
    this.attachPersistentListener();
    this.render();
  },

  attachPersistentListener() {
    if (this.isListenerAttached) return;
    const modalElement = document.querySelector(".modal-container");
    if (!modalElement) return;
    modalElement.addEventListener("click", this.handleClicks.bind(this));
    this.isListenerAttached = true;
  },

  handleClicks(e) {
    const target = e.target;
    const actionButton = target.closest("button[data-action]");

    if (this.currentView === "manager") {
      const listContainer = target.closest("div[data-list-name]");
      if (actionButton) {
        const action = actionButton.dataset.action;
        const listName = listContainer ? listContainer.dataset.listName : null;
        if (action === "create") this.handleCreateList();
        else if (listName) {
          if (action === "set-default") this.handleSetDefault(listName);
          if (action === "rename") this.handleRenameList(listName);
          if (action === "delete") this.handleDeleteList(listName);
        }
      } else if (listContainer && target.closest('[data-action="edit"]')) {
        this.listToEdit = listContainer.dataset.listName;
        this.currentView = "editor";
        this.render();
      }
    } else if (this.currentView === "editor") {
      if (actionButton) {
        const action = actionButton.dataset.action;
        if (action === "back") {
          this.currentView = "manager";
          this.render();
        } else if (action === "save") {
          this.handleSaveList();
        }
      }
    }
  },

  render() {
    if (!this.container) return;
    let html = "";
    const titleElement = document.getElementById("modal-title");

    if (this.currentView === "manager") {
      if (titleElement) titleElement.textContent = "Управление списками";
      html = this.createManagerHTML();
    } else if (this.currentView === "editor") {
      if (titleElement)
        titleElement.textContent = `Редактор: ${this.listToEdit}`;
      html = this.createEditorHTML();
    }
    this.container.innerHTML = html;
  },

  createManagerHTML() {
    const listItems = Object.keys(this.heroLists)
      .map((listName) => {
        const isDefault = listName === this.defaultList;
        const heroCount = this.heroLists[listName].length;
        const isCopy = this.isCopyRegex.test(listName);

        const buttonsHTML = isCopy
          ? `<div class="w-28 flex-shrink-0"></div>` // Заглушка для выравнивания
          : `
            <div class="flex items-center space-x-1 flex-shrink-0">
                <button class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-action="set-default" title="Сделать по умолчанию">
                    ${isDefault ? this.icons.starFilled : this.icons.star}
                </button>
                <button class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-action="rename" title="Переименовать">
                    ${this.icons.rename}
                </button>
                <button class="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" data-action="delete" title="Удалить">
                    ${this.icons.delete}
                </button>
            </div>`;

        const titleClass = isCopy
          ? "text-gray-500 dark:text-gray-400"
          : "text-gray-800 dark:text-gray-100";
        const subtitle = isCopy
          ? `${heroCount} героев (временный)`
          : `${heroCount} героев`;

        return `
            <div class="flex items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm" data-list-name="${listName}">
                <div class="flex-grow cursor-pointer" data-action="edit">
                    <p class="font-semibold text-lg ${titleClass}">${listName}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${subtitle}</p>
                </div>
                ${buttonsHTML}
            </div>`;
      })
      .join("");

    return `
        <div class="space-y-3">${listItems}</div>
        <button data-action="create" class="mt-6 flex items-center justify-center gap-2 w-full bg-teal-500 active:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform active:scale-95">
            ${this.icons.add} <span>Создать новый список</span>
        </button>`;
  },

  createEditorHTML() {
    const heroNames = this.heroLists[this.listToEdit] || [];
    const heroText = heroNames.join("\n");
    const isCopy = this.isCopyRegex.test(this.listToEdit);
    const backButtonText = isCopy ? "Закрыть редактор" : "Назад к спискам";

    return `
        <div class="flex flex-col h-full">
            <div class="flex-shrink-0 flex justify-between items-center mb-4">
                 <button data-action="back" class="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-teal-500 transition-colors py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                    ${this.icons.back} ${backButtonText}
                </button>
                <button data-action="save" class="text-sm font-bold text-white bg-teal-500 active:bg-teal-600 py-2 px-5 rounded-lg transition-transform transform active:scale-95">
                    Сохранить
                </button>
            </div>
             <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Добавьте или измените героев. Каждый герой должен быть на новой строке.</p>
            <textarea id="list-hero-editor" class="w-full flex-grow bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base">${heroText}</textarea>
        </div>`;
  },

  handleSaveList() {
    const textarea = document.getElementById("list-hero-editor");
    if (!textarea) return;
    const newHeroNames = textarea.value
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name);

    this.heroLists[this.listToEdit] = newHeroNames;
    Storage.saveHeroLists(this.heroLists);
    Toast.success(`Список "${this.listToEdit}" сохранен.`);

    this.currentView = "manager";
    this.render();
  },

  handleSetDefault(listName) {
    if (this.isCopyRegex.test(listName)) {
      Toast.error("Временный список не может быть установлен по умолчанию.");
      return;
    }
    this.defaultList = listName;
    Storage.saveDefaultList(listName);
    Toast.success(`Список "${listName}" установлен по умолчанию.`);
    this.render();
  },

  handleCreateList() {
    const content = `
        <p class="text-sm mb-2 text-gray-600 dark:text-gray-400">Введите название для нового списка героев.</p>
        <input type="text" id="new-list-name-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Например, 'Только маги'">`;
    new Modal({
      title: "Создать новый список",
      content: content,
      onConfirm: () => {
        const input = document.getElementById("new-list-name-input");
        if (!input) return;

        const newName = input.value.trim();
        if (this.isCopyRegex.test(newName)) {
          Toast.error("Название списка не может содержать '(искл.)'.");
          return;
        }

        if (newName && !this.heroLists[newName]) {
          this.heroLists[newName] = [];
          Storage.saveHeroLists(this.heroLists);
          Toast.success(`Список "${newName}" создан.`);
          this.listToEdit = newName;
          this.currentView = "editor";
          this.render();
        } else if (this.heroLists[newName]) {
          Toast.error("Список с таким именем уже существует.");
        } else {
          Toast.error("Название не может быть пустым.");
        }
      },
    }).open();
  },

  handleRenameList(oldName) {
    if (this.isCopyRegex.test(oldName)) {
      Toast.error("Временные списки не могут быть переименованы.");
      return;
    }
    const content = `<input type="text" id="rename-list-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" value="${oldName}">`;
    new Modal({
      title: "Переименовать список",
      content: content,
      onConfirm: () => {
        const input = document.getElementById("rename-list-input");
        if (!input) return;

        const newName = input.value.trim();

        if (this.isCopyRegex.test(newName)) {
          Toast.error("Название списка не может содержать '(искл.)'.");
          return;
        }

        if (newName && oldName !== newName && !this.heroLists[newName]) {
          const updatedLists = {};
          Object.keys(this.heroLists).forEach((key) => {
            if (key === oldName) {
              updatedLists[newName] = this.heroLists[oldName];
            } else {
              updatedLists[key] = this.heroLists[key];
            }
          });
          this.heroLists = updatedLists;

          if (this.defaultList === oldName) {
            this.defaultList = newName;
            Storage.saveDefaultList(newName);
          }
          if (Storage.loadActiveList() === oldName) {
            Storage.saveActiveList(newName);
          }

          Storage.saveHeroLists(this.heroLists);
          Toast.success("Список переименован.");
          this.render();
        } else if (this.heroLists[newName]) {
          Toast.error("Список с таким именем уже существует.");
        } else if (!newName) {
          Toast.error("Название не может быть пустым.");
        }
      },
    }).open();
  },

  handleDeleteList(listName) {
    if (this.isCopyRegex.test(listName)) {
      Toast.error("Временные списки не могут быть удалены отсюда.");
      return;
    }
    if (listName === this.defaultList) {
      Toast.warning("Нельзя удалить список, который установлен по умолчанию.");
      return;
    }
    if (Object.keys(this.heroLists).length <= 1) {
      Toast.error("Нельзя удалить последний список.");
      return;
    }

    new Modal({
      title: "Подтверждение",
      content: `Вы уверены, что хотите удалить список "${listName}"?`,
      confirmText: "Удалить",
      onConfirm: () => {
        if (Storage.loadActiveList() === listName) {
          Storage.remove("active-list-name");
        }
        delete this.heroLists[listName];
        Storage.saveHeroLists(this.heroLists);
        Toast.success(`Список "${listName}" удален.`);
        this.render();
      },
    }).open();
  },
};

export default ListManager;
