/**
 * Модуль для отображения toast-уведомлений.
 */

let toastContainer = document.getElementById("toast-container");
if (!toastContainer) {
  toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  toastContainer.className =
    "fixed bottom-5 right-5 z-[100] flex flex-col items-end space-y-3 w-full max-w-xs";
  document.body.appendChild(toastContainer);
}

const icons = {
  success: `<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  error: `<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  info: `<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  warning: `<svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
};

const toastQueue = [];
let visibleToasts = 0;
const maxVisibleToasts = 3;

function displayToast(message, type) {
  visibleToasts++;
  const toastElement = document.createElement("div");
  toastElement.className = `toast-notification flex items-center w-full p-4 space-x-4 rounded-lg shadow-lg transform transition-all duration-300 opacity-0 translate-x-full relative overflow-hidden`;

  toastElement.innerHTML = `
        <div class="icon">${icons[type]}</div>
        <div class="text-sm font-normal">${message}</div>
    `;

  toastContainer.appendChild(toastElement);

  const duration = 3000;
  let startTime = Date.now();
  let remaining = duration;
  let isPaused = false;

  const animationEndHandler = (e) => {
    if (e.animationName === 'progress') {
      closeToast();
    }
  };

  requestAnimationFrame(() => {
    toastElement.classList.remove("opacity-0", "translate-x-full");
    toastElement.classList.add('animate-progress');
    toastElement.addEventListener('animationend', animationEndHandler);
  });

  const closeToast = (isSwipe = false) => {
    if (toastElement.classList.contains('closing')) return;
    toastElement.classList.add('closing');

    if (isSwipe) {
      toastElement.removeEventListener('animationend', animationEndHandler);
    }
    
    toastElement.classList.add("opacity-0");
    const swipeDirection = Math.sign(currentX - startX) || 1;
    toastElement.style.transform = `translateX(${swipeDirection * 100}%)`;

    const onTransitionEnd = () => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
      toastElement.removeEventListener("transitionend", onTransitionEnd);
      visibleToasts--;
      processQueue();
    };

    toastElement.addEventListener("transitionend", onTransitionEnd);
  };

  const pause = () => {
    if (!isPaused) {
      isPaused = true;
      remaining -= Date.now() - startTime;
      toastElement.classList.add('progress-paused');
    }
  }

  const resume = () => {
    if (isPaused) {
      isPaused = false;
      startTime = Date.now();
      toastElement.classList.remove('progress-paused');
    }
  }

  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  toastElement.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    currentX = startX;
    isDragging = true;
    toastElement.style.transition = 'none';
    pause();
  }, { passive: true });

  toastElement.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    toastElement.style.transform = `translateX(${diffX}px)`;
    toastElement.style.opacity = 1 - (Math.abs(diffX) / toastElement.offsetWidth);
  }, { passive: true });

  toastElement.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    toastElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

    const diffX = currentX - startX;
    if (Math.abs(diffX) > toastElement.offsetWidth / 3) {
      closeToast(true); // Передаем флаг, что это свайп
    } else {
      toastElement.style.transform = 'translateX(0)';
      toastElement.style.opacity = 1;
      resume();
    }
  });
}

function processQueue() {
  if (toastQueue.length > 0 && visibleToasts < maxVisibleToasts) {
    const { message, type } = toastQueue.shift();
    displayToast(message, type);
  }
}

function createToast(message, type) {
  toastQueue.push({ message, type });
  processQueue();
}

const Toast = {
  success: (message) => createToast(message, "success"),
  error: (message) => createToast(message, "error"),
  info: (message) => createToast(message, "info"),
  warning: (message) => createToast(message, "warning"),
};

export default Toast;
