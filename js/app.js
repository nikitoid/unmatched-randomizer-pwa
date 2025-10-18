// --- Импорт и использование модулей ---
import Modal from "./modules/modal.js";
import Toast from "./modules/toast.js";
import Theme from "./modules/theme.js";
import Storage from "./modules/storage.js";
import Generator from "./modules/generator.js";
import Results from "./modules/results.js";
import ListManager from "./modules/listManager.js";
import { firebaseManager } from "./modules/firebase.js";
import { icons } from "./modules/listManager.js";

// --- Инициализация темы ---
Theme.init();

// --- Динамическая высота viewport ---
/**
 * Устанавливает CSS-переменную --vh, равную 1% от высоты видимой области.
 * Это решает проблему с '100vh' на мобильных устройствах при появлении/скрытии UI браузера.
 */
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

// Устанавливаем значение при загрузке и при изменении размера окна
window.addEventListener("resize", setVh);
setVh();

// --- Логика PWA и Service Worker ---

/**
 * Инициализирует Service Worker и управляет его жизненным циклом,
 * гарантируя запуск Firebase только после полной готовности приложения.
 */
function initializePWA() {
  if (!("serviceWorker" in navigator)) {
    console.warn(
      "[App] Service Worker не поддерживается. Запускаем Firebase напрямую."
    );
    initFirebase();
    return;
  }

  // Флаг для предотвращения многократной перезагрузки
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    console.log(
      "[App] Контроллер изменился. Перезагрузка для применения обновлений."
    );
    refreshing = true;
    window.location.reload();
  });

  // Функция, которая будет вызвана, когда мы уверены, что можно запускать Firebase
  const onReady = () => {
    // console.log("[App] Приложение готово. Запускаем Firebase.");
    initFirebase();
  };

  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("[App] Service Worker зарегистрирован.", registration);

      // Если есть ожидающий SW, значит, обновление уже скачано и ждет.
      // skipWaiting() в sw.js вызовет 'controllerchange', и страница перезагрузится.
      if (registration.waiting) {
        console.log("[App] Обнаружен ожидающий SW. Ожидание активации...");
        const spinner = document.getElementById("update-spinner");
        if (spinner) spinner.classList.remove("invisible");
        return; // Ничего не делаем, ждем перезагрузки
      }

      // Если есть устанавливающийся SW, подписываемся на его состояние.
      if (registration.installing) {
        const installingWorker = registration.installing;
        console.log(
          "[App] Обнаружен устанавливающийся SW. Ожидание установки..."
        );
        const spinner = document.getElementById("update-spinner");
        if (spinner) spinner.classList.remove("invisible");

        installingWorker.addEventListener("statechange", () => {
          // Когда он перейдет в состояние 'installed', он станет 'waiting'.
          // Наша логика `skipWaiting()` вызовет 'controllerchange' и перезагрузку.
          if (installingWorker.state === "installed") {
            console.log("[App] Новый SW установлен и ожидает активации.");
          }
        });
        return;
      }

      // Если нет ни waiting, ни installing, и есть активный SW,
      // мы можем быть не уверены, последняя ли это версия.
      // Запускаем принудительную проверку обновлений.
      if (registration.active) {
        console.log(
          "[App] Активный SW найден. Принудительная проверка обновлений..."
        );
        registration.update().then((newRegistration) => {
          // Если после проверки появился `installing` или `waiting` worker,
          // значит, нашлось обновление. Логика выше обработает его.
          if (newRegistration.installing || newRegistration.waiting) {
            console.log("[App] После проверки найдено обновление.");
          } else {
            // Если и после проверки обновлений нет, мы на 100% уверены,
            // что работаем с последней версией.
            console.log("[App] После проверки обновлений не найдено.");
            onReady();
          }
        });
      } else {
        // Этот случай возможен при самой первой загрузке, когда нет активного SW.
        // Просто ждем, пока текущий `installing` SW станет активным.
        // `controllerchange` вызовет перезагрузку, и при следующей загрузке
        // мы попадем в ветку `if (registration.active)`.
      }
    })
    .catch((error) => {
      console.error(
        "[App] Ошибка регистрации Service Worker. Запускаем Firebase как fallback.",
        error
      );
      // В случае ошибки регистрации SW, все равно запускаем Firebase,
      // чтобы приложение работало хотя бы онлайн.
      initFirebase();
    });
}

// --- Глобальное состояние и данные ---
let heroLists = {};

// --- Иконки для кнопки настроек (удалено) ---
// Логика смены иконок была убрана, так как автоматическая синхронизация при запуске удалена.

/**
 * Обновляет выпадающий список героев на главном экране.
 */
