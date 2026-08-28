/**
 * Labs Appearance Toggle
 * Toggle between light and dark appearance modes
 * Shows bedtime icon and relevant label
 * 
 * Events:
 * - `appearance-changed` (CustomEvent): emitted when appearance is toggled
 *   Detail: { appearance: 'light' | 'dark' }
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
    }

    button {
      all: unset;
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.625em 1em;
      border: 1px solid var(--color-outline, #ddd);
      border-radius: 24px;
      background: var(--color-surface, #fff);
      color: var(--color-on-surface, #333);
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease-out;
      white-space: nowrap;
    }

    button:hover {
      background: var(--color-surface-container, #f5f5f5);
      border-color: var(--color-outline-variant, #ccc);
    }

    button:active {
      background: var(--color-surface-container-highest, #e8e8e8);
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary, #333);
      outline-offset: 2px;
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.2em;
      height: 1.2em;
      line-height: 1;
    }

    .label {
      font-size: 0.9em;
    }
  </style>

  <button aria-label="Toggle appearance" title="Toggle between light and dark mode">
    <span class="icon" id="icon-slot"></span>
    <span class="label" id="label-slot">Light</span>
  </button>
`;

class LabsAppearanceToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._appearances = ['light', 'dark'];
    }

    async connectedCallback() {
        // Dynamic import of labs-icon
        await import('./labs-icon.js');

        const button = this.shadowRoot.querySelector('button');
        const iconSlot = this.shadowRoot.getElementById('icon-slot');
        const labelSlot = this.shadowRoot.getElementById('label-slot');

        // Load current appearance from document or localStorage
        const currentAppearance = this.getCurrentAppearance();
        this.updateDisplay(currentAppearance, iconSlot, labelSlot);

        // Toggle on click
        button.addEventListener('click', () => {
            const currentAppearance = this.getCurrentAppearance();
            const newAppearance = currentAppearance === 'light' ? 'dark' : 'light';

            this.applyAppearance(newAppearance);
            this.updateDisplay(newAppearance, iconSlot, labelSlot);

            // Emit custom event
            this.dispatchEvent(new CustomEvent('appearance-changed', {
                detail: { appearance: newAppearance },
                bubbles: true,
                composed: true
            }));

            // Broadcast to iframes and listeners
            if (window.self === window.top) {
                const iframes = document.querySelectorAll('iframe');
                const theme = Array.from(document.documentElement.classList)
                    .find(cls => cls.startsWith('theme-'))
                    ?.replace('theme-', '') || 'vanilla';
                iframes.forEach(iframe => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.postMessage(
                            { type: 'smoothie-theme-update', appearance: newAppearance, theme: theme },
                            '*'
                        );
                    }
                });
            }
        });

        // Listen for external updates (from hub postMessage)
        window.addEventListener('message', (event) => {
            if (event.data.type === 'smoothie-theme-update') {
                if (event.data.appearance) {
                    const appearance = event.data.appearance;
                    this.applyAppearance(appearance);
                    this.updateDisplay(appearance, iconSlot, labelSlot);
                }
                // Also apply theme if provided
                if (event.data.theme) {
                    const root = document.documentElement;
                    root.classList.remove('theme-vanilla', 'theme-blueberry', 'theme-strawberry');
                    root.classList.add(`theme-${event.data.theme}`);
                    localStorage.setItem('smoothie-theme', event.data.theme);
                }
            }
        });

        // Listen for localStorage changes
        window.addEventListener('storage', (event) => {
            if (event.key === 'smoothie-appearance' && event.newValue) {
                this.updateDisplay(event.newValue, iconSlot, labelSlot);
            }
        });

        // Watch for class changes on root
        const observer = new MutationObserver(() => {
            const appearance = this.getCurrentAppearance();
            this.updateDisplay(appearance, iconSlot, labelSlot);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    getCurrentAppearance() {
        const root = document.documentElement;
        for (const appearance of this._appearances) {
            if (root.classList.contains(`appearance-${appearance}`)) {
                return appearance;
            }
        }
        return localStorage.getItem('smoothie-appearance') || 'light';
    }

    applyAppearance(appearance) {
        const root = document.documentElement;

        // Remove old appearance class
        this._appearances.forEach(a => root.classList.remove(`appearance-${a}`));

        // Add new appearance class
        root.classList.add(`appearance-${appearance}`);

        // Persist
        localStorage.setItem('smoothie-appearance', appearance);
    }

    updateDisplay(appearance, iconSlot, labelSlot) {
        const isDark = appearance === 'dark';

        // Clear icon slot
        while (iconSlot.firstChild) {
            iconSlot.removeChild(iconSlot.firstChild);
        }

        // Create and add icon
        const icon = document.createElement('labs-icon');
        icon.setAttribute('name', isDark ? 'bedtime_off' : 'bedtime');
        iconSlot.appendChild(icon);

        // Update label
        labelSlot.textContent = isDark ? 'Dark' : 'Light';
    }
}

customElements.define('labs-appearance-toggle', LabsAppearanceToggle);
