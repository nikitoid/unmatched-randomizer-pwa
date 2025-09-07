import Modal from './modules/modal.js';
import Toast from './modules/toast.js';

window.Modal = Modal;
window.Toast = Toast;

if ('serviceWorker' in navigator) {
  const updateOverlay = document.getElementById('update-overlay');

  function showUpdateSpinner() {
    if (updateOverlay) {
      updateOverlay.classList.remove('hidden');
    }
  }

  // We might not need to hide it manually as the page will reload
  function hideUpdateSpinner() {
    if (updateOverlay) {
      updateOverlay.classList.add('hidden');
    }
  }

  // Check if the page was reloaded for an update.
  if (sessionStorage.getItem('swUpdate')) {
    Toast.success('Приложение было обновлено!');
    sessionStorage.removeItem('swUpdate');
  }

  console.log('APP: Регистрация Service Worker...');
  navigator.serviceWorker.register('/sw.js').then(reg => {
    console.log('APP: Service Worker зарегистрирован.');
    reg.addEventListener('updatefound', () => {
      console.log('APP: Обнаружена новая версия Service Worker, начинается установка...');
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        console.log('APP: Состояние нового Service Worker изменилось:', newWorker.state);
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // This is an update
            console.log('APP: Новая версия установлена, начинаем активацию.');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          } else {
            // This is the first installation
            console.log('APP: Service Worker установлен впервые.');
          }
        }
      });
    });

    // Show spinner if a new SW is already installing
    if (reg.installing) {
        if (navigator.serviceWorker.controller) {
            showUpdateSpinner();
        }
    }
    
  }).catch(registrationError => {
    console.log('SW registration failed: ', registrationError);
    hideUpdateSpinner(); // Hide spinner on error
  });

  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    console.log('APP: Service Worker был обновлен. Перезагрузка страницы...');
    sessionStorage.setItem('swUpdate', 'true');
    window.location.reload();
    refreshing = true;
  });
}
