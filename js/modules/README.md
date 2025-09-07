# Система загрузки модулей

Система загрузки модулей для PWA приложения с автоматической инициализацией, системой событий и поддержкой кастомных стилей.

## Компоненты системы

### 1. Module.js - Базовый класс модуля
Предоставляет общий интерфейс для всех модулей:
- Методы `init()`, `destroy()`, `enable()`, `disable()`
- Автоматическое внедрение и управление CSS стилями
- Встроенная система событий
- Проверка зависимостей
- Управление конфигурацией

### 2. EventBus.js - Система событий
Централизованная система коммуникации между модулями:
- Подписка и отписка от событий (`on`, `off`, `once`)
- Отправка событий (`emit`)
- История событий
- Статистика и отладка
- Пространства имен для событий

### 3. ModuleLoader.js - Загрузчик модулей
Автоматическая загрузка и инициализация модулей:
- Динамический импорт модулей
- Управление зависимостями
- Retry логика при ошибках
- Поддержка legacy модулей
- Кеширование загруженных модулей

## Создание модуля

### Простой модуль
```javascript
import { Module } from './Module.js';

class MyModule extends Module {
  constructor(name, options = {}) {
    // Кастомные стили для модуля
    const styles = `
      .my-module-button {
        background: #3b82f6;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
      }
    `;

    super(name, { ...options, styles });
  }

  async onInit() {
    console.log('MyModule инициализирован');
    
    // Подписываемся на события
    this.on('some-event', this.handleEvent.bind(this));
    
    // Создаем UI
    this.createUI();
  }

  async onDestroy() {
    console.log('MyModule уничтожен');
    // Очистка ресурсов
  }

  handleEvent(data) {
    console.log('Получено событие:', data);
  }

  createUI() {
    const button = document.createElement('button');
    button.className = 'my-module-button';
    button.textContent = 'My Module';
    button.onclick = () => {
      this.emit('my-module:clicked', { timestamp: Date.now() });
    };
    
    document.body.appendChild(button);
  }
}

export default MyModule;
```

### Legacy модуль (объект с методами)
```javascript
// legacy-module.js
const LegacyModule = {
  styles: `
    .legacy-styles { color: red; }
  `,

  init() {
    console.log('Legacy модуль инициализирован');
    return true;
  },

  destroy() {
    console.log('Legacy модуль уничтожен');
    return true;
  }
};

export default LegacyModule;
```

## Использование

### Загрузка модулей в app.js
```javascript
// В методе loadModules()
const modulesToLoad = [
  {
    name: 'my-module',
    options: {
      setting1: 'value1',
      setting2: true
    }
  },
  {
    name: 'legacy-module',
    options: {}
  }
];

const results = await this.moduleLoader.loadModules(modulesToLoad);
```

### Работа с модулями
```javascript
// Получить модуль
const myModule = app.getModule('my-module');

// Загрузить модуль динамически
const newModule = await app.loadModule('new-module', { option: 'value' });

// Выгрузить модуль
await app.unloadModule('my-module');

// Получить информацию о всех модулях
const info = app.getModulesInfo();
```

### Система событий
```javascript
// Отправка события
eventBus.emit('module:ready', { module: 'my-module' });

// Подписка на событие
eventBus.on('module:ready', (data) => {
  console.log('Модуль готов:', data.module);
});

// Одноразовая подписка
eventBus.once('app:initialized', () => {
  console.log('Приложение инициализировано');
});

// Отписка
eventBus.off('module:ready', handler);

// Namespace для модуля
const moduleEvents = eventBus.namespace('my-module');
moduleEvents.emit('custom-event', { data: 'value' });
```

## Примеры модулей

### 1. notification.js
Модуль уведомлений с кастомными стилями:
- Показ различных типов уведомлений
- Автоматическое скрытие
- Анимации и адаптивность
- Интеграция с другими модулями

### 2. theme.js  
Модуль управления темами:
- Переключение между светлой/темной/авто темами
- Автоматическое определение системной темы
- Сохранение настроек в localStorage
- CSS переменные для легкой кастомизации

## API для отладки

В консоли браузера доступны глобальные объекты:

```javascript
// Основное приложение
window.app

// Система событий
window.eventBus

// Реестр модулей
window.modules

// Загрузка модуля
window.loadModule('module-name', { options })

// Получение модуля
window.getModule('module-name')

// Информация о модулях
window.getModulesInfo()

// Отладка EventBus
eventBus.debug()

// Статистика
eventBus.getStats()

// История событий
eventBus.getHistory()
```

## Структура файлов

```
js/
├── app.js                    # Главный файл приложения
└── modules/
    ├── Module.js             # Базовый класс модуля
    ├── EventBus.js           # Система событий
    ├── ModuleLoader.js       # Загрузчик модулей
    ├── notification.js       # Пример модуля уведомлений
    ├── theme.js              # Пример модуля тем
    ├── pwa.js                # Legacy модуль PWA
    ├── cache-strategy.js     # Legacy модуль кеширования
    └── README.md             # Эта документация
```

## Особенности

1. **Автоматическое внедрение стилей** - каждый модуль может иметь свои CSS стили
2. **Система событий** - модули могут взаимодействовать через EventBus
3. **Legacy поддержка** - старые модули работают без изменений
4. **Lazy loading** - модули загружаются по требованию
5. **Error handling** - встроенная обработка ошибок и retry логика
6. **Hot reload** - поддержка перезагрузки модулей в development режиме

## Расширение системы

Для добавления нового модуля:

1. Создайте файл `js/modules/your-module.js`
2. Наследуйтесь от `Module` или создайте объект с методами `init/destroy`
3. Добавьте модуль в список загрузки в `app.js`
4. При необходимости добавьте взаимодействие через EventBus
