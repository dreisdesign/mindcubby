/**
 * labs-theme-toggle
 * Organism component: Theme and mode switcher with icon
 * Shows current theme/mode and provides quick toggle buttons
 * Broadcasts changes via postMessage and localStorage
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
    }

    .toggle-container {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      border: 1px solid var(--color-outline, #ddd);
      border-radius: 9999px;
      padding: 0.5em 0.75em;
      background: var(--color-surface, #fff);
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25em;
      line-height: 1;
    }

    .label {
      font-size: 0.9em;
      font-weight: 500;
      color: var(--color-on-surface, #333);
      white-space: nowrap;
    }

    button {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0.25em 0.5em;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
      font-size: 1em;
      line-height: 1;
    }

    button:hover {
      background: var(--color-surface-container, #f5f5f5);
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary, #333);
      outline-offset: 2px;
    }

    /* Icon-only mode */
    :host([icon-only]) .label {
      display: none;
    }

    :host([icon-only]) .toggle-container {
      padding: 0.5em;
      gap: 0;
    }

    :host([icon-only]) button {
      padding: 0.25em;
    }
  </style>

  <div class="toggle-container">
    <button class="toggle-button" aria-label="Toggle dark mode" title="Toggle dark mode">
      <span class="icon" id="icon-slot"></span>
    </button>
    <span class="label">Light</span>
  </div>
`;

class LabsThemeToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  async connectedCallback() {
    // Dynamic import of labs-icon
    await import('./labs-icon.js');

    this.button = this.shadowRoot.querySelector('.toggle-button');
    this.label = this.shadowRoot.querySelector('.label');
    this.iconSlot = this.shadowRoot.querySelector('#icon-slot');

    // Load current mode
    const currentMode = localStorage.getItem('smoothie-mode') || 'light';
    this.updateDisplay(currentMode);

    // Listen for clicks
    this.button.addEventListener('click', () => this.toggle());

    // Listen for external changes via postMessage
    window.addEventListener('message', (event) => {
      if (event.data.type === 'smoothie-theme-update' && event.data.mode) {
        this.updateDisplay(event.data.mode);
      }
    });
  }

  toggle() {
    const currentMode = localStorage.getItem('smoothie-mode') || 'light';
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    
    // Update self
    this.updateDisplay(newMode);
    
    // Persist
    localStorage.setItem('smoothie-mode', newMode);

    // Emit custom event for parent
    this.dispatchEvent(new CustomEvent('mode-changed', {
      detail: { mode: newMode },
      bubbles: true,
      composed: true
    }));

    // Broadcast to all iframes if in hub
    if (window.self === window.top) {
      this.broadcastToIframes({ mode: newMode });
    }
  }

  updateDisplay(mode) {
    const isDark = mode === 'dark';
    this.label.textContent = isDark ? 'Dark' : 'Light';
    this.button.setAttribute('title', isDark ? 'Turn on light mode' : 'Turn on dark mode');
    
    // Use labs-icon component
    const iconName = isDark ? 'bedtime_off' : 'bedtime';
    this.iconSlot.innerHTML = `<labs-icon name="${iconName}"></labs-icon>`;
  }

  broadcastToIframes(data) {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        iframe.contentWindow.postMessage(
          { type: 'smoothie-theme-update', ...data },
          '*'
        );
      } catch (e) {
        // Cross-origin or not ready
      }
    });
  }
}

customElements.define('labs-theme-toggle', LabsThemeToggle);
