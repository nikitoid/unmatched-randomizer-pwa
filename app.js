// --- Регистрация Service Worker ---
// Этот код был перенесен из index.html для соблюдения Content Security Policy
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Используем относительный путь для максимальной надежности.
    // Это говорит браузеру искать service-worker.js в той же папке, что и index.html
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed: ", error);
      });
  });
}
