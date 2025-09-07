import Modal from './modules/modal.js';
import Toast from './modules/toast.js';

window.Modal = Modal;
window.Toast = Toast;

if ('serviceWorker' in navigator) {
  let newWorker;

  const updateBanner = document.getElementById('update-banner');
  const updateButton = document.getElementById('update-button');
  const closeUpdateBannerButton = document.getElementById('close-update-banner');

  function showUpdateBanner() {
    if (updateBanner) {
      updateBanner.classList.remove('hidden');
      setTimeout(() => updateBanner.classList.add('show'), 10);
    }
  }

  function hideUpdateBanner() {
    if (updateBanner) {
      updateBanner.classList.remove('show');
    }
  }
  
  updateButton.addEventListener('click', () => {
    newWorker.postMessage({ type: 'SKIP_WAITING' });
    hideUpdateBanner();
  });

  closeUpdateBannerButton.addEventListener('click', hideUpdateBanner);
  
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });

    if (reg.waiting) {
        newWorker = reg.waiting;
        showUpdateBanner();
    }
  }).catch(registrationError => {
    console.log('SW registration failed: ', registrationError);
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    Toast.success('Приложение было обновлено!');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
  });
}
