import Modal from "./modal.js";
import Storage from "./storage.js";
import Toast from "./toast.js";
import Firebase from "./firebase.js";
import Auth from "./auth.js";

const ListManager = {
  modal: null,
  container: null,
  heroLists: {},
  defaultList: "",
  onUpdateCallback: () => {},
  currentView: "manager",
  listToEdit: null,
  isListenerAttached: false,
  isCopyRegex: /\(искл\.( \d+)?\)$/,

  icons: {
    rename: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>`,
    delete: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`,
    star: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`,
    starFilled: `<svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`,
    back: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>`,
    add: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>`,
    cloud: `<svg class="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`,
  },

  async updateCloudLists(cloudPayload) {
    if (!navigator.onLine) {
      Toast.error("Нет сети. Изменения не сохранены в облако.");
      return false;
    }
    try {
      const password = await Auth.requestPassword();
      if (!password) return false;
      const isValid = await Firebase.verifyPassword(password);

      if (!isValid) {
        Toast.error("Неверный пароль.");
        Auth.clearCachedPassword();
        return false;
      }

      Toast.info("Сохранение изменений в облаке...");
      const success = await Firebase.updateRemoteData({ lists: cloudPayload });
      if (success) {
        Toast.success("Изменения сохранены.");
        return true;
      } else {
        Toast.error("Ошибка сохранения в облаке.");
        return false;
      }
    } catch (error) {
      if (error) console.error("Ошибка при синхронизации:", error);
      return false;
    }
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
    if (modalElement) {
      modalElement.addEventListener("click", this.handleClicks.bind(this));
      this.isListenerAttached = true;
    }
  },

  handleClicks(e) {
    const actionButton = e.target.closest("button[data-action]");
    if (!actionButton) {
      const listContainer = e.target.closest("div[data-list-name]");
      if (listContainer && this.currentView === "manager") {
        this.listToEdit = listContainer.dataset.listName;
        this.currentView = "editor";
        this.render();
      }
      return;
    }

    const listName = e.target.closest("div[data-list-name]")?.dataset.listName;
    const action = actionButton.dataset.action;

    const actions = {
      create: () => this.handleCreateList(),
      "set-default": () => listName && this.handleSetDefault(listName),
      rename: () => listName && this.handleRenameList(listName),
      delete: () => listName && this.handleDeleteList(listName),
      back: () => {
        this.currentView = "manager";
        this.render();
      },
      save: () => this.handleSaveList(),
    };

    if (actions[action]) actions[action]();
  },

  render() {
    if (!this.container) return;
    const titleElement = document.getElementById("modal-title");
    if (this.currentView === "manager") {
      if (titleElement) titleElement.textContent = "Управление списками";
      this.container.innerHTML = this.createManagerHTML();
    } else {
      if (titleElement)
        titleElement.textContent = `Редактор: ${this.listToEdit}`;
      this.container.innerHTML = this.createEditorHTML();
    }
  },

  createManagerHTML() {
    const syncedNames = Storage.loadSyncedListNames() || [];
    const listItems = Object.keys(this.heroLists)
      .sort()
      .map((listName) => {
        const isDefault = listName === this.defaultList;
        const heroCount = this.heroLists[listName]?.length || 0;
        const isCopy = this.isCopyRegex.test(listName);
        const isSynced = syncedNames.includes(listName) && !isCopy;
        const buttonsHTML = isCopy
          ? `<div class="w-28 flex-shrink-0"></div>`
          : `
            <div class="flex items-center space-x-1 flex-shrink-0">
                <button class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" data-action="set-default" title="Сделать по умолчанию">${
                  isDefault ? this.icons.starFilled : this.icons.star
                }</button>
                <button class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" data-action="rename" title="Переименовать">${
                  this.icons.rename
                }</button>
                <button class="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" data-action="delete" title="Удалить">${
                  this.icons.delete
                }</button>
            </div>`;
        const titleClass = isCopy
          ? "text-gray-500 dark:text-gray-400"
          : "text-gray-800 dark:text-gray-100";
        const subtitle =
          `${heroCount} героев` +
          (isCopy ? " (временный)" : isSynced ? "" : " (локальный)");
        const cloudIcon = isSynced
          ? `<div class="mr-2" title="Синхронизировано с облаком">${this.icons.cloud}</div>`
          : "";

        return `<div class="flex items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm" data-list-name="${listName}">
                ${cloudIcon}
                <div class="flex-grow cursor-pointer" data-action="edit">
                    <p class="font-semibold text-lg ${titleClass}">${listName}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${subtitle}</p>
                </div>
                ${buttonsHTML}
            </div>`;
      })
      .join("");
    return `<div class="space-y-3">${listItems}</div>
        <button data-action="create" class="mt-6 flex items-center justify-center gap-2 w-full bg-teal-500 active:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform active:scale-95">
            ${this.icons.add} <span>Создать новый список</span>
        </button>`;
  },

  createEditorHTML() {
    const heroNames = this.heroLists[this.listToEdit] || [];
    const heroText = heroNames.join("\n");
    return `<div class="flex flex-col h-full">
            <div class="flex-shrink-0 flex justify-between items-center mb-4">
                 <button data-action="back" class="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-teal-500 py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">${this.icons.back} Назад к спискам</button>
                <button data-action="save" class="text-sm font-bold text-white bg-teal-500 active:bg-teal-600 py-2 px-5 rounded-lg transition-transform transform active:scale-95">Сохранить</button>
            </div>
             <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Каждый герой должен быть на новой строке.</p>
            <textarea id="list-hero-editor" class="w-full flex-grow bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-base">${heroText}</textarea>
        </div>`;
  },

  async handleSaveList() {
    const textarea = document.getElementById("list-hero-editor");
    const newHeroNames = textarea.value
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    const updatedLists = { ...this.heroLists, [this.listToEdit]: newHeroNames };

    const syncedNames = Storage.loadSyncedListNames() || [];
    const isSynced = syncedNames.includes(this.listToEdit);

    if (isSynced) {
      const cloudPayload = {
        ...Storage.loadCloudLists(),
        [this.listToEdit]: newHeroNames,
      };
      const success = await this.updateCloudLists(cloudPayload);
      if (!success) return;
    }

    Storage.saveHeroLists(updatedLists);
    this.heroLists = updatedLists;
    this.currentView = "manager";
    this.render();
  },

  handleSetDefault(listName) {
    if (this.isCopyRegex.test(listName)) {
      Toast.error("Временный список не может быть установлен по умолчанию.");
      return;
    }
    Storage.saveDefaultList(listName);
    this.defaultList = listName;
    Toast.success(`Список "${listName}" установлен по умолчанию.`);
    this.render();
  },

  handleCreateList() {
    const content = `<input type="text" id="new-list-name-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg" placeholder="Например, 'Герои Marvel'"><div class="mt-4"><p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Выберите тип списка:</p><div class="flex gap-4"><button data-create-type="local" class="flex-1 py-2 px-4 rounded-lg bg-gray-600 text-white">Локальный</button><button data-create-type="cloud" class="flex-1 py-2 px-4 rounded-lg bg-sky-600 text-white">Облачный</button></div></div>`;
    const createModal = new Modal({
      title: "Создать новый список",
      content,
      confirmText: null,
    });

    const creationHandler = async (e) => {
      const button = e.target.closest("button[data-create-type]");
      if (!button) return;

      const isCloud = button.dataset.createType === "cloud";
      const newName = document
        .getElementById("new-list-name-input")
        ?.value.trim();

      if (
        !newName ||
        this.isCopyRegex.test(newName) ||
        this.heroLists[newName]
      ) {
        Toast.error(
          newName
            ? "Некорректное имя или список уже существует."
            : "Название не может быть пустым."
        );
        return;
      }

      const allLists = { ...this.heroLists, [newName]: [] };

      if (isCloud) {
        const cloudPayload = { ...Storage.loadCloudLists(), [newName]: [] };
        const success = await this.updateCloudLists(cloudPayload);
        if (!success) return;
        const syncedNames = Storage.loadSyncedListNames() || [];
        Storage.saveSyncedListNames([...syncedNames, newName]);
      }

      Storage.saveHeroLists(allLists);
      this.heroLists = allLists;
      this.listToEdit = newName;
      this.currentView = "editor";
      this.render();
      createModal.close();
    };

    createModal.open();
    const modalElement = document.querySelector(
      ".modal-container:last-of-type"
    );
    if (modalElement) {
      modalElement.addEventListener("click", creationHandler, { once: true });
    }
  },

  async handleRenameList(oldName) {
    const syncedNames = Storage.loadSyncedListNames() || [];
    const isSynced = syncedNames.includes(oldName);

    const content = `<input type="text" id="rename-list-input" class="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg" value="${oldName}">`;
    new Modal({
      title: "Переименовать список",
      content: content,
      onConfirm: async () => {
        const newName = document
          .getElementById("rename-list-input")
          ?.value.trim();
        if (!newName || oldName === newName || this.heroLists[newName]) {
          if (this.heroLists[newName])
            Toast.error("Список с таким именем уже существует.");
          return;
        }

        const updatedLists = { ...this.heroLists };
        updatedLists[newName] = updatedLists[oldName];
        delete updatedLists[oldName];

        if (isSynced) {
          const cloudPayload = { ...Storage.loadCloudLists() };
          cloudPayload[newName] = cloudPayload[oldName];
          delete cloudPayload[oldName];
          const success = await this.updateCloudLists(cloudPayload);
          if (!success) return;
          Storage.saveSyncedListNames(
            syncedNames.map((n) => (n === oldName ? newName : n))
          );
        }

        if (Storage.loadDefaultList() === oldName)
          Storage.saveDefaultList(newName);
        if (Storage.loadActiveList() === oldName)
          Storage.saveActiveList(newName);
        Storage.saveHeroLists(updatedLists);
        this.heroLists = updatedLists;
        this.defaultList = Storage.loadDefaultList();
        this.render();
      },
    }).open();
  },

  async handleDeleteList(listName) {
    if (listName === this.defaultList) {
      Toast.warning("Нельзя удалить список по умолчанию.");
      return;
    }

    const syncedNames = Storage.loadSyncedListNames() || [];
    const isSynced = syncedNames.includes(listName);

    new Modal({
      title: "Подтверждение",
      content: `Удалить список "${listName}"?`,
      confirmText: "Удалить",
      onConfirm: async () => {
        const updatedLists = { ...this.heroLists };
        delete updatedLists[listName];

        if (isSynced) {
          const cloudPayload = { ...Storage.loadCloudLists() };
          delete cloudPayload[listName];
          const success = await this.updateCloudLists(cloudPayload);
          if (!success) return;
          Storage.saveSyncedListNames(
            syncedNames.filter((n) => n !== listName)
          );
        }

        if (Storage.loadActiveList() === listName)
          Storage.saveActiveList(this.defaultList);
        Storage.saveHeroLists(updatedLists);
        this.heroLists = updatedLists;
        this.render();
      },
    }).open();
  },
};

export default ListManager;
