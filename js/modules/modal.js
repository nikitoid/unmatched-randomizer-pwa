/**
 * Класс для создания и управления модальными окнами.
 * Сочетает плавную анимацию и поддержку вложенных окон.
 */
export default class Modal {
  constructor(options = {}) {
    this.options = Object.assign(
      {
        type: "dialog", // 'dialog', 'fullscreen', 'bottom-sheet'
        title: "Заголовок",
        content: "",
        confirmText: "Принять",
        cancelText: "Отмена",
        onConfirm: () => {},
        onClose: () => {},
      },
      options
    );

    this.modalElement = null;
    this.overlayElement = null;
    this.boundClose = this.close.bind(this);
    this.boundHandleKey = this.handleKey.bind(this);
  }

  createModalHTML(baseZIndex) {
    // --- Классы для анимации (взяты из вашей первоначальной версии) ---
    const typeClasses = {
      dialog: "max-w-md w-full m-auto rounded-xl shadow-lg",
      fullscreen: "w-full h-full rounded-none",
      "bottom-sheet": "w-full absolute bottom-0 rounded-t-2xl shadow-lg",
    };

    const initialStateClasses = {
      dialog: "opacity-0 -translate-y-8",
      fullscreen: "opacity-0 scale-95",
      "bottom-sheet": "translate-y-full",
    };

    const containerPadding =
      this.options.type === "fullscreen" ? "" : "p-4 sm:p-6";

    // --- Условное отображение кнопок ---
    const footerHTML =
      this.options.confirmText !== null
        ? `
            <div class="flex justify-end items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button class="modal-cancel w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg transition-transform transform active:scale-95">${this.options.cancelText}</button>
                <button class="modal-confirm w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-teal-500 rounded-lg transition-transform transform active:scale-95">${this.options.confirmText}</button>
            </div>
        `
        : "";

    // --- HTML-структура с поддержкой z-index для вложенности ---
    return `
            <div class="modal-overlay fixed inset-0 bg-black bg-opacity-60 z-40 opacity-0 transition-opacity duration-300" style="z-index: ${baseZIndex};"></div>
            <div class="modal-container fixed inset-0 z-50 flex items-center justify-center ${containerPadding}" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="z-index: ${
      baseZIndex + 10
    };">
                <div class="modal ${typeClasses[this.options.type]} ${
      initialStateClasses[this.options.type]
    } bg-white dark:bg-gray-900 flex flex-col max-h-full overflow-hidden transform transition-all duration-300 ease-out">
                    <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 id="modal-title" class="text-xl font-bold text-gray-800 dark:text-gray-100">${
                          this.options.title
                        }</h2>
                        <button class="modal-close-btn p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <div class="modal-content p-6 overflow-y-auto flex-grow">
                        ${this.options.content}
                    </div>
                    ${footerHTML}
                </div>
            </div>
        `;
  }

  open() {
    const existingModalsCount =
      document.querySelectorAll(".modal-container").length;
    const baseZIndex = 40;
    const zIndexStep = 20;
    const currentZIndex = baseZIndex + existingModalsCount * zIndexStep;

    if (existingModalsCount === 0) {
      document.body.style.overflow = "hidden";
    }

    const modalHTML = this.createModalHTML(currentZIndex);
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const containers = document.querySelectorAll(".modal-container");
    this.modalElement = containers[containers.length - 1];
    const overlays = document.querySelectorAll(".modal-overlay");
    this.overlayElement = overlays[overlays.length - 1];

    // --- Надежный запуск анимации открытия ---
    requestAnimationFrame(() => {
      this.overlayElement.classList.remove("opacity-0");
      const modal = this.modalElement.querySelector(".modal");
      modal.classList.remove(
        "opacity-0",
        "-translate-y-8",
        "translate-y-full",
        "scale-95"
      );
    });

    this.addEventListeners();
  }

  addEventListeners() {
    this.overlayElement.addEventListener("click", this.boundClose);
    this.modalElement
      .querySelector(".modal-close-btn")
      .addEventListener("click", this.boundClose);

    const confirmBtn = this.modalElement.querySelector(".modal-confirm");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        this.options.onConfirm();
        this.close();
      });
    }

    const cancelBtn = this.modalElement.querySelector(".modal-cancel");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", this.boundClose);
    }

    document.addEventListener("keydown", this.boundHandleKey);
  }

  close() {
    if (!this.modalElement || !this.overlayElement) return;

    // --- Плавная анимация закрытия ---
    this.overlayElement.classList.add("opacity-0");
    const modal = this.modalElement.querySelector(".modal");
    const initialStateClasses = {
      dialog: ["opacity-0", "-translate-y-8"],
      fullscreen: ["opacity-0", "scale-95"],
      "bottom-sheet": ["translate-y-full"],
    };
    modal.classList.add(...initialStateClasses[this.options.type]);

    const modalToRemove = this.modalElement;
    const overlayToRemove = this.overlayElement;

    // Очищаем ссылки, чтобы избежать повторного вызова
    this.modalElement = null;
    this.overlayElement = null;

    setTimeout(() => {
      modalToRemove.remove();
      overlayToRemove.remove();

      if (document.querySelectorAll(".modal-container").length === 0) {
        document.body.style.overflow = "";
      }
    }, 300); // Соответствует duration-300

    document.removeEventListener("keydown", this.boundHandleKey);
    this.options.onClose();
  }

  handleKey(e) {
    if (e.key === "Escape") {
      this.close();
    }
  }
}
