$(document).ready(function () {
  const themeToggle = $("#theme-toggle");
  const sunIcon = $("#theme-icon-sun");
  const moonIcon = $("#theme-icon-moon");
  const html = $("html");

  // --- Управление темой ---

  // Функция для установки темы
  const applyTheme = (theme) => {
    if (theme === "dark") {
      html.addClass("dark").removeClass("light");
      sunIcon.removeClass("hidden");
      moonIcon.addClass("hidden");
      localStorage.setItem("theme", "dark");
    } else {
      html.removeClass("dark").addClass("light");
      moonIcon.removeClass("hidden");
      sunIcon.addClass("hidden");
      localStorage.setItem("theme", "light");
    }
  };

  // При загрузке страницы проверяем localStorage и системные настройки
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(savedTheme);

  // Обработчик клика для переключения темы
  themeToggle.on("click", () => {
    const newTheme = html.hasClass("dark") ? "light" : "dark";
    applyTheme(newTheme);
  });

  // --- PWA и Service Worker ---

  if ("serviceWorker" in navigator) {
    let refreshing;
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("ServiceWorker зарегистрирован: ", registration);

        // Отслеживаем установку нового SW
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            // Когда новый SW установлен и ждет активации
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              $("#update-indicator").removeClass("hidden").addClass("flex");
            }
          });
        });
      })
      .catch((error) => {
        console.log("Ошибка регистрации ServiceWorker: ", error);
      });

    // Когда новый SW активирован, перезагружаем страницу
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  }
});
