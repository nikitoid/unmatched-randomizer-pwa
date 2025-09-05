/**
 * Модуль для отображения toast-уведомлений.
 * @example
 * new Toast().success('Успех!');
 */
export default class Toast {
  constructor(options = {}) {
    this.options = Object.assign(
      {
        message: "",
        type: "info", // 'success', 'error', 'info', 'warning'
        duration: 3000,
      },
      options
    );

    this.container = document.getElementById("toast-container");
    if (!this.container) {
      console.error("Toast container not found!");
      return;
    }
  }

  _createToast() {
    const typeClasses = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      warning: "bg-yellow-500",
    };

    const toastElement = document.createElement("div");
    toastElement.className = `
            ${typeClasses[this.options.type]} 
            text-white font-bold rounded-lg shadow-lg p-4
            animate-fade-in-up
        `;
    toastElement.textContent = this.options.message;

    this.container.appendChild(toastElement);

    setTimeout(() => {
      toastElement.classList.remove("animate-fade-in-up");
      toastElement.classList.add("animate-fade-out");
      toastElement.addEventListener("animationend", () => {
        toastElement.remove();
      });
    }, this.options.duration);
  }

  _show(message, type) {
    this.options.message = message;
    this.options.type = type;
    this._createToast();
  }

  success(message) {
    this._show(message, "success");
  }

  error(message) {
    this._show(message, "error");
  }

  info(message) {
    this._show(message, "info");
  }

  warning(message) {
    this._show(message, "warning");
  }
}
