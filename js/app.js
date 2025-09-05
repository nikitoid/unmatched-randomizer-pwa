// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("ServiceWorker registered:", registration);

        // Проверка обновлений каждые 30 секунд
        setInterval(() => {
          registration.update();
        }, 30000);
      })
      .catch((err) => console.log("ServiceWorker registration failed:", err));
  });
}

// PWA Install Prompt
let deferredPrompt;
const installPrompt = document.getElementById("installPrompt");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Показываем кнопку установки если приложение еще не установлено
  if (!window.matchMedia("(display-mode: standalone)").matches) {
    setTimeout(() => {
      installPrompt.classList.remove("hidden");
    }, 2000);
  }
});

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      }
      deferredPrompt = null;
      installPrompt.classList.add("hidden");
    });
  }
}

function dismissInstall() {
  installPrompt.classList.add("hidden");
  localStorage.setItem("installDismissed", "true");
}

// Alpine.js Component для генератора героев
function heroGenerator() {
  return {
    heroes: [
      // Базовый набор
      {
        id: 1,
        name: "Король Артур",
        set: "Battle of Legends Vol. 1",
        type: "Легенда",
      },
      {
        id: 2,
        name: "Алиса",
        set: "Battle of Legends Vol. 1",
        type: "Легенда",
      },
      {
        id: 3,
        name: "Медуза",
        set: "Battle of Legends Vol. 1",
        type: "Легенда",
      },
      {
        id: 4,
        name: "Синдбад",
        set: "Battle of Legends Vol. 1",
        type: "Легенда",
      },

      // Robin Hood vs Bigfoot
      {
        id: 5,
        name: "Робин Гуд",
        set: "Robin Hood vs Bigfoot",
        type: "Легенда",
      },
      { id: 6, name: "Бигфут", set: "Robin Hood vs Bigfoot", type: "Криптид" },

      // InGen vs Raptors
      {
        id: 7,
        name: "Роберт Малдун",
        set: "InGen vs Raptors",
        type: "Человек",
      },
      { id: 8, name: "Рапторы", set: "InGen vs Raptors", type: "Динозавр" },

      // Bruce Lee
      { id: 9, name: "Брюс Ли", set: "Bruce Lee", type: "Боевые искусства" },

      // Cobble & Fog
      { id: 10, name: "Шерлок Холмс", set: "Cobble & Fog", type: "Детектив" },
      { id: 11, name: "Дракула", set: "Cobble & Fog", type: "Вампир" },
      { id: 12, name: "Джекилл и Хайд", set: "Cobble & Fog", type: "Монстр" },
      {
        id: 13,
        name: "Человек-невидимка",
        set: "Cobble & Fog",
        type: "Ученый",
      },

      // Battle of Legends Vol. 2
      {
        id: 14,
        name: "Ахиллес",
        set: "Battle of Legends Vol. 2",
        type: "Герой",
      },
      {
        id: 15,
        name: "Кровавая Мэри",
        set: "Battle of Legends Vol. 2",
        type: "Призрак",
      },
      {
        id: 16,
        name: "Сунь Укун",
        set: "Battle of Legends Vol. 2",
        type: "Король обезьян",
      },
      {
        id: 17,
        name: "Йенненга",
        set: "Battle of Legends Vol. 2",
        type: "Воин",
      },

      // Little Red vs Beowulf
      {
        id: 18,
        name: "Красная Шапочка",
        set: "Little Red vs Beowulf",
        type: "Сказка",
      },
      {
        id: 19,
        name: "Беовульф",
        set: "Little Red vs Beowulf",
        type: "Викинг",
      },

      // Houdini vs The Genie
      {
        id: 20,
        name: "Гудини",
        set: "Houdini vs The Genie",
        type: "Иллюзионист",
      },
      {
        id: 21,
        name: "Джинн",
        set: "Houdini vs The Genie",
        type: "Волшебное существо",
      },
    ],

    selectedHero: null,
    history: [],
    isLoading: false,
    filters: {
      includeAllSets: true,
    },

    init() {
      // Загружаем историю из localStorage
      const savedHistory = localStorage.getItem("heroHistory");
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }

      // Проверяем URL параметры
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("action") === "generate") {
        this.generateHero();
      }
    },

    generateHero() {
      this.isLoading = true;

      // Имитация загрузки для лучшего UX
      setTimeout(() => {
        const availableHeroes = this.filters.includeAllSets
          ? this.heroes
          : this.heroes.filter((h) => h.set === "Battle of Legends Vol. 1");

        const randomIndex = Math.floor(Math.random() * availableHeroes.length);
        this.selectedHero = { ...availableHeroes[randomIndex] };

        // Добавляем в историю
        this.addToHistory(this.selectedHero);

        this.isLoading = false;

        // Вибрация на мобильных устройствах
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
      }, 500);
    },

    addToHistory(hero) {
      // Добавляем временную метку
      const heroWithTime = {
        ...hero,
        timestamp: new Date().toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Добавляем в начало массива
      this.history.unshift(heroWithTime);

      // Ограничиваем историю 10 записями
      if (this.history.length > 10) {
        this.history = this.history.slice(0, 10);
      }

      // Сохраняем в localStorage
      localStorage.setItem("heroHistory", JSON.stringify(this.history));
    },

    clearHistory() {
      this.history = [];
      localStorage.removeItem("heroHistory");

      // Вибрация подтверждения
      if ("vibrate" in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
    },
  };
}

// Обработка онлайн/офлайн статуса
window.addEventListener("online", () => {
  console.log("Back online");
});

window.addEventListener("offline", () => {
  console.log("Gone offline");
});

// Предотвращение случайного закрытия при свайпе на iOS
let touchStartY = 0;
document.addEventListener(
  "touchstart",
  (e) => {
    touchStartY = e.touches[0].clientY;
  },
  { passive: true }
);

document.addEventListener(
  "touchmove",
  (e) => {
    const touchY = e.touches[0].clientY;
    const scrollTop = document.scrollingElement.scrollTop;

    if (scrollTop === 0 && touchY > touchStartY) {
      e.preventDefault();
    }
  },
  { passive: false }
);
