// Импортируем функции Firestore из глобального window
import { doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

$(document).ready(function() {
    // --- Глобальные переменные и константы ---
    let currentPlayers = [];
    let currentHeroes = [];
    let heroData = {}; // Локальная копия данных из Firestore
    const db = window.db; 
    const listsDocRef = doc(db, "lists", "main");
    const PWD_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'; // sha256 from '1234'
    const EXCLUSION_SUFFIX = ' (искл.)';

    // --- Вспомогательные функции ---
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    function saveLastGeneration() {
        try {
            const data = JSON.stringify({ players: currentPlayers, heroes: currentHeroes });
            localStorage.setItem('lastGeneration', data);
            $('#show-last-gen-btn').removeClass('hidden');
        } catch (e) {
            console.error("Failed to save last generation:", e);
        }
    }

    function loadLastGeneration() {
        try {
            const data = localStorage.getItem('lastGeneration');
            if (data) {
                const parsed = JSON.parse(data);
                currentPlayers = parsed.players;
                currentHeroes = parsed.heroes;
                return true;
            }
        } catch (e) {
            console.error("Failed to load last generation:", e);
        }
        return false;
    }

    function getBaseListName(listName) {
        return listName.endsWith(EXCLUSION_SUFFIX) 
            ? listName.slice(0, -EXCLUSION_SUFFIX.length) 
            : listName;
    }

    // --- Функции для обновления UI ---
    function populateSelects(data) {
        if (!data || !data.lists) return;
        heroData = data; 
        
        const mainSelect = $('#hero-list');
        const modalSelect = $('#modal-list-select');
        const hasExclusionLists = Object.keys(data.lists).some(name => name.endsWith(EXCLUSION_SUFFIX));
        
        mainSelect.empty();
        modalSelect.empty();

        for (const listName in data.lists) {
            mainSelect.append($('<option>', { value: listName, text: listName }));
            modalSelect.append($('<option>', { value: listName, text: listName }));
        }

        mainSelect.val(data.selected);
        modalSelect.val(data.selected);
        updateModalTextarea();

        hasExclusionLists ? $('#reset-session-btn').removeClass('hidden') : $('#reset-session-btn').addClass('hidden');
    }

    function updateModalTextarea() {
        const selectedList = $('#modal-list-select').val();
        if (selectedList && heroData.lists && heroData.lists[selectedList]) {
            $('#heroes-textarea').val(heroData.lists[selectedList].join('\n'));
        }
    }
    
    // --- Основная логика рандомизации ---
    function generateTeams() {
        const selectedListName = $('#hero-list').val();
        if (!selectedListName || !heroData.lists[selectedListName]) {
            alert("Данные о героях еще не загружены или список пуст.");
            return;
        }
        const heroes = heroData.lists[selectedListName];

        if (!heroes || heroes.length < 4) {
            alert('В выбранном списке должно быть не менее 4 героев!');
            return;
        }

        currentPlayers = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
        currentHeroes = [...heroes].sort(() => Math.random() - 0.5).slice(0, 4);

        displayResults();
        saveLastGeneration();
        $('#trigger-results-modal').click();
    }
    
    function displayResults() {
        const resultsContent = $('#results-content').empty();
        for (let i = 0; i < 4; i++) {
            const playerDiv = $('<div>', {
                class: 'py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center',
            }).text(`Игрок ${currentPlayers[i]}: ${currentHeroes[i]}`);

            const excludeBtn = $('<button>', {
                class: 'p-1 rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition-colors',
                'data-hero-name': currentHeroes[i],
                'data-player-index': i,
                html: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
            });
            playerDiv.append(excludeBtn);
            resultsContent.append(playerDiv);
        }
    }
    
    function rerollTeams() {
        currentPlayers.sort(() => Math.random() - 0.5);
        displayResults();
        saveLastGeneration();
    }

    function rerollHeroes() {
        const selectedListName = $('#hero-list').val();
        const heroes = heroData.lists[selectedListName];
        if (!heroes || heroes.length < 4) return;
        currentHeroes = [...heroes].sort(() => Math.random() - 0.5).slice(0, 4);
        displayResults();
        saveLastGeneration();
    }

    // --- Логика исключения героев ---

    async function excludeHeroes(heroesToExclude) {
        const currentListName = $('#hero-list').val();
        const baseListName = getBaseListName(currentListName);
        const exclusionListName = baseListName + EXCLUSION_SUFFIX;

        const sourceHeroes = heroData.lists[currentListName];
        if (!sourceHeroes) return alert('Не найден текущий список героев!');

        const newHeroList = sourceHeroes.filter(h => !heroesToExclude.includes(h));

        if (newHeroList.length < 4) {
            return alert('После исключения в списке останется меньше 4 героев. Действие отменено.');
        }

        heroData.lists[exclusionListName] = newHeroList;
        heroData.selected = exclusionListName;
        
        try {
            await setDoc(listsDocRef, heroData);
            
            $('#trigger-close-results-modal').click();
            localStorage.removeItem('lastGeneration');
            $('#show-last-gen-btn').addClass('hidden');

        } catch (error) {
            alert('Не удалось применить исключение. Ошибка: ' + error.message);
        }
    }

    async function excludeSingleHero(heroToExclude, playerIndex) {
        const currentListName = $('#hero-list').val();
        const baseListName = getBaseListName(currentListName);
        const exclusionListName = baseListName + EXCLUSION_SUFFIX;

        const sourceListForExclusion = heroData.lists[currentListName];
        if (!sourceListForExclusion) return alert('Не найден текущий список героев для исключения!');
        
        const newExclusionList = sourceListForExclusion.filter(h => h !== heroToExclude);
        
        const otherHeroesOnScreen = currentHeroes.filter(h => h !== heroToExclude);
        const replacementPool = newExclusionList.filter(h => !otherHeroesOnScreen.includes(h));

        if (replacementPool.length === 0) {
            alert('Нет доступных героев для замены!');
            return;
        }
        
        heroData.lists[exclusionListName] = newExclusionList;
        heroData.selected = exclusionListName;
        
        const newHero = replacementPool[Math.floor(Math.random() * replacementPool.length)];
        currentHeroes[playerIndex] = newHero;

        try {
            await setDoc(listsDocRef, heroData);
            displayResults();
            saveLastGeneration();
        } catch (error) {
            alert('Не удалось применить исключение. Ошибка: ' + error.message);
        }
    }

    async function resetSession() {
        const listsToDelete = Object.keys(heroData.lists).filter(name => name.endsWith(EXCLUSION_SUFFIX));
        if (listsToDelete.length === 0) return;

        listsToDelete.forEach(listName => {
            delete heroData.lists[listName];
        });

        if (heroData.selected.endsWith(EXCLUSION_SUFFIX)) {
            heroData.selected = getBaseListName(heroData.selected);
        }

        try {
            await setDoc(listsDocRef, heroData);
            localStorage.removeItem('lastGeneration');
            $('#show-last-gen-btn').addClass('hidden');
            alert('Сессия сброшена!');
        } catch (error) {
            alert('Не удалось сбросить сессию. Ошибка: ' + error.message);
        }
    }

    // --- Инициализация и обработчики событий ---
    function initApp() {
        const settingsBtn = $('#settings-btn');
        const syncIndicator = $('#update-indicator');

        syncIndicator.removeClass('hidden');
        settingsBtn.addClass('hidden');

        onSnapshot(listsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                populateSelects(docSnap.data());
            } else {
                alert("База данных не найдена. Обратитесь к администратору.");
            }
            syncIndicator.addClass('hidden');
            settingsBtn.removeClass('hidden');
        }, (error) => {
            alert("Не удалось подключиться к базе данных. Проверьте интернет-соединение.");
            syncIndicator.addClass('hidden');
            settingsBtn.removeClass('hidden');
        });

        if (loadLastGeneration()) {
            $('#show-last-gen-btn').removeClass('hidden');
        }

        // -- ОБРАБОТЧИКИ СОБЫТИЙ --
        $('#generate-btn').on('click', generateTeams);
        $('#remix-teams-btn').on('click', rerollTeams);
        $('#remix-heroes-btn').on('click', rerollHeroes);
        $('#reset-btn').on('click', generateTeams);

        $('#show-last-gen-btn').on('click', () => {
            if (loadLastGeneration()) {
                displayResults();
                $('#trigger-results-modal').click();
            } else {
                alert('Нет данных о последней генерации.');
            }
        });

        $('#reset-session-btn').on('click', () => $('#trigger-confirm-reset-modal').click());
        $('#confirm-reset-btn').on('click', resetSession);

        $('#exclude-all-btn').on('click', () => excludeHeroes(currentHeroes));
        $('#results-content').on('click', 'button', function() {
            const heroName = $(this).data('hero-name');
            const playerIndex = $(this).data('player-index');
            excludeSingleHero(heroName, playerIndex);
        });
        
        // -- Логика модального окна настроек --
        $('#login-btn').on('click', async () => {
            const password = $('#password-input').val();
            const hash = await sha256(password);
            if (hash === PWD_HASH) {
                $('#password-section').addClass('hidden');
                $('#management-section').removeClass('hidden');
            } else {
                alert('Неверный пароль!');
            }
        });
        $('#modal-list-select').on('change', updateModalTextarea);

        $('#set-default-btn').on('click', async function() {
            const newSelectedList = $('#modal-list-select').val();
            heroData.selected = newSelectedList;
            try {
                await setDoc(listsDocRef, heroData);
                alert(`Список "${newSelectedList}" установлен по умолчанию!`);
            } catch (error) {
                alert("Не удалось сохранить изменения.");
            }
        });
        $('#save-list-btn').on('click', async function() {
            const listName = $('#modal-list-select').val();
            const heroes = $('#heroes-textarea').val().split('\n').map(h => h.trim()).filter(h => h);
            heroData.lists[listName] = heroes;
            try {
                await setDoc(listsDocRef, heroData);
                alert(`Список "${listName}" сохранен!`);
            } catch (error) {
                alert("Не удалось сохранить изменения.");
            }
        });
        $('#create-list-btn').on('click', async function() {
            const newName = $('#new-list-name').val().trim();
            if (!newName) return alert('Введите имя нового списка!');
            if (heroData.lists[newName]) return alert('Список с таким именем уже существует!');
            heroData.lists[newName] = [];
            try {
                await setDoc(listsDocRef, heroData);
                $('#new-list-name').val('');
                alert(`Список "${newName}" создан!`);
            } catch (error) {
                 alert("Не удалось создать список.");
            }
        });
        $('#delete-list-btn').on('click', async function() {
            const listName = $('#modal-list-select').val();
            if (Object.keys(heroData.lists).length <= 1) {
                return alert('Нельзя удалить последний список!');
            }
            if (confirm(`Вы уверены, что хотите удалить список "${listName}"?`)) {
                delete heroData.lists[listName];
                if (heroData.selected === listName) {
                    heroData.selected = Object.keys(heroData.lists)[0];
                }
                try {
                    await setDoc(listsDocRef, heroData);
                    alert(`Список "${listName}" удален!`);
                } catch (error) {
                    alert("Не удалось удалить список.");
                }
            }
        });

        // Глобальный слушатель для закрытия модальных окон из любого места
        document.addEventListener('close-modals', () => {
            const appState = document.querySelector('[x-data]').__x.$data;
            appState.closeAllModals();
        });
    }
    
    initApp();
});

"

