import Modal from "./modal.js";
import Toast from "./toast.js";

/**
 * Класс для управления списками героев.
 */
export default class ListManager {
  constructor(storage) {
    this.storage = storage;
    this.lists = this.storage.get("heroLists", []);
    this.defaultListId = this.storage.get("defaultHeroListId", null);

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
      name: "Основной список",
      heroes: defaultHeroes.map((name) => ({ name })),
      isTemp: false,
      parentList: null,
    };
    this.lists.push(newList);
    this.defaultListId = newList.id;
    this.saveLists();
    this.saveDefaultListId();
  }

  saveLists() {
    this.storage.set("heroLists", this.lists);
  }

  saveDefaultListId() {
    this.storage.set("defaultHeroListId", this.defaultListId);
  }

  getLists() {
    return this.lists;
  }

  getListById(id) {
    return this.lists.find((list) => list.id === id);
  }

  getActiveListId() {
    const tempList = this.lists.find((l) => l.isTemp);
    if (tempList) {
      return tempList.id;
    }
    return this.defaultListId || this.lists.find((l) => !l.isTemp)?.id;
  }

  getActiveList() {
    const activeId = this.getActiveListId();
    return this.getListById(activeId);
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
    // ... (логика удаления, обернутая в модальное окно подтверждения)
  }

  setDefaultList(listId) {
    const list = this.getListById(listId);
    if (list && !list.isTemp) {
      this.defaultListId = listId;
      this.saveDefaultListId();
      Toast.success(`Список "${list.name}" установлен по умолчанию.`);
      this.refreshModalUI();
      return true;
    }
    return false;
  }

  createTempList(excludedHeroNames) {
    this.clearTempLists(); // Сначала очищаем старые временные списки

    const parentList = this.getListById(this.defaultListId);
    if (!parentList) {
      Toast.error("Не найден основной список для создания временного.");
      return null;
    }

    const newHeroes = parentList.heroes.filter(
      (h) => !excludedHeroNames.includes(h.name)
    );

    const tempList = {
      id: `temp_${Date.now()}`,
      name: `${parentList.name} (искл.)`,
      heroes: newHeroes,
      isTemp: true,
      parentList: parentList.id,
    };
    this.lists.push(tempList);
    this.saveLists();
    Toast.info("Создан временный список с исключениями.");
    return tempList;
  }

  clearTempLists() {
    const initialCount = this.lists.length;
    this.lists = this.lists.filter((list) => !list.isTemp);
    if (this.lists.length < initialCount) {
      this.saveLists();
    }
  }

  renderManagementUI() {
    const activeListId = this.getActiveListId();
    const listsHTML = this.lists
      .map((list) => {
        const isDefault = list.id === this.defaultListId;
        const isTemp = list.isTemp;
        const isActive = list.id === activeListId;
        const canDelete =
          !isTemp && this.lists.filter((l) => !l.isTemp).length > 1;
        const heroNames = list.heroes.map((h) => h.name).join("\n");

        return `
            <div class="accordion-item bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 shadow-sm">
                <button class="accordion-header flex justify-between items-center w-full p-4 text-left font-semibold text-gray-800 dark:text-gray-200">
                    <span class="truncate pr-2">
                        ${list.name}
                        ${
                          isDefault && !isTemp
                            ? '<span class="text-xs font-bold text-teal-500 ml-2">ПО УМОЛЧАНИЮ</span>'
                            : ""
                        }
                        ${
                          isActive && isTemp
                            ? '<span class="text-xs font-bold text-amber-500 ml-2">АКТИВНЫЙ</span>'
                            : ""
                        }
                    </span>
                    <svg class="w-5 h-5 transform transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="accordion-content hidden p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex flex-col gap-4" data-list-id="${list.id}">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Герои (каждый с новой строки):</label>
                            <textarea class="heroes-textarea w-full h-48 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md resize-y">${heroNames}</textarea>
                        </div>
                        <button class="save-list-btn w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg active:bg-teal-600">Сохранить</button>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <button class="set-default-btn p-2 rounded-md bg-sky-500 text-white ${
                              isDefault || isTemp
                                ? "opacity-50 cursor-not-allowed"
                                : "active:bg-sky-600"
                            }" ${
          isDefault || isTemp ? "disabled" : ""
        }>По умолчанию</button>
                            <button class="rename-list-btn p-2 rounded-md bg-blue-500 text-white ${
                              isTemp
                                ? "opacity-50 cursor-not-allowed"
                                : "active:bg-blue-600"
                            }" ${
          isTemp ? "disabled" : ""
        }>Переименовать</button>
                            <button class="delete-list-btn p-2 rounded-md bg-red-500 text-white ${
                              !canDelete
                                ? "opacity-50 cursor-not-allowed"
                                : "active:bg-red-600"
                            }" ${!canDelete ? "disabled" : ""}>Удалить</button>
                        </div>
                    </div>
                </div>
            </div>`;
      })
      .join("");

    return `
        <div class="p-4"><div class="accordion">${listsHTML}</div>
        <button id="add-new-list-btn" class="mt-4 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg active:bg-green-600">Создать список</button></div>`;
  }

  showManagementModal() {
    this.modalInstance = new Modal({
      type: "fullscreen",
      title: "Управление списками",
      content: this.renderManagementUI(),
      confirmText: null,
      onClose: () => {
        // Важно обновить главный экран после закрытия, так как активный список мог измениться
        window.dispatchEvent(new Event("listChanged"));
      },
    });
    this.modalInstance.open();
    this.addEventListenersToModal();
  }

  addEventListenersToModal() {
    const modalContent = document.querySelector(
      ".modal-container:last-of-type .modal-content"
    );
    if (!modalContent) return;

    modalContent.addEventListener("click", (e) => {
      const target = e.target;
      const header = target.closest(".accordion-header");
      if (header) {
        header.nextElementSibling.classList.toggle("hidden");
        header.querySelector("svg").classList.toggle("rotate-180");
        return;
      }

      const button = target.closest("button");
      if (!button) return;

      if (button.id === "add-new-list-btn") {
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
          this.refreshModalUI();
        }
        return;
      }

      const container = button.closest("[data-list-id]");
      if (!container) return;

      const listId = container.dataset.listId;

      if (button.classList.contains("save-list-btn")) {
        const textarea = container.querySelector(".heroes-textarea");
        const heroes = textarea.value
          .split("\n")
          .map((name) => ({ name: name.trim() }))
          .filter((h) => h.name);
        this.updateList(listId, { heroes });
        Toast.success("Список героев сохранен!");
      } else if (button.classList.contains("set-default-btn")) {
        this.setDefaultList(listId);
      } else if (button.classList.contains("rename-list-btn")) {
        const list = this.getListById(listId);
        const newName = prompt("Введите новое имя списка:", list.name);
        if (newName && newName.trim()) {
          this.updateList(listId, { name: newName.trim() });
          Toast.success("Список переименован.");
          this.refreshModalUI();
        }
      } else if (button.classList.contains("delete-list-btn")) {
        this.deleteList(listId);
      }
    });
  }

  refreshModalUI() {
    const modalContent = document.querySelector(
      ".modal-container:last-of-type .modal-content"
    );
    if (modalContent) {
      modalContent.innerHTML = this.renderManagementUI();
    }
  }
}
