class Modal {
    constructor({ type = 'dialog', title = '', content = '' } = {}) {
        this.type = type;
        this.title = title;
        this.content = content;
        this.modalElement = null;
        this.overlayElement = null;
        this._create();
    }

    _create() {
        // Overlay
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 opacity-0';
        this.overlayElement.addEventListener('click', () => this.close());

        // Modal container
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'fixed z-50 transition-all duration-300 transform';

        let modalClasses = '';
        let contentContainerClasses = 'p-6';

        switch (this.type) {
            case 'fullscreen':
                modalClasses = 'inset-0 bg-gray-700 translate-y-full';
                contentContainerClasses = 'p-6 h-full flex flex-col';
                break;
            case 'bottom-sheet':
                modalClasses = 'bottom-0 left-0 right-0 bg-gray-700 rounded-t-lg translate-y-full';
                break;
            case 'dialog':
            default:
                modalClasses = 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-700 rounded-lg shadow-lg opacity-0 scale-95';
                break;
        }

        this.modalElement.classList.add(...modalClasses.split(' '));

        // Modal content
        const contentContainer = document.createElement('div');
        contentContainer.className = contentContainerClasses;

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';

        const titleElement = document.createElement('h2');
        titleElement.className = 'text-xl font-bold';
        titleElement.textContent = this.title;

        const closeButton = document.createElement('button');
        closeButton.className = 'text-gray-400 hover:text-white';
        closeButton.innerHTML = `&times;`;
        closeButton.style.fontSize = '1.5rem';
        closeButton.addEventListener('click', () => this.close());

        header.appendChild(titleElement);
        header.appendChild(closeButton);

        const bodyElement = document.createElement('div');
        bodyElement.innerHTML = this.content;

        contentContainer.appendChild(header);
        contentContainer.appendChild(bodyElement);

        this.modalElement.appendChild(contentContainer);

        document.body.appendChild(this.overlayElement);
        document.body.appendChild(this.modalElement);
    }

    open() {
        // Небольшая задержка, чтобы браузер успел отрисовать начальное состояние перед анимацией
        setTimeout(() => {
            this.overlayElement.classList.remove('opacity-0');

            let transformClasses = '';
             switch (this.type) {
                case 'fullscreen':
                case 'bottom-sheet':
                     transformClasses = 'translate-y-0';
                     this.modalElement.classList.remove('translate-y-full');
                     this.modalElement.classList.add(transformClasses);
                    break;
                case 'dialog':
                default:
                    this.modalElement.classList.remove('opacity-0', 'scale-95');
                    break;
            }
        }, 10);
    }

    close() {
        this.overlayElement.classList.add('opacity-0');
        
        switch (this.type) {
            case 'fullscreen':
            case 'bottom-sheet':
                this.modalElement.classList.remove('translate-y-0');
                this.modalElement.classList.add('translate-y-full');
                break;
            case 'dialog':
            default:
                 this.modalElement.classList.add('opacity-0', 'scale-95');
                break;
        }

        setTimeout(() => {
            this.modalElement.remove();
            this.overlayElement.remove();
        }, 300); // Corresponds to transition duration
    }

    confirm() {
        // Placeholder for confirm logic
        console.log('Confirmed');
        this.close();
    }
}

export default Modal;
