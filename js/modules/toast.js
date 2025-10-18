/**
 * Модуль для отображения toast-уведомлений.
 */

let toastContainer = document.getElementById("toast-container");
if (!toastContainer) {
  toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  toastContainer.className =
    "fixed bottom-5 right-5 z-[100] flex flex-col items-end space-y-3 w-full max-w-xs";
  document.body.appendChild(toastContainer);
}

const icons = {
  success: `<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  error: `<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  info: `<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  warning: `<svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
};

function createToast(message, type, iconSVG = null) {
  const toastElement = document.createElement("div");
  toastElement.className = `flex items-center w-full p-4 space-x-4 text-gray-200 bg-gray-800 rounded-lg shadow-lg transform transition-all duration-300 opacity-0 translate-x-full`;

  const icon = iconSVG || icons[type];

  toastElement.innerHTML = `
        <div class="icon">${icon}</div>
        <div class="text-sm font-normal">${message}</div>
    `;

  toastContainer.appendChild(toastElement);

  requestAnimationFrame(() => {
    toastElement.classList.remove("opacity-0", "translate-x-full");
  });

  setTimeout(() => {
    toastElement.classList.add("opacity-0");
    toastElement.style.transform = "translateX(100%)";

    toastElement.addEventListener("transitionend", () => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
    });
  }, 3000);
}

const Toast = {
  success: (message, iconSVG = null) =>
    createToast(message, "success", iconSVG),
  error: (message) => createToast(message, "error"),
  info: (message) => createToast(message, "info"),
  warning: (message) => createToast(message, "warning"),
};

export default Toast;
