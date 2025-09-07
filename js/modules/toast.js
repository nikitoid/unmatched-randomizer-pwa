class ToastManager {
    constructor(options = {}) {
        this.config = {
            position: 'bottom-right',
            maxVisible: 3,
            duration: 3000,
            ...options,
        };
        this.queue = [];
        this.visibleToasts = [];
        this.container = this._createContainer();
    }

    setOptions(options) {
        if (this.config.position !== options.position && options.position) {
             if (this.container) this.container.remove();
             this.config = { ...this.config, ...options };
             this.container = this._createContainer();
        } else {
            this.config = { ...this.config, ...options };
        }
        return this;
    }

    _createContainer() {
        const position = this.config.position;
        let container = document.getElementById(`toast-container-${position}`);
        if (container) return container;

        container = document.createElement('div');
        container.id = `toast-container-${position}`;
        
        const baseClasses = 'fixed z-50 flex flex-col space-y-2 p-4 max-w-xs sm:max-w-md w-full sm:w-auto pointer-events-none';
        const positionClasses = {
            'top-left': 'top-0 left-0 items-start',
            'top-right': 'top-0 right-0 items-end',
            'bottom-left': 'bottom-0 left-0 items-start',
            'bottom-right': 'bottom-0 right-0 items-end',
            'top': 'top-0 left-1/2 -translate-x-1/2 items-center',
            'bottom': 'bottom-0 left-1/2 -translate-x-1/2 items-center',
        }[position] || 'bottom-0 right-0 items-end';

        container.className = `${baseClasses} ${positionClasses}`;
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info') {
        if (this.visibleToasts.length >= this.config.maxVisible) {
            this.queue.push({ message, type });
            return;
        }
        this._createToast(message, type);
    }

    _createToast(message, type) {
        const toastElement = document.createElement('div');
        toastElement.id = `toast-${Date.now()}-${Math.random()}`;
        
        const typeColors = {
            success: 'bg-green-500', error: 'bg-red-500',
            info: 'bg-blue-500', warning: 'bg-yellow-500',
        };
        
        const isTop = this.config.position.includes('top');
        const initialTransform = isTop ? '-translate-y-full' : 'translate-y-full';

        toastElement.className = `relative p-4 rounded-lg shadow-lg text-white overflow-hidden transition-all duration-300 transform ${typeColors[type]} ${initialTransform} opacity-0 cursor-pointer pointer-events-auto`;
        
        toastElement.innerHTML = `<p>${message}</p><div class="absolute bottom-0 left-0 h-1 bg-black bg-opacity-25" style="width: 100%; transition: width ${this.config.duration}ms linear;"></div>`;
        const progressBar = toastElement.querySelector('div');

        this.container.appendChild(toastElement);
        this.visibleToasts.push(toastElement);

        setTimeout(() => {
            toastElement.classList.remove(initialTransform, 'opacity-0');
            progressBar.style.width = '0%';
        }, 10);

        this._addSwipeListeners(toastElement);

        const timeoutId = setTimeout(() => this._close(toastElement), this.config.duration);
        toastElement.dataset.timeoutId = timeoutId;
    }
    
    _performCleanup(toastElement) {
        toastElement.remove();
        this.visibleToasts = this.visibleToasts.filter(t => t !== toastElement);
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            this.show(next.message, next.type);
        }
    }

    _close(toastElement) {
        if (!toastElement || !this.visibleToasts.includes(toastElement)) return;

        clearTimeout(toastElement.dataset.timeoutId);
        
        const isTop = this.config.position.includes('top');
        toastElement.classList.add('opacity-0');
        if (isTop) {
            toastElement.style.transform = 'translateY(-100%)';
        } else {
            toastElement.style.transform = 'translateY(100%)';
        }

        const onTransitionEnd = () => {
            toastElement.removeEventListener('transitionend', onTransitionEnd);
            this._performCleanup(toastElement);
        };
        
        toastElement.addEventListener('transitionend', onTransitionEnd);
    }
    
    _addSwipeListeners(toastElement) {
        let startX = 0, currentX = 0, isDragging = false;
        
        const onDragStart = (e) => {
            isDragging = true;
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            toastElement.style.transition = 'none';
        };

        const onDragMove = (e) => {
            if (!isDragging) return;
            currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            toastElement.style.transform = `translateX(${currentX - startX}px)`;
        };

        const onDragEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            toastElement.style.transition = 'transform 0.3s, opacity 0.3s';

            if (Math.abs(currentX - startX) > 50) {
                clearTimeout(toastElement.dataset.timeoutId);
                const swipeDirection = currentX > startX ? '120%' : '-120%';
                toastElement.style.transform = `translateX(${swipeDirection})`;
                toastElement.style.opacity = '0';
                
                const onSwipeEnd = () => {
                    toastElement.removeEventListener('transitionend', onSwipeEnd);
                    this._performCleanup(toastElement);
                };
                toastElement.addEventListener('transitionend', onSwipeEnd);
            } else {
                toastElement.style.transform = 'translateX(0)';
            }
        };
        
        const onMouseLeave = (e) => {
            if(isDragging) onDragEnd(e);
        }

        toastElement.addEventListener('mousedown', onDragStart);
        toastElement.addEventListener('touchstart', onDragStart, { passive: true });
        toastElement.addEventListener('mousemove', onDragMove);
        toastElement.addEventListener('touchmove', onDragMove, { passive: true });
        toastElement.addEventListener('mouseup', onDragEnd);
        toastElement.addEventListener('touchend', onDragEnd);
        toastElement.addEventListener('mouseleave', onMouseLeave);
    }

    success(message) { this.show(message, 'success'); }
    error(message) { this.show(message, 'error'); }
    info(message) { this.show(message, 'info'); }
    warning(message) { this.show(message, 'warning'); }
}

const Toast = new ToastManager();

export default Toast;
