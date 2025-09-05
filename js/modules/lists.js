import Modal from "./modal.js";
import Toast from "./toast.js";
import Storage from "./storage.js";

/**
 * Класс для управления списками героев.
 * Отвечает за CRUD операции, временные списки и UI.
 */
export default class ListManager {
  constructor() {
    this.lists = Storage.loadHeroLists() || [];
    this.defaultListId = Storage.loadDefaultListId() || null;

    if (this.lists.length === 0) {
      this.createDefaultList();
    }
  }

  createDefaultList() {
    const defaultHeroes = [
      "Король Артур",
      "Алиса",
      "Медуза",
      "Синдбад",
      "Красная Шапочка",
      "Беовульф",
      "Дракула",
      "Человек-невидимка",
      "Ахиллес",
      "Кровавая Мэри",
      "Сунь Укун",
      "Енанга",
    ];
    const newList = {
      id: `list_${Date.now()}`,
      name: "Стандартные герои",
      heroes: defaultHeroes,
      isTemp: false,
      parentList: null,
    };
    this.lists.push(newList);
    this.defaultListId = newList.id;
    this.saveLists();
    this.saveDefaultListId();
  }

  saveLists() {
    Storage.saveHeroLists(this.lists);
  }

  saveDefaultListId() {
    Storage.saveDefaultListId(this.defaultListId);
  }

  getLists() {
    return this.lists;
  }

  getListById(id) {
    return this.lists.find((list) => list.id === id);
  }

  getActiveList() {
    // Логика для получения активного списка (с учетом временных)
    const tempLists = this.lists.filter((l) => l.isTemp);
    if (tempLists.length > 0) {
      return tempLists[0]; // В сессии может быть только один временный список
    }
    return (
      this.getListById(this.defaultListId) ||
      this.lists.find((l) => !l.isTemp) ||
      this.lists[0]
    );
  }

  updateList(listId, data) {
    const listIndex = this.lists.findIndex((list) => list.id === listId);
    if (listIndex !== -1) {
      this.lists[listIndex] = { ...this.lists[listIndex], ...data };
      this.saveLists();
      return true;
    }
    return false;
  }

  deleteList(listId) {
    const list = this.getListById(listId);
    if (!list || list.isTemp) {
      Toast.error("Этот список нельзя удалить.");
      return;
    }

    const nonTempLists = this.lists.filter((l) => !l.isTemp);
    if (nonTempLists.length <= 1) {
      Toast.error("Нельзя удалить единственный список.");
      return;
    }

    this.lists = this.lists.filter((l) => l.id !== listId);
    if (this.defaultListId === listId) {
      this.defaultListId = this.lists.find((l) => !l.isTemp).id;
      this.saveDefaultListId();
    }
    this.saveLists();
    Toast.success(`Список "${list.name}" удален.`);
  }

  setDefaultList(listId) {
    const list = this.getListById(listId);
    if (list && !list.isTemp) {
      this.defaultListId = listId;
      this.saveDefaultListId();
      Toast.success(`Список "${list.name}" установлен по умолчанию.`);
      return true;
    }
    return false;
  }

  createTempList(parentId, excludedHeroes) {
    this.clearTempLists(); // Очищаем старые временные списки
    const parentList = this.getListById(parentId);
    if (!parentList) return null;

    const newHeroes = parentList.heroes.filter(
      (h) => !excludedHeroes.includes(h)
    );
    const tempList = {
      id: `temp_${Date.now()}`,
      name: `${parentList.name} (исключения)`,
      heroes: newHeroes,
      isTemp: true,
      parentList: parentId,
    };
    this.lists.push(tempList);
    this.saveLists();
    return tempList;
  }

  clearTempLists() {
    const initialCount = this.lists.length;
    this.lists = this.lists.filter((list) => !list.isTemp);
    if (this.lists.length < initialCount) {
      this.saveLists();
      Toast.info("Временные списки исключений сброшены.");
    }
  }

