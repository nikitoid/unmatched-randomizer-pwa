const Toast = {
    _createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2';
            document.body.appendChild(container);
        }
        return container;
    },

    _createToast(message, type) {
        const container = this._createContainer();

        const toastElement = document.createElement('div');
        toastElement.className = `p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-full opacity-0`;

        let bgColor = '';
        switch (type) {
            case 'success': bgColor = 'bg-green-500'; break;
            case 'error':   bgColor = 'bg-red-500';   break;
            case 'info':    bgColor = 'bg-blue-500';  break;
            case 'warning': bgColor = 'bg-yellow-500'; break;
            default:        bgColor = 'bg-gray-800';  break;
        }
        toastElement.classList.add(bgColor);
        toastElement.textContent = message;

        container.appendChild(toastElement);

        // Animate in
        setTimeout(() => {
            toastElement.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            toastElement.classList.add('translate-x-full', 'opacity-0');
            toastElement.addEventListener('transitionend', () => {
                toastElement.remove();
                if (container.childElementCount === 0) {
                    container.remove();
                }
            });
        }, 3000);
    },

    success(message) {
        this._createToast(message, 'success');
    },

    error(message) {
        this._createToast(message, 'error');
    },



    info(message) {
        this._createToast(message, 'info');
    },

    warning(message) {
        this._createToast(message, 'warning');
    }
};

export default Toast;
