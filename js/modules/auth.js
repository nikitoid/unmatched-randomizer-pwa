/**
 * Authentication module for Unmatched Randomizer
 * Handles password input modal and session caching
 */

class AuthManager {
    constructor() {
        this.cachedPassword = null;
        this.sessionKey = 'unmatched_session_password';
        this.modal = null;
        this.callback = null;
        
        this.init();
    }

    init() {
        // Try to restore cached password from session
        this.restoreCachedPassword();
        
        // Create password input modal
        this.createPasswordModal();
    }

    /**
     * Restore cached password from session storage
     */
    restoreCachedPassword() {
        try {
            const cached = sessionStorage.getItem(this.sessionKey);
            if (cached) {
                this.cachedPassword = cached;
                console.log('Password restored from session cache');
            }
        } catch (error) {
            console.error('Failed to restore cached password:', error);
        }
    }

    /**
     * Cache password in session storage
     */
    cachePassword(password) {
        try {
            sessionStorage.setItem(this.sessionKey, password);
            this.cachedPassword = password;
            console.log('Password cached for session');
        } catch (error) {
            console.error('Failed to cache password:', error);
        }
    }

    /**
     * Clear cached password
     */
    clearCachedPassword() {
        try {
            sessionStorage.removeItem(this.sessionKey);
            this.cachedPassword = null;
            console.log('Cached password cleared');
        } catch (error) {
            console.error('Failed to clear cached password:', error);
        }
    }

    /**
     * Create password input modal
     */
    createPasswordModal() {
        const modalHTML = `
            <div id="passwordModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Enter Password</h3>
                        <span class="close" id="passwordModalClose">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p>This operation requires a password to access the database.</p>
                        <div class="form-group">
                            <label for="passwordInput">Password:</label>
                            <input type="password" id="passwordInput" placeholder="Enter password" autocomplete="current-password">
                        </div>
                        <div class="form-actions">
                            <button id="passwordSubmit" class="btn btn-primary">Submit</button>
                            <button id="passwordCancel" class="btn btn-secondary">Cancel</button>
                        </div>
                        <div id="passwordError" class="error-message" style="display: none;"></div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body if it doesn't exist
        if (!document.getElementById('passwordModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.modal = document.getElementById('passwordModal');
            this.setupModalEvents();
        }
    }

    /**
     * Setup modal event listeners
     */
    setupModalEvents() {
        const modal = this.modal;
        const closeBtn = document.getElementById('passwordModalClose');
        const cancelBtn = document.getElementById('passwordCancel');
        const submitBtn = document.getElementById('passwordSubmit');
        const passwordInput = document.getElementById('passwordInput');

        // Close modal events
        closeBtn.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());
        
        // Click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        // Submit password
        submitBtn.addEventListener('click', () => this.submitPassword());
        
        // Enter key to submit
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitPassword();
            }
        });

        // Clear error on input
        passwordInput.addEventListener('input', () => {
            this.hideError();
        });
    }

    /**
     * Show password modal
     */
    showModal(callback) {
        this.callback = callback;
        this.modal.style.display = 'block';
        document.getElementById('passwordInput').focus();
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide password modal
     */
    hideModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('passwordInput').value = '';
        this.hideError();
        this.callback = null;
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('passwordError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorDiv = document.getElementById('passwordError');
        errorDiv.style.display = 'none';
    }

    /**
     * Submit password from modal
     */
    async submitPassword() {
        const passwordInput = document.getElementById('passwordInput');
        const password = passwordInput.value.trim();
        
        if (!password) {
            this.showError('Please enter a password');
            return;
        }

        try {
            // Verify password with Firebase
            if (window.firebaseManager && !(await window.firebaseManager.verifyPassword(password))) {
                this.showError('Invalid password');
                return;
            }

            // Cache password and execute callback
            this.cachePassword(password);
            this.hideModal();
            
            if (this.callback) {
                this.callback(password);
            }
            
        } catch (error) {
            console.error('Password verification failed:', error);
            this.showError('Verification failed. Please try again.');
        }
    }

    /**
     * Request password from user
     * Returns a promise that resolves with the password
     */
    async requestPassword() {
        // Return cached password if available
        if (this.cachedPassword) {
            return this.cachedPassword;
        }

        // Show modal and wait for user input
        return new Promise((resolve, reject) => {
            this.showModal((password) => {
                if (password) {
                    resolve(password);
                } else {
                    reject(new Error('Password input cancelled'));
                }
            });
        });
    }

    /**
     * Check if password is cached
     */
    hasCachedPassword() {
        return this.cachedPassword !== null;
    }

    /**
     * Get cached password
     */
    getCachedPassword() {
        return this.cachedPassword;
    }

    /**
     * Force password re-entry (clear cache and request new password)
     */
    async forcePasswordEntry() {
        this.clearCachedPassword();
        return this.requestPassword();
    }
}

// Export for use in other modules
window.AuthManager = AuthManager;
