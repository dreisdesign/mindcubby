/**
 * Storage API Utility
 * Provides a consistent interface for app-specific localStorage operations.
 *
 * Naming convention: `{app}-{feature}` (e.g., 'note-items', 'pad-drawing')
 *
 * Usage:
 *   import { StorageAPI } from '../design-system/utils/storage-api.js';
 *
 *   const storage = new StorageAPI('note'); // App name
 *
 *   // Get/set items
 *   storage.get('items'); // Returns 'note-items' from localStorage
 *   storage.set('items', JSON.stringify(data)); // Saves to 'note-items'
 *   storage.remove('items'); // Removes 'note-items'
 *   storage.clear(); // Removes all keys starting with 'note-'
 *
 *   // JSON helpers
 *   storage.getJSON('items', []); // Automatically parses JSON, fallback to []
 *   storage.setJSON('items', data); // Automatically stringifies
 */

export class StorageAPI {
    /**
     * Create a storage API instance for an app.
     * @param {string} appName - App identifier (e.g., 'note', 'pad', 'tracker')
     */
    constructor(appName) {
        if (!appName) {
            throw new Error('StorageAPI: appName is required');
        }
        this.appName = appName;
        this.prefix = `${appName}-`;
    }

    /**
     * Get a value from localStorage.
     * @param {string} key - Key name (will be prefixed with '{app}-')
     * @param {any} fallback - Value to return if key not found
     * @returns {string|any} The stored value or fallback
     */
    get(key, fallback = null) {
        const fullKey = this.prefix + key;
        const value = localStorage.getItem(fullKey);
        return value !== null ? value : fallback;
    }

    /**
     * Set a value in localStorage.
     * @param {string} key - Key name (will be prefixed with '{app}-')
     * @param {string} value - Value to store
     */
    set(key, value) {
        const fullKey = this.prefix + key;
        localStorage.setItem(fullKey, value);
    }

    /**
     * Remove a value from localStorage.
     * @param {string} key - Key name (will be prefixed with '{app}-')
     */
    remove(key) {
        const fullKey = this.prefix + key;
        localStorage.removeItem(fullKey);
    }

    /**
     * Get a JSON value from localStorage, with automatic parsing.
     * @param {string} key - Key name (will be prefixed with '{app}-')
     * @param {any} fallback - Value to return if key not found or JSON parse fails
     * @returns {any} The parsed JSON or fallback
     */
    getJSON(key, fallback = null) {
        const value = this.get(key);
        if (value === null) return fallback;

        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn(`StorageAPI: Failed to parse JSON for key '${key}':`, error);
            return fallback;
        }
    }

    /**
     * Set a JSON value in localStorage, with automatic stringification.
     * @param {string} key - Key name (will be prefixed with '{app}-')
     * @param {any} value - Object/array to store as JSON
     */
    setJSON(key, value) {
        try {
            const json = JSON.stringify(value);
            this.set(key, json);
        } catch (error) {
            console.error(`StorageAPI: Failed to stringify value for key '${key}':`, error);
        }
    }

    /**
     * Check if a key exists in localStorage.
     * @param {string} key - Key name (will be prefixed with '{app}-')
     * @returns {boolean} True if key exists
     */
    has(key) {
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    }

    /**
     * Get all keys for this app.
     * @returns {string[]} Array of unprefixed key names
     */
    keys() {
        const allKeys = Object.keys(localStorage);
        return allKeys
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.substring(this.prefix.length));
    }

    /**
     * Remove all keys for this app.
     */
    clear() {
        this.keys().forEach(key => this.remove(key));
    }

    /**
     * Get the full key name (for debugging).
     * @param {string} key - Key name (will be prefixed)
     * @returns {string} Full prefixed key name
     */
    fullKey(key) {
        return this.prefix + key;
    }
}