function updateHeroSelect() {
  const heroSelect = document.getElementById("hero-select");
  heroLists = Storage.loadHeroLists() || {};
  const activeList = Storage.loadActiveList();
  const defaultList = Storage.loadDefaultList();

  let targetSelection = activeList;

  // Если активный список не существует или сессия "чистая" (нет активного списка)
  if (!targetSelection || !heroLists[targetSelection]) {
    // Пытаемся использовать список по умолчанию
    targetSelection = defaultList;
    // Если и его нет, берем первый попавшийся
    if (!heroLists[targetSelection]) {
      targetSelection = Object.keys(heroLists)[0];
    }
    // Сохраняем новый выбор, чтобы он стал активным
    Storage.saveActiveList(targetSelection);
  }

  heroSelect.innerHTML = "";

  if (Object.keys(heroLists).length === 0) {
    const option = document.createElement("option");
    option.textContent = "Списки не найдены";
    option.disabled = true;
    heroSelect.appendChild(option);
    document.getElementById("generate-teams-btn").disabled = true;
    return;
  }

  document.getElementById("generate-teams-btn").disabled = false;

  for (const listName in heroLists) {
    const option = document.createElement("option");
    option.value = listName;
    option.textContent = listName;
    if (listName === targetSelection) {
      option.selected = true;
    }
    heroSelect.appendChild(option);
  }
}

/**
 * Инициализирует состояние приложения при загрузке.
 */
function initializeAppState() {
  heroLists = Storage.loadHeroLists();
  let defaultList = Storage.loadDefaultList();

  // Если списков нет, создаем стартовый набор.
  if (!heroLists || Object.keys(heroLists).length === 0) {
    const starterHeroes = [
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
      "Ененга",
    ];
    heroLists = {
      "Стартовый набор": { heroes: starterHeroes, type: "local" },
    };
    defaultList = "Стартовый набор";

    Storage.saveHeroLists(heroLists);
    Storage.saveDefaultList(defaultList);
    Storage.saveActiveList(defaultList);
    Toast.info("Создан стартовый набор героев");
  }

  updateHeroSelect();
}

/**
 * Обрабатывает обновление облачных списков.
 */
function handleCloudListsUpdate(event) {
  const { cloudLists, source } = event.detail;
  const localLists = Storage.loadHeroLists() || {};
  let changed = false;

  // --- Синхронизация переименований и удалений ---
  const localCloudLists = Object.entries(localLists).filter(
    ([, data]) => data.type === "cloud"
  );

  // Создаем Map из облачных списков для быстрого поиска по ID
  const cloudListMap = new Map(
    Object.values(cloudLists).map((list) => [list.id, list])
  );

  for (const [localName, localData] of localCloudLists) {
    const cloudMatch = cloudListMap.get(localData.id);

    if (cloudMatch) {
      // Список существует в облаке. Проверяем изменения.
      const localHeroes = JSON.stringify(localData.heroes);
      const cloudHeroes = JSON.stringify(cloudMatch.heroes);

      if (localName !== cloudMatch.name) {
        // Случай 1: Список был переименован
        delete localLists[localName];
        changed = true;
        if (source !== "local") {
          Toast.success(
            `Список "${localName}" переименован в "${cloudMatch.name}"`,
            icons.cloud
          );
        }
      } else if (localHeroes !== cloudHeroes) {
        // Случай 2: Состав списка был изменен
        changed = true;
        if (source !== "local") {
          Toast.info(
            `Список "${cloudMatch.name}" был обновлен в облаке`,
            icons.cloud
          );
        }
      }
    } else {
      // Списка больше нет в облаке, делаем его локальным
      localData.type = "local";
      delete localData.id;
      changed = true;
      // Уведомление теперь показывается только в listManager для мгновенной обратной связи.
      // Здесь просто молча синхронизируем состояние.
      if (source !== "local") {
        Toast.info(
          `Список "${localName}" удален из облака и стал локальным`,
          icons.cloud
        );
      }
    }
  }

  const mergedLists = { ...localLists, ...cloudLists };

  Storage.saveHeroLists(mergedLists, true);
  heroLists = mergedLists;
  updateHeroSelect();

  // Отправляем событие для ListManager, если он открыт
  const listManagerUpdateEvent = new CustomEvent("lists-updated", {
    detail: { lists: mergedLists },
  });
  window.dispatchEvent(listManagerUpdateEvent);

  // Уведомление "Облачные списки синхронизированы" убрано по требованию.
  // Пользователь видит изменения в реальном времени, этого достаточно.
}

/**
 * Инициализирует Firebase и начинает прослушивание облачных данных.
 */
async function initFirebase() {
  // Немедленно выходим, если нет сети
  if (!navigator.onLine) {
    return;
  }

  // Предотвращаем повторную инициализацию
  if (firebaseManager.isInitialized()) {
    console.log("[App] Firebase уже был инициализирован.");
    return;
  }

  try {
    // console.log("[App] Попытка инициализации Firebase...");
    const firebaseApp = await import(
      "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js"
    );
    const firestore = await import(
      "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js"
    );

    firebaseManager.init(firebaseApp, firestore);
    // firebaseManager.fetchAllCloudLists(); // Больше не требуется, логика перенесена
    // console.log("[App] Firebase инициализирован и слушает данные.");
  } catch (error) {
    console.error(
      "[App] Не удалось загрузить или инициализировать Firebase SDK:",
      error
    );
    Toast.error("Ошибка загрузки облачных сервисов", icons.cloud);
  }
}

