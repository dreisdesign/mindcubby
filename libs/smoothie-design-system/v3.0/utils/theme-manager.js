/**
 * Theme Manager Utility
 * Centralizes flavor/theme persistence and initialization across all Labs apps.
 *
 * Usage:
 *   // In your app's <head> or very early in main.js:
 *   import { ThemeManager } from '../design-system/utils/theme-manager.js';
 *   ThemeManager.init('app-name'); // e.g., 'note', 'pad', 'tracker'
 *
 *   // Listen for changes (e.g., in your main.js):
 *   document.addEventListener('theme-changed', (e) => {
 *     console.log('New theme:', e.detail.theme);
 *   });
 *   document.addEventListener('flavor-changed', (e) => {
 *     console.log('New flavor:', e.detail.flavor);
 *   });
 */

export const ThemeManager = {
    /**
     * Initialize theme/flavor from localStorage and set up early injection.
     * Call this as early as possible in your app (preferably in <head>).
     * @param {string} appName - App identifier (e.g., 'note', 'pad', 'timer', 'tracker', 'today-list')
     */
    init(appName) {
        const flavor = localStorage.getItem(`${appName}-flavor`) || 'blueberry';
        const theme = localStorage.getItem(`${appName}-theme`) || 'light';

        this.applyTheme(flavor, theme);
        this.appName = appName;
    },

    /**
     * Apply theme/flavor classes and attributes to document root.
     * @param {string} flavor - 'vanilla', 'blueberry', or 'strawberry'
     * @param {string} theme - 'light' or 'dark'
     */
    applyTheme(flavor, theme) {
        const root = document.documentElement;

        // Remove old classes
        root.classList.remove('flavor-blueberry', 'flavor-strawberry', 'flavor-vanilla');
        root.classList.remove('theme-light', 'theme-dark');

        // Add new classes
        root.classList.add(`flavor-${flavor}`);
        root.classList.add(`theme-${theme}`);

        // Set color scheme attribute
        root.setAttribute('data-color-scheme', theme);
    },

    /**
     * Update theme and persist to localStorage.
     * @param {string} theme - 'light' or 'dark'
     */
    setTheme(theme) {
        if (!this.appName) {
            console.warn('ThemeManager: init() must be called before setTheme()');
            return;
        }

        localStorage.setItem(`${this.appName}-theme`, theme);
        this.applyTheme(localStorage.getItem(`${this.appName}-flavor`), theme);

        // Dispatch event for other listeners
        document.dispatchEvent(
            new CustomEvent('theme-changed', {
                detail: { theme, flavor: localStorage.getItem(`${this.appName}-flavor`) }
            })
        );
    },

    /**
     * Update flavor and persist to localStorage.
     * @param {string} flavor - 'vanilla', 'blueberry', or 'strawberry'
     */
    setFlavor(flavor) {
        if (!this.appName) {
            console.warn('ThemeManager: init() must be called before setFlavor()');
            return;
        }

        localStorage.setItem(`${this.appName}-flavor`, flavor);
        this.applyTheme(flavor, localStorage.getItem(`${this.appName}-theme`));

        // Dispatch event for other listeners
        document.dispatchEvent(
            new CustomEvent('flavor-changed', {
                detail: { flavor, theme: localStorage.getItem(`${this.appName}-theme`) }
            })
        );
    },

    /**
     * Get current theme.
     * @returns {string} 'light' or 'dark'
     */
    getTheme() {
        if (!this.appName) {
            console.warn('ThemeManager: init() must be called before getTheme()');
            return 'light';
        }
        return localStorage.getItem(`${this.appName}-theme`) || 'light';
    },

    /**
     * Get current flavor.
     * @returns {string} 'vanilla', 'blueberry', or 'strawberry'
     */
    getFlavor() {
        if (!this.appName) {
            console.warn('ThemeManager: init() must be called before getFlavor()');
            return 'blueberry';
        }
        return localStorage.getItem(`${this.appName}-flavor`) || 'blueberry';
    },

    // Internal state
    appName: null
};
