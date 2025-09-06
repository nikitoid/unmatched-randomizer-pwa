/**
 * Firebase integration module for Unmatched Randomizer
 * Handles authentication, database operations, and synchronization
 */

class FirebaseManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.isOnline = navigator.onLine;
        this.isAuthenticated = false;
        this.syncInProgress = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Firebase
            const firebaseConfig = {
                apiKey: "AIzaSyBSvSbR_NJj7riu0HZPz3nile1X4tuxfsI",
                authDomain: "unmatched-randomizer.firebaseapp.com",
                projectId: "unmatched-randomizer",
                storageBucket: "unmatched-randomizer.firebasestorage.app",
                messagingSenderId: "168086799887",
                appId: "1:168086799887:web:3c8af51f935999b7d6c57a",
                measurementId: "G-GEQPMK68B0"
            };

            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.auth = firebase.auth();

            // Set up online/offline listeners
            this.setupNetworkListeners();
            
            // Attempt anonymous authentication
            await this.authenticateAnonymously();
            
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.isOnline = false;
        }
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Network connection restored');
            this.syncLists();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Network connection lost');
        });
    }

    async authenticateAnonymously() {
        try {
            await this.auth.signInAnonymously();
            this.isAuthenticated = true;
            console.log('Anonymous authentication successful');
        } catch (error) {
            console.error('Anonymous authentication failed:', error);
            this.isAuthenticated = false;
        }
    }

    /**
     * Synchronize lists with Firebase database
     * Downloads from Firebase and merges with localStorage
     */
    async syncLists() {
        if (!this.isOnline || !this.isAuthenticated || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;
        
        try {
            const docRef = this.db.collection('lists').doc('main');
            const doc = await docRef.get();
            
            if (doc.exists) {
                const firebaseData = doc.data();
                const localData = this.getLocalStorageData();
                
                // Merge data: Firebase takes precedence for lists, local for selected
                const mergedData = {
                    lists: { ...localData.lists, ...firebaseData.lists },
                    passwordHash: firebaseData.passwordHash || '',
                    selected: localData.selected || firebaseData.selected || ''
                };
                
                // Update localStorage with merged data
                localStorage.setItem('unmatchedLists', JSON.stringify(mergedData));
                
                console.log('Lists synchronized successfully');
                
                // Trigger storage event for other modules
                window.dispatchEvent(new CustomEvent('storageUpdated', { 
                    detail: { source: 'firebase' } 
                }));
            } else {
                console.log('No Firebase data found, using local data');
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Verify password against stored hash
     */
    async verifyPassword(password) {
        const localData = this.getLocalStorageData();
        const storedHash = localData.passwordHash;
        
        if (!storedHash) {
            return true; // No password set
        }
        
        const inputHash = await this.hashPassword(password);
        return inputHash === storedHash;
    }

    /**
     * Update list with password verification
     */
    async updateList(listId, data, password = null) {
        if (!this.isOnline) {
            throw new Error('No internet connection. Please check your network and try again.');
        }

        // Verify password if provided
        if (password && !(await this.verifyPassword(password))) {
            throw new Error('Invalid password');
        }

        try {
            const localData = this.getLocalStorageData();
            localData.lists[listId] = data;
            
            // Update localStorage
            localStorage.setItem('unmatchedLists', JSON.stringify(localData));
            
            // Update Firebase
            const docRef = this.db.collection('lists').doc('main');
            await docRef.set(localData, { merge: true });
            
            console.log(`List ${listId} updated successfully`);
            
            // Trigger storage event
            window.dispatchEvent(new CustomEvent('storageUpdated', { 
                detail: { source: 'firebase', action: 'update', listId } 
            }));
            
        } catch (error) {
            console.error('Update failed:', error);
            throw error;
        }
    }

    /**
     * Delete list with password verification
     */
    async deleteList(listId, password = null) {
        if (!this.isOnline) {
            throw new Error('No internet connection. Please check your network and try again.');
        }

        // Verify password if provided
        if (password && !(await this.verifyPassword(password))) {
            throw new Error('Invalid password');
        }

        try {
            const localData = this.getLocalStorageData();
            delete localData.lists[listId];
            
            // Update localStorage
            localStorage.setItem('unmatchedLists', JSON.stringify(localData));
            
            // Update Firebase
            const docRef = this.db.collection('lists').doc('main');
            await docRef.set(localData, { merge: true });
            
            console.log(`List ${listId} deleted successfully`);
            
            // Trigger storage event
            window.dispatchEvent(new CustomEvent('storageUpdated', { 
                detail: { source: 'firebase', action: 'delete', listId } 
            }));
            
        } catch (error) {
            console.error('Delete failed:', error);
            throw error;
        }
    }

    /**
     * Set password hash for the database
     */
    async setPassword(password) {
        if (!this.isOnline) {
            throw new Error('No internet connection. Please check your network and try again.');
        }

        try {
            const hash = await this.hashPassword(password);
            const localData = this.getLocalStorageData();
            localData.passwordHash = hash;
            
            // Update localStorage
            localStorage.setItem('unmatchedLists', JSON.stringify(localData));
            
            // Update Firebase
            const docRef = this.db.collection('lists').doc('main');
            await docRef.set(localData, { merge: true });
            
            console.log('Password set successfully');
            
        } catch (error) {
            console.error('Set password failed:', error);
            throw error;
        }
    }

    /**
     * Hash password using SHA-256
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get data from localStorage
     */
    getLocalStorageData() {
        const defaultData = { lists: {}, passwordHash: '', selected: '' };
        const stored = localStorage.getItem('unmatchedLists');
        return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
    }

    /**
     * Check if online and authenticated
     */
    isReady() {
        return this.isOnline && this.isAuthenticated;
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            online: this.isOnline,
            authenticated: this.isAuthenticated,
            syncInProgress: this.syncInProgress
        };
    }
}

// Export for use in other modules
window.FirebaseManager = FirebaseManager;
