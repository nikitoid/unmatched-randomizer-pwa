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

// Здесь будет основная логика вашего приложения.
// Например, загрузка списка героев из файла или API.
console.log("app.js загружен.");
