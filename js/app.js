(() => {
  const ready = () => document.body.classList.contains('ready');

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (err) {
      console.error('SW registration failed', err);
    }
  };

  const bindUI = () => {
    const $theme = document.getElementById('themeToggle');
    const $settings = document.getElementById('listsSettings');
    const $gen = document.getElementById('generateBtn');
    const $last = document.getElementById('lastResultBtn');
    const $reset = document.getElementById('resetSessionBtn');

    $theme?.addEventListener('click', () => {
      // заглушка
    });
    $settings?.addEventListener('click', () => {
      // заглушка
    });
    $gen?.addEventListener('click', () => {
      // заглушка
    });
    $last?.addEventListener('click', () => {
      // заглушка
    });
    $reset?.addEventListener('click', () => {
      // заглушка
    });
  };

  const init = async () => {
    bindUI();
    await registerServiceWorker();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();


