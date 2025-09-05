// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker зарегистрирован успешно:", registration);
      })
      .catch((error) => {
        console.log("Ошибка регистрации Service Worker:", error);
      });
  });
} else {
  console.log("Service Worker не поддерживается в этом браузере.");
}

// --- Импорт и использование модулей ---

import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";

// Делаем Toast доступным глобально для Alpine.js
window.Toast = Toast;

// Демонстрация для модальных окон
document.addEventListener("DOMContentLoaded", () => {
  const openDialogBtn = document.getElementById("open-dialog");
  const openSheetBtn = document.getElementById("open-sheet");
  const openFullscreenBtn = document.getElementById("open-fullscreen");
  const showToastBtn = document.getElementById("show-toast");

  if (openDialogBtn) {
    openDialogBtn.addEventListener("click", () => {
      const dialogModal = new Modal({
        type: "dialog",
        title: "Диалоговое окно",
        content:
          "<p>Это стандартное модальное окно. Оно закроется при нажатии на кнопки или фон.</p>",
        confirmText: "Принять",
        cancelText: "Отклонить",
        onConfirm: () => Toast.success("Вы приняли условия!"),
        onCancel: () => Toast.warning("Вы отклонили условия."),
      });
      dialogModal.open();
    });
  }

  if (openSheetBtn) {
    openSheetBtn.addEventListener("click", () => {
      const sheetModal = new Modal({
        type: "bottom-sheet",
        title: "Нижняя шторка",
        content:
          "Это модальное окно, которое появляется снизу. Удобно для мобильных устройств.",
        onConfirm: () => Toast.info("Действие подтверждено."),
      });
      sheetModal.open();
    });
  }

  if (openFullscreenBtn) {
    openFullscreenBtn.addEventListener("click", () => {
      const fullModal = new Modal({
        type: "fullscreen",
        title: "Полный экран",
        content:
          "<p>Это модальное окно занимает весь экран. Используется для важных форм или информации.</p>",
        onConfirm: () => Toast.success("Форма отправлена!"),
      });
      fullModal.open();
    });
  }

  if (showToastBtn) {
    showToastBtn.addEventListener("click", () => {
      Toast.info("Это информационное сообщение.");
      setTimeout(() => Toast.success("А это сообщение об успехе!"), 500);
      setTimeout(() => Toast.error("Это ошибка! Что-то пошло не так."), 1000);
    });
  }
});
