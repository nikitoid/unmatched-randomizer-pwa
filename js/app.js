import Modal from './modules/modal.js';
import Toast from './modules/toast.js';

window.Modal = Modal;
window.Toast = Toast;

if ('serviceWorker' in navigator) {
  let newWorker;

  const updateBanner = document.getElementById('update-banner');

  function showUpdateBanner() {
    if (updateBanner) {
      updateBanner.classList.remove('hidden', 'animate-out');
      updateBanner.classList.add('animate-in');
      setTimeout(hideUpdateBanner, 5000);
    }
  }

  function hideUpdateBanner() {
    if (updateBanner) {
      updateBanner.classList.remove('animate-in');
      updateBanner.classList.add('animate-out');
    }
  }
  
  console.log('APP: Регистрация Service Worker...');
  navigator.serviceWorker.register('/sw.js').then(reg => {
    console.log('APP: Service Worker зарегистрирован.');
    reg.addEventListener('updatefound', () => {
      console.log('APP: Обнаружена новая версия Service Worker, начинается установка...');
      newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        console.log('APP: Состояние нового Service Worker изменилось:', newWorker.state);
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('APP: Новая версия установлена, показываем уведомление и начинаем активацию.');
          showUpdateBanner();
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    if (reg.waiting) {
        console.log('APP: Обнаружен ожидающий Service Worker. Показ баннера и активация.');
        newWorker = reg.waiting;
        showUpdateBanner();
        newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }).catch(registrationError => {
    console.log('SW registration failed: ', registrationError);
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('APP: Service Worker был обновлен. Перезагрузка страницы...');
    Toast.success('Приложение было обновлено!');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
  });
}