// --- Основной поток выполнения ---
document.addEventListener("DOMContentLoaded", () => {
  initializeAppState();

  const themeToggle = document.getElementById("theme-toggle");
  const themeIconLight = document.getElementById("theme-icon-light");
  const themeIconDark = document.getElementById("theme-icon-dark");

  const updateThemeIcons = () => {
    if (document.documentElement.classList.contains("dark")) {
      themeIconLight.classList.add("hidden");
      themeIconDark.classList.remove("hidden");
    } else {
      themeIconLight.classList.remove("hidden");
      themeIconDark.classList.add("hidden");
    }
  };

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      Theme.toggleTheme();
      updateThemeIcons();
    });
  }
  updateThemeIcons();
  window.addEventListener("theme-changed", updateThemeIcons);

  window.addEventListener("cloud-lists-updated", handleCloudListsUpdate);

  // --- Обработка статуса сети ---
  window.addEventListener("online", () => {
    console.log("[App] Сеть восстановлена.");
    Toast.info(
      "Подключение к сети восстановлено. Перезайдите в 'Управление списками' для синхронизации БД",
      icons.cloud
    );

    // Проверяем, открыто ли модальное окно управления списками.
    // Если да, инициируем переподключение к Firebase.
    const listManagerModal = document.querySelector(".modal-list-manager");
    if (listManagerModal && !listManagerModal.classList.contains("hidden")) {
      console.log(
        "[App] Окно управления списками открыто, пытаемся переподключиться к Firebase..."
      );
      firebaseManager.connect();
    } else {
      // Если окно не открыто, просто инициализируем Firebase, если он еще не был запущен.
      // Это сохраняет базовую логику для первого подключения.
      if (!firebaseManager.isInitialized()) {
        initFirebase();
      }
    }
  });

  window.addEventListener("offline", () => {
    console.log("[App] Сеть потеряна.");
    Toast.info("Подключение к сети потеряно.", 2000);
    // Корректно разрываем соединение и отписываемся от слушателя.
    firebaseManager.disconnect();
  });
  // --- Конец обработки статуса сети ---

  initializePWA();

  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      ListManager.show(Storage.loadHeroLists(), initializeAppState);
    });
  }

  const generateBtn = document.getElementById("generate-teams-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const heroSelect = document.getElementById("hero-select");
      const selectedListName = heroSelect.value;
      const listData = heroLists[selectedListName];

      if (!listData || !listData.heroes) {
        Toast.error("Пожалуйста, выберите корректный список.");
        return;
      }

      const heroesForGeneration = listData.heroes.map((name) => ({ name }));

      if (heroesForGeneration.length < 4) {
        Toast.error(
          `В списке "${selectedListName}" недостаточно героев для генерации (нужно минимум 4, доступно ${heroesForGeneration.length}).`
        );
        return;
      }

      const generation = Generator.generateAll(heroesForGeneration, []);

      if (generation) {
        Storage.saveLastGeneration(generation);
        Toast.success("Команды сгенерированы!");

        const allUniqueHeroNames = [
          ...new Set(
            Object.values(heroLists)
              .map((list) => list.heroes)
              .flat()
          ),
        ];
        const allUniqueHeroes = allUniqueHeroNames.map((name) => ({ name }));

        Results.show(generation, allUniqueHeroes, initializeAppState);
      } else {
        Toast.error("Не удалось сгенерировать команды!");
      }
    });
  }

  const heroSelect = document.getElementById("hero-select");
  if (heroSelect) {
    heroSelect.addEventListener("change", (e) => {
      Storage.saveActiveList(e.target.value);
    });
  }

  const lastGenBtn = document.getElementById("last-gen-btn");
  if (lastGenBtn) {
    lastGenBtn.addEventListener("click", () => {
      const lastGen = Storage.loadLastGeneration();
      if (lastGen) {
        const currentHeroLists = Storage.loadHeroLists() || {};
        const allUniqueHeroNames = [
          ...new Set(
            Object.values(currentHeroLists)
              .map((list) => list.heroes)
              .flat()
          ),
        ];
        const allUniqueHeroes = allUniqueHeroNames.map((name) => ({ name }));
        Results.show(lastGen, allUniqueHeroes, initializeAppState);
      } else {
        Toast.info("Нет данных о последней генерации.");
      }
    });
  }

  const resetBtn = document.getElementById("reset-session-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      new Modal({
        type: "dialog",
        title: "Подтверждение",
        content:
          "Вы уверены, что хотите сбросить сессию? Все временные списки (с пометкой 'искл.') и последняя генерация будут удалены.",
        onConfirm: () => {
          Storage.clearSession();
          initializeAppState();
          Toast.success("Сессия сброшена.");
        },
      }).open();
    });
  }
});