  renderManagementUI() {
    const listsHTML = this.getLists()
      .filter((l) => !l.isTemp) // Don't show temp lists in management
      .map((list) => {
        const isDefault = list.id === this.defaultListId;
        const canDelete = this.lists.filter((l) => !l.isTemp).length > 1;

        return `
            <div class="accordion-item bg-gray-100 dark:bg-gray-800 rounded-lg mb-3">
                <button class="accordion-header flex justify-between items-center w-full p-4 text-left font-semibold text-gray-800 dark:text-gray-200">
                    <span>
                        ${list.name}
                        ${
                          isDefault
                            ? '<span class="text-xs font-bold text-teal-500 ml-2">ПО УМОЛЧАНИЮ</span>'
                            : ""
                        }
                    </span>
                    <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="accordion-content hidden p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex flex-col gap-4" data-list-id="${list.id}">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Герои (каждый с новой строки):</label>
                            <textarea class="heroes-textarea w-full h-48 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md resize-y">${list.heroes.join(
                              "\n"
                            )}</textarea>
                        </div>
                        <button class="save-list-btn w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg active:bg-teal-600">Сохранить изменения</button>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <button class="set-default-btn p-2 rounded-md bg-sky-500 text-white ${
                              isDefault
                                ? "opacity-50 cursor-not-allowed"
                                : "active:bg-sky-600"
                            }" ${
          isDefault ? "disabled" : ""
        }>По умолчанию</button>
                            <button class="rename-list-btn p-2 rounded-md bg-blue-500 text-white active:bg-blue-600">Переименовать</button>
                            <button class="delete-list-btn p-2 rounded-md bg-red-500 text-white ${
                              !canDelete
                                ? "opacity-50 cursor-not-allowed"
                                : "active:bg-red-600"
                            }" ${!canDelete ? "disabled" : ""}>Удалить</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
      })
      .join("");

    return `
        <div class="p-1 sm:p-4">
            <div class="accordion">${listsHTML}</div>
            <button id="add-new-list-btn" class="mt-4 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg active:bg-green-600">Создать новый список</button>
        </div>
    `;
  }

  showManagementModal() {
    const content = this.renderManagementUI();
    const modal = new Modal({
      type: "fullscreen",
      title: "Управление списками",
      content: content,
      confirmText: null, // Убираем кнопки
      onClose: () => {
        window.dispatchEvent(new CustomEvent("lists-changed"));
      },
    });
    modal.open();
    this.addEventListenersToModal();
  }

  addEventListenersToModal() {
    const container = document.querySelector(".modal-container");
    if (!container) return;

    container.addEventListener("click", (e) => {
      // Accordion toggle logic
      const header = e.target.closest(".accordion-header");
      if (header) {
        const item = header.parentElement;
        const content = item.querySelector(".accordion-content");
        const icon = header.querySelector("svg");
        content.classList.toggle("hidden");
        icon.classList.toggle("rotate-180");
        return; // Prevent other handlers
      }

      // Add new list button
      const addBtn = e.target.closest("#add-new-list-btn");
      if (addBtn) {
        const newName = prompt("Введите имя нового списка:");
        if (newName && newName.trim()) {
          const newList = {
            id: `list_${Date.now()}`,
            name: newName.trim(),
            heroes: [],
            isTemp: false,
            parentList: null,
          };
          this.lists.push(newList);
          this.saveLists();
          Toast.success(`Список "${newName.trim()}" создан.`);
          this.refreshModal();
        }
        return;
      }

      // Button actions logic
      const listContainer = e.target.closest("[data-list-id]");
      if (!listContainer) return;

      const listId = listContainer.dataset.listId;

      if (e.target.classList.contains("save-list-btn")) {
        const textarea = listContainer.querySelector(".heroes-textarea");
        const heroes = textarea.value
          .split("\n")
          .map((h) => h.trim())
          .filter(Boolean);
        this.updateList(listId, { heroes });
        Toast.success("Список героев сохранен!");
        this.refreshModal();
      } else if (e.target.classList.contains("set-default-btn")) {
        this.setDefaultList(listId);
        this.refreshModal();
      } else if (e.target.classList.contains("rename-list-btn")) {
        const list = this.getListById(listId);
        const newName = prompt("Введите новое имя для списка:", list.name);
        if (newName && newName.trim()) {
          this.updateList(listId, { name: newName.trim() });
          Toast.success("Список переименован.");
          this.refreshModal();
        }
      } else if (e.target.classList.contains("delete-list-btn")) {
        new Modal({
          type: "dialog",
          title: "Подтверждение",
          content: "Вы уверены, что хотите удалить этот список?",
          onConfirm: () => {
            this.deleteList(listId);
            this.refreshModal();
          },
        }).open();
      }
    });
  }

  refreshModal() {
    const currentModal = document.querySelector(".modal-container .modal");
    if (currentModal) {
      const modalContent = currentModal.querySelector(".modal-content");
      modalContent.innerHTML = this.renderManagementUI();
      // No need to re-add listeners because of event delegation
    }
  }
}
