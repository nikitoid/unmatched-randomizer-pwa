import Modal from './modules/modal.js';
import Toast from './modules/toast.js';

// Make them globally available for demo purposes
window.Modal = Modal;
window.Toast = Toast;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
