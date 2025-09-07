import Modal from './modules/modal.js';
import Toast from './modules/toast.js';

// Make them globally available for demo purposes
window.Modal = Modal;
window.Toast = Toast;

const updateOverlay = document.getElementById('update-overlay');

function showUpdateSpinner() {
    if (updateOverlay) {
        updateOverlay.classList.remove('hidden');
    }
}

function hideUpdateSpinner() {
    if (updateOverlay) {
        updateOverlay.classList.add('hidden');
    }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        if (installingWorker && navigator.serviceWorker.controller) {
          showUpdateSpinner();
        }
      };
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      hideUpdateSpinner();
      Toast.success('Приложение было обновлено!');
    });
  });
}
