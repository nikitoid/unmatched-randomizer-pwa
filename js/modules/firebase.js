import {
  ref,
  get,
  set,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import Auth from "./auth.js";
import Toast from "./toast.js";

const DB_PATH = "lists/main";

let db;
const getDb = () => {
  if (!db) db = window.firebaseDb;
  return db;
};

/**
 * Получает полный объект данных из Firebase.
 */
async function getDbObject() {
  try {
    const snapshot = await get(ref(getDb(), DB_PATH));
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Firebase: Ошибка получения данных", error);
    Toast.error("Ошибка при получении данных с сервера.");
    return null;
  }
}

/**
 * Синхронизирует данные из Firebase в localStorage.
 * Возвращает true, если данные были обновлены.
 */
async function syncLists() {
  console.log("Firebase: Начало синхронизации...");
  const remoteData = await getDbObject();
  if (remoteData) {
    // Здесь можно добавить более сложную логику слияния,
    // но пока просто перезаписываем локальные данные.
    localStorage.setItem("randomatched-data", JSON.stringify(remoteData));
    console.log("Firebase: Локальные данные обновлены с сервера.");
    Toast.success("Списки синхронизированы.");
    return true;
  }
  console.log(
    "Firebase: Удаленные данные не найдены, синхронизация пропущена."
  );
  return false;
}

/**
 * Проверяет пароль по хэшу в БД.
 */
async function verifyPassword(password) {
  const remoteData = await getDbObject();
  const remoteHash = remoteData ? remoteData.passwordHash : null;
  if (!remoteHash) {
    Toast.error(
      "На сервере не установлен пароль. Обратитесь к администратору."
    );
    return false;
  }
  const localHash = await Auth.hashSHA256(password);
  return remoteHash === localHash;
}

/**
 * Обновляет конкретный список в БД после проверки пароля.
 */
async function updateList(listId, heroArray, password) {
  if (!(await verifyPassword(password))) {
    Toast.error("Неверный пароль.");
    return false;
  }
  try {
    await update(ref(getDb(), `${DB_PATH}/lists`), {
      [listId]: heroArray,
    });
    Toast.success("Список обновлен на сервере.");
    return true;
  } catch (error) {
    console.error("Firebase: Ошибка обновления списка", error);
    Toast.error("Ошибка синхронизации при обновлении.");
    return false;
  }
}

/**
 * Удаляет список из БД после проверки пароля.
 */
async function deleteList(listId, password) {
  if (!(await verifyPassword(password))) {
    Toast.error("Неверный пароль.");
    return false;
  }
  try {
    await remove(ref(getDb(), `${DB_PATH}/lists/${listId}`));
    Toast.success("Список удален с сервера.");
    return true;
  } catch (error) {
    console.error("Firebase: Ошибка удаления списка", error);
    Toast.error("Ошибка синхронизации при удалении.");
    return false;
  }
}

/**
 * Обновляет весь объект в БД.
 */
async function updateAllData(data, password) {
  if (!(await verifyPassword(password))) {
    Toast.error("Неверный пароль.");
    return false;
  }
  try {
    await set(ref(getDb(), DB_PATH), data);
    console.log("Firebase: Все данные обновлены на сервере.");
    return true;
  } catch (error) {
    console.error("Firebase: Ошибка полной записи данных", error);
    Toast.error("Ошибка полной синхронизации.");
    return false;
  }
}

export default {
  syncLists,
  verifyPassword,
  updateList,
  deleteList,
  updateAllData,
};
