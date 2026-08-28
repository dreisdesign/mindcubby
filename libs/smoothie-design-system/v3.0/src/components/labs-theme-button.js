/**
 * Labs Theme Button
 * Cycling button to select theme (Vanilla, Blueberry, Strawberry)
 * 
 * Events:
 * - `theme-changed` (CustomEvent): emitted when theme is changed
 *   Detail: { theme: 'vanilla' | 'blueberry' | 'strawberry' }
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
      min-width: 100px;
      justify-content: center;
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

    .theme-label {
      font-size: 0.9em;
    }
  </style>

  <button aria-label="Cycle through themes" title="Click to cycle through themes">
    <span class="theme-label" id="label-slot">Vanilla</span>
  </button>
`;

class LabsThemeButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._themes = ['vanilla', 'blueberry', 'strawberry'];
    }

    connectedCallback() {
        const button = this.shadowRoot.querySelector('button');
        const labelSlot = this.shadowRoot.getElementById('label-slot');

        // Load current theme
        const currentTheme = this.getCurrentTheme();
        this.updateDisplay(currentTheme, labelSlot);

        // Cycle on click
        button.addEventListener('click', () => {
            const currentTheme = this.getCurrentTheme();
            const currentIndex = this._themes.indexOf(currentTheme);
            const nextTheme = this._themes[(currentIndex + 1) % this._themes.length];

            this.applyTheme(nextTheme);
            this.updateDisplay(nextTheme, labelSlot);

            // Emit custom event
            this.dispatchEvent(new CustomEvent('theme-changed', {
                detail: { theme: nextTheme },
                bubbles: true,
                composed: true
            }));

            // Broadcast to iframes
            if (window.self === window.top) {
                const iframes = document.querySelectorAll('iframe');
                const appearance = localStorage.getItem('smoothie-appearance') || 'light';
                iframes.forEach(iframe => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.postMessage(
                            { type: 'smoothie-theme-update', theme: nextTheme, appearance: appearance },
                            '*'
                        );
                    }
                });
            }
        });

        // Listen for external updates (from iframe or other source)
        window.addEventListener('message', (event) => {
            if (event.data.type === 'smoothie-theme-update' && event.data.theme) {
                const theme = event.data.theme;
                this.applyTheme(theme);
                this.updateDisplay(theme, labelSlot);

                // Also apply appearance if provided
                if (event.data.appearance) {
                    const root = document.documentElement;
                    root.classList.remove('appearance-light', 'appearance-dark');
                    root.classList.add(`appearance-${event.data.appearance}`);
                    localStorage.setItem('smoothie-appearance', event.data.appearance);
                }
            }
        });

        // Listen for localStorage changes
        window.addEventListener('storage', (event) => {
            if (event.key === 'smoothie-theme' && event.newValue) {
                this.updateDisplay(event.newValue, labelSlot);
            }
        });

        // Watch for class changes on root
        const observer = new MutationObserver(() => {
            const theme = this.getCurrentTheme();
            this.updateDisplay(theme, labelSlot);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    getCurrentTheme() {
        const root = document.documentElement;
        for (const theme of this._themes) {
            if (root.classList.contains(`theme-${theme}`)) {
                return theme;
            }
        }
        return 'vanilla';
    }

    applyTheme(theme) {
        const root = document.documentElement;

        // Remove old theme class
        this._themes.forEach(t => root.classList.remove(`theme-${t}`));

        // Add new theme class
        root.classList.add(`theme-${theme}`);

        // Persist
        localStorage.setItem('smoothie-theme', theme);
    }

    updateDisplay(theme, labelSlot) {
        const label = theme.charAt(0).toUpperCase() + theme.slice(1);
        labelSlot.textContent = label;
    }
}

customElements.define('labs-theme-button', LabsThemeButton);
