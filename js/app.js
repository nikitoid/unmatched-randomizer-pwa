(() => {
  const onReady = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };

  onReady(() => {
    const themeToggle = document.getElementById('theme-toggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const body = document.body;

    const setTheme = (theme) => {
      body.setAttribute('data-theme', theme);
      if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#0f0f10' : '#ffffff');
    };

    themeToggle?.addEventListener('click', () => {
      const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });

    document.getElementById('generate-btn')?.addEventListener('click', () => {});
    document.getElementById('last-gen-btn')?.addEventListener('click', () => {});
    document.getElementById('reset-btn')?.addEventListener('click', () => {});
    document.getElementById('open-settings')?.addEventListener('click', () => {});
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
})();
 