import Modal from "./modal.js";
import Storage from "./storage.js";
import Toast from "./toast.js";
import FirebaseModule from "./firebase.js";

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
    cloud: `<svg class="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`,
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
        else if (action === "sync") this.handleSync();
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

  async handleSync() {
    const success = await FirebaseModule.syncLists();
    if (success) {
      this.heroLists = Storage.loadHeroLists();
      this.render();
    }
  },

  createManagerHTML() {
    const listItems = Object.keys(this.heroLists)
      .map((listName) => {
        const isDefault = listName === this.defaultList;
        const heroCount = this.heroLists[listName].length;
        const isCopy = this.isCopyRegex.test(listName);
        const isCloud = Storage.isCloudList(listName);

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

        const cloudIcon = isCloud
          ? `<span class="ml-2" title="Облачный список">${this.icons.cloud}</span>`
          : "";

        const contentHTML = `
          <div class="flex items-center">
            <p class="font-semibold text-lg ${titleClass}">${listName}</p>
            ${cloudIcon}
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">${subtitle}</p>
        `;

        if (isCopy) {
          return `
            <div class="flex items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm cursor-pointer" data-list-name="${listName}" data-action="edit">
                <div class="flex-grow">
                    ${contentHTML}
                </div>
                ${buttonsHTML}
            </div>`;
        } else {
          return `
            <div class="flex items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm" data-list-name="${listName}">
                <div class="flex-grow cursor-pointer" data-action="edit">
                    ${contentHTML}
                </div>
                ${buttonsHTML}
            </div>`;
        }
      })
      .join("");

    const syncBtnDisabled = !FirebaseModule.isOnline ? "disabled" : "";
    const syncBtnClass = !FirebaseModule.isOnline
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-teal-500 active:bg-teal-600";

    return `
        <div class="space-y-3">${listItems}</div>
        <button data-action="create" class="mt-6 flex items-center justify-center gap-2 w-full bg-teal-500 active:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform active:scale-95">
            ${this.icons.add} <span>Создать новый список</span>
        </button>
        <button data-action="sync" class="mt-3 flex items-center justify-center gap-2 w-full ${syncBtnClass} text-white font-bold py-3 px-4 rounded-lg transition-transform transform active:scale-95" ${syncBtnDisabled}>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9a9 9 0 0114.13-5.122M20 15a9 9 0 01-14.13 5.122"></path></svg>
            <span>Синхронизировать с облаком</span>
        </button>
        `;
  },

  createEditorHTML() {
    const heroNames = this.heroLists[this.listToEdit] || [];
    const heroText = heroNames.join("\n");
    const isCopy = this.isCopyRegex.test(this.listToEdit);
    const isCloud = Storage.isCloudList(this.listToEdit);
    const backButtonText = isCopy ? "Закрыть редактор" : "Назад к спискам";
    const saveBtnDisabled = isCloud && !FirebaseModule.isOnline ? "disabled" : "";
    const saveBtnClass =
      isCloud && !FirebaseModule.isOnline
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-teal-500 active:bg-teal-600";

    return `
        <div class="flex flex-col h-full">
            <div class="flex-shrink-0 flex justify-between items-center mb-4">
                 <button data-action="back" class="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-teal-500 transition-colors py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                    ${this.icons.back} ${backButtonText}
                </button>
                <button data-action="save" class="${saveBtnClass} text-sm font-bold text-white py-2 px-5 rounded-lg transition-transform transform active:scale-95" ${saveBtnDisabled}>
                    Сохранить
                </button>
            </div>
             <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Добавьте или измените героев. Каждый герой должен быть на новой строке.</p>
            <textarea id="list-hero-editor" class="w-full flex-grow bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base">${heroText}</textarea>
        </div>`;
  },

  async handleSaveList() {
    const textarea = document.getElementById("list-hero-editor");
    if (!textarea) return;
    const newHeroNames = textarea.value
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name);

    this.heroLists[this.listToEdit] = newHeroNames;
    Storage.saveHeroLists(this.heroLists);
    Toast.success(`Список "${this.listToEdit}" сохранен.`);

    // Если это облачный список, отправляем изменения в Firebase
    if (Storage.isCloudList(this.listToEdit)) {
      const cloudLists = this.getCloudListsObject();
      await FirebaseModule.updateAllLists(cloudLists);
    }

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
        <p class="text-sm mb-4 text-gray-600 dark:text-gray-400">Введите название и выберите тип списка.</p>
        <input type="text" id="new-list-name-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Например, 'Только маги'">
        <div class="mt-4">
            <label class="flex items-center">
                <input type="radio" name="list-type" value="local" class="form-radio h-5 w-5 text-teal-600" checked>
                <span class="ml-2 text-gray-700 dark:text-gray-200">Локальный</span>
            </label>
            <label class="flex items-center mt-2">
                <input type="radio" name="list-type" value="cloud" class="form-radio h-5 w-5 text-teal-600">
                <span class="ml-2 text-gray-700 dark:text-gray-200">Облачный (требует пароль)</span>
            </label>
        </div>`;
    new Modal({
      title: "Создать новый список",
      content: content,
      onConfirm: async () => {
        const input = document.getElementById("new-list-name-input");
        const listType = document.querySelector(
          'input[name="list-type"]:checked'
        ).value;
        if (!input) return;

        const newName = input.value.trim();
        if (this.isCopyRegex.test(newName)) {
          Toast.error("Название списка не может содержать '(искл.)'.");
          return;
        }

        if (newName && !this.heroLists[newName]) {
          if (listType === "cloud") {
            if (!FirebaseModule.isOnline) {
              Toast.error("Нет подключения к сети для создания облачного списка.");
              return;
            }
            // Проверка пароля не нужна здесь, она будет в updateAllLists
          }
          this.heroLists[newName] = [];
          Storage.saveHeroLists(this.heroLists);

          if (listType === "cloud") {
            Storage.addCloudLists([newName]);
            const cloudLists = this.getCloudListsObject();
            const success = await FirebaseModule.updateAllLists(cloudLists);
            if (!success) {
              // Если обновление не удалось, откатываем изменения
              delete this.heroLists[newName];
              Storage.saveHeroLists(this.heroLists);
              Storage.removeCloudList(newName);
              return; // Прерываем выполнение
            }
          }

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

  async handleRenameList(oldName) {
    if (this.isCopyRegex.test(oldName)) {
      Toast.error("Временные списки не могут быть переименованы.");
      return;
    }
    const isCloud = Storage.isCloudList(oldName);
    if (isCloud && !FirebaseModule.isOnline) {
      Toast.error("Нет подключения к сети для переименования облачного списка.");
      return;
    }

    const content = `<input type="text" id="rename-list-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" value="${oldName}">`;
    new Modal({
      title: "Переименовать список",
      content: content,
      onConfirm: async () => {
        const input = document.getElementById("rename-list-input");
        if (!input) return;

        const newName = input.value.trim();

        if (this.isCopyRegex.test(newName)) {
          Toast.error("Название списка не может содержать '(искл.)'.");
          return;
        }

        if (newName && oldName !== newName && !this.heroLists[newName]) {
          // Логика переименования...
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

          // Обновление метаданных облачного списка
          if (isCloud) {
            Storage.removeCloudList(oldName);
            Storage.addCloudLists([newName]);
            const cloudLists = this.getCloudListsObject();
            const success = await FirebaseModule.updateAllLists(cloudLists);
            if (!success) {
              // Откат изменений при ошибке
              this.handleRenameListRollback(newName, oldName, isCloud);
              return;
            }
          }

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

  async handleDeleteList(listName) {
    if (this.isCopyRegex.test(listName)) {
      Toast.error("Временные списки не могут быть удалены отсюда.");
      return;
    }
    const isCloud = Storage.isCloudList(listName);
    if (isCloud && !FirebaseModule.isOnline) {
      Toast.error("Нет подключения к сети для удаления облачного списка.");
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
      onConfirm: async () => {
        const backupList = { [listName]: this.heroLists[listName] }; // Бэкап на случай отката

        if (Storage.loadActiveList() === listName) {
          Storage.remove("active-list-name");
        }
        delete this.heroLists[listName];
        Storage.saveHeroLists(this.heroLists);
        Storage.removeCloudList(listName); // Удаляем из метаданных в любом случае

        if (isCloud) {
          const cloudLists = this.getCloudListsObject();
          const success = await FirebaseModule.updateAllLists(cloudLists);
          if (!success) {
            // Откат
            this.heroLists = { ...this.heroLists, ...backupList };
            Storage.saveHeroLists(this.heroLists);
            Storage.addCloudLists([listName]);
            this.render();
            return;
          }
        }

        Toast.success(`Список "${listName}" удален.`);
        this.render();
      },
    }).open();
  },

  /**
   * Вспомогательная функция для получения объекта только с облачными списками.
   */
  getCloudListsObject() {
    const allLists = Storage.loadHeroLists();
    const cloudListNames = Storage.getCloudLists();
    const cloudLists = {};
    for (const name of cloudListNames) {
      if (allLists[name]) {
        cloudLists[name] = allLists[name];
      }
    }
    return cloudLists;
  },

  /**
   * Вспомогательная функция для отката переименования.
   */
  handleRenameListRollback(newName, oldName, isCloud) {
    // Логика отката переименования...
    const updatedLists = {};
    Object.keys(this.heroLists).forEach((key) => {
      if (key === newName) {
        updatedLists[oldName] = this.heroLists[newName];
      } else {
        updatedLists[key] = this.heroLists[key];
      }
    });
    this.heroLists = updatedLists;

    if (this.defaultList === newName) {
      this.defaultList = oldName;
      Storage.saveDefaultList(oldName);
    }
    if (Storage.loadActiveList() === newName) {
      Storage.saveActiveList(oldName);
    }

    Storage.saveHeroLists(this.heroLists);

    if (isCloud) {
      Storage.removeCloudList(newName);
      Storage.addCloudLists([oldName]);
    }
    this.render();
  },
};

export default ListManager;
