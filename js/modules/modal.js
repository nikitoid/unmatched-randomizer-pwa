/**
 * Класс для создания модальных окон.
 * @example
 * const modal = new Modal({
 * type: 'dialog', // 'dialog', 'bottom-sheet', 'fullscreen'
 * title: 'Заголовок',
 * content: '<p>Содержимое модального окна.</p>',
 * onConfirm: () => { console.log('Подтверждено'); },
 * onCancel: () => { console.log('Отменено'); }
 * });
 * modal.open();
 */
class Modal {
  constructor(options = {}) {
    this.options = Object.assign(
      {
        type: "dialog",
        title: "",
        content: "",
        confirmText: "Принять",
        cancelText: "Отмена",
        onConfirm: () => {},
        onCancel: () => {},
      },
      options
    );

    this.modalElement = null;
    this.overlayElement = null;
    this._createModal();
  }

  _createModal() {
    // Создание оверлея
    this.overlayElement = document.createElement("div");
    this.overlayElement.className =
      "fixed inset-0 bg-black bg-opacity-60 z-40 opacity-0 transition-opacity duration-300";

    // Создание контейнера модального окна
    this.modalElement = document.createElement("div");
    let typeClasses = "";
    let animationClasses = "";

    switch (this.options.type) {
      case "fullscreen":
        typeClasses = "w-full h-full rounded-none";
        animationClasses = "opacity-0 scale-95";
        break;
      case "bottom-sheet":
        // FIX: Убраны лишние классы позиционирования, так как они задаются ниже
        typeClasses = "w-full rounded-t-2xl";
        animationClasses = "translate-y-full";
        break;
      case "dialog":
      default:
        // FIX: Убран 'my-8' для корректной работы 'm-auto' и добавлен 'h-fit'
        // чтобы высота контейнера была по содержимому.
        typeClasses = "w-11/12 max-w-md mx-auto rounded-2xl relative h-fit";
        animationClasses = "opacity-0 -translate-y-8";
        break;
    }

    this.modalElement.className = `fixed inset-0 m-auto z-50 bg-gray-800 text-gray-100 shadow-lg p-6 transform transition-all duration-300 ease-out ${typeClasses} ${animationClasses}`;

    // Корректировка для bottom-sheet, чтобы он не был по центру
    if (this.options.type === "bottom-sheet") {
      this.modalElement.className = `fixed bottom-0 left-0 right-0 z-50 bg-gray-800 text-gray-100 shadow-lg p-6 transform transition-all duration-300 ease-out ${typeClasses} ${animationClasses}`;
    }

    // Содержимое модального окна
    this.modalElement.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-teal-400">${this.options.title}</h2>
                <button class="modal-close-btn text-gray-400 text-3xl leading-none">&times;</button>
            </div>
            <div class="modal-content text-gray-300 mb-6">
                ${this.options.content}
            </div>
            <div class="modal-actions flex justify-end space-x-4">
                <button class="modal-cancel-btn bg-gray-600 active:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">${this.options.cancelText}</button>
                <button class="modal-confirm-btn bg-teal-500 active:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">${this.options.confirmText}</button>
            </div>
        `;

    // Добавление обработчиков событий
    this.overlayElement.addEventListener("click", () => this.close());
    this.modalElement
      .querySelector(".modal-close-btn")
      .addEventListener("click", () => this.close());
    this.modalElement
      .querySelector(".modal-cancel-btn")
      .addEventListener("click", () => {
        this.options.onCancel();
        this.close();
      });
    this.modalElement
      .querySelector(".modal-confirm-btn")
      .addEventListener("click", () => {
        this.options.onConfirm();
        this.close();
      });
  }

  open() {
    document.body.appendChild(this.overlayElement);
    document.body.appendChild(this.modalElement);
    document.body.style.overflow = "hidden";

    // Запускаем анимацию после добавления в DOM
    requestAnimationFrame(() => {
      this.overlayElement.classList.remove("opacity-0");
      this.modalElement.classList.remove(
        "opacity-0",
        "-translate-y-8",
        "translate-y-full",
        "scale-95"
      );
    });
  }

  close() {
    this.overlayElement.classList.add("opacity-0");

    switch (this.options.type) {
      case "fullscreen":
        this.modalElement.classList.add("opacity-0", "scale-95");
        break;
      case "bottom-sheet":
        this.modalElement.classList.add("translate-y-full");
        break;
      case "dialog":
      default:
        this.modalElement.classList.add("opacity-0", "-translate-y-8");
        break;
    }

    // Удаляем элементы из DOM после завершения анимации
    setTimeout(() => {
      if (this.overlayElement.parentNode) {
        this.overlayElement.parentNode.removeChild(this.overlayElement);
      }
      if (this.modalElement.parentNode) {
        this.modalElement.parentNode.removeChild(this.modalElement);
      }
      document.body.style.overflow = "";
    }, 300); // Соответствует duration-300 в Tailwind
  }

  confirm() {
    return new Promise((resolve, reject) => {
      this.options.onConfirm = resolve;
      this.options.onCancel = reject;
      this.open();
    });
  }
}

export default Modal;
