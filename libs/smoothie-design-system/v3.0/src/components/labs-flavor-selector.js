/**
 * Labs Flavor Selector - Dropdown-based flavor selection component
 * 
 * Provides a better UX than cycling through flavors via button clicks.
 * Shows current flavor and allows direct selection from a dropdown menu.
 * 
 * Attributes:
 * - `open` (boolean): when present, dropdown menu is shown
 * 
 * Events:
 * - `flavor-changed` (CustomEvent): emitted when user selects a new flavor
 *   Detail: { flavor: 'vanilla' | 'blueberry' | 'strawberry' }
 */

class LabsFlavorSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._open = false;
        this._menuId = `labs-flavor-menu-${Math.random().toString(36).slice(2, 8)}`;
        this._flavors = ['vanilla', 'blueberry', 'strawberry'];
        this._observer = null;
        this._portaledMenu = null;
        this.render();
    } static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        // Watch for flavor changes on document root
        const root = document.documentElement;
        this._observer = new MutationObserver(() => {
            this.render();
        });
        this._observer.observe(root, { attributes: true, attributeFilter: ['class'] });

        // Close menu on outside click
        document.addEventListener('click', this._outsideClick = (e) => {
            if (!this._open) return;
            const path = e.composedPath ? e.composedPath() : (e.path || []);
            if (!path.includes(this) && !path.includes(this.shadowRoot)) {
                this._closeMenu();
            }
        });
    }

    disconnectedCallback() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        document.removeEventListener('click', this._outsideClick);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'open') {
            this._open = this.hasAttribute('open');
            this.render();
        }
    }

    get open() {
        return this._open;
    }

    set open(val) {
        if (val) this.setAttribute('open', '');
        else this.removeAttribute('open');
    }

    _getCurrentFlavor() {
        const cls = [...document.documentElement.classList].find(c => c.startsWith('flavor-'));
        return cls ? cls.replace('flavor-', '') : 'vanilla';
    }

    _getFlavorLabel(flavor) {
        return flavor
            .split('-')
            .map(s => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');
    }

    _openMenu() {
        this.setAttribute('open', '');
    }

    _closeMenu() {
        this.removeAttribute('open');
    }

    _setFlavor(flavor) {
        const root = document.documentElement;
        const body = document.body;

        // Remove old flavor classes
        for (const f of this._flavors) {
            root.classList.remove(`flavor-${f}`);
            body.classList.remove(`flavor-${f}`);
        }

        // Add new flavor class
        root.classList.add(`flavor-${flavor}`);
        body.classList.add(`flavor-${flavor}`);

        // Persist to localStorage
        try {
            localStorage.setItem('tracker-flavor', flavor);
            const themeClass = [...root.classList].find(c => c.startsWith('theme-'));
            const theme = themeClass ? themeClass.replace('theme-', '') : 'light';
            localStorage.setItem('tracker-theme', theme);
        } catch (e) { }

        // Emit event
        this.dispatchEvent(
            new CustomEvent('flavor-changed', {
                detail: { flavor },
                bubbles: true,
                composed: true
            })
        );

        // Close menu and re-render
        this._closeMenu();
        this.render();
    }

    render() {
        const current = this._getCurrentFlavor();
        const currentLabel = this._getFlavorLabel(current);

        // Render only the trigger button in shadow DOM
        this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        labs-button { width: 100%; }
      </style>
      <div class="trigger">
        <labs-button id="trigger" variant="secondary" size="large" style="gap: 10px; justify-content: flex-start; width: 100%;">
          <labs-icon name="colors" slot="icon-left" width="20" height="20"></labs-icon>
          ${currentLabel}
        </labs-button>
      </div>
    `;

        // Create or update the portaled menu at document level
        this._createPortaledMenu();

        // Wire up trigger button
        const triggerBtn = this.shadowRoot.getElementById('trigger');
        if (triggerBtn) {
            triggerBtn.addEventListener('click', () => {
                this._open ? this._closeMenu() : this._openMenu();
            });
        }

        // Show/hide the portaled menu
        if (this._open) {
            if (this._portaledMenu) {
                this._portaledMenu.style.display = 'flex';
                this._positionPortaledMenu();
            }
        } else {
            if (this._portaledMenu) {
                this._portaledMenu.style.display = 'none';
            }
        }
    }

    _createPortaledMenu() {
        // Ensure we have a document-level container
        let menuContainer = document.getElementById('labs-flavor-selector-portal');
        if (!menuContainer) {
            menuContainer = document.createElement('div');
            menuContainer.id = 'labs-flavor-selector-portal';
            menuContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 10000;
      `;
            document.body.appendChild(menuContainer);
        }

        // Remove existing menu if any
        const existingMenu = document.getElementById(this._menuId);
        if (existingMenu) existingMenu.remove();

        // Create the new portaled menu
        const current = this._getCurrentFlavor();
        const menu = document.createElement('div');
        menu.id = this._menuId;
        menu.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      min-width: 160px;
      display: none;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      box-sizing: border-box;
      pointer-events: auto;
    `;

        // Add menu items
        menu.innerHTML = `
      <style>
        .menu-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--color-on-surface, #222);
          font-size: 0.95rem;
          font-family: var(--font-family-base, system-ui, sans-serif);
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          transition: background 0.15s ease;
          box-sizing: border-box;
        }

        .menu-item:hover {
          background: var(--color-surface-hover, #f5f5f5);
        }

        .menu-item.active {
          background: var(--color-primary-container, #e8f0ff);
          color: var(--color-primary, #0066cc);
          font-weight: 600;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          font-size: 1rem;
        }
      </style>
      ${this._flavors
                .map(
                    flavor => `
        <button
          class="menu-item ${flavor === current ? 'active' : ''}"
          data-flavor="${flavor}"
        >
          <span>${this._getFlavorLabel(flavor)}</span>
          ${flavor === current ? '<span class="checkmark">✓</span>' : ''}
        </button>
      `
                )
                .join('')}
    `;

        menuContainer.appendChild(menu);
        this._portaledMenu = menu;

        // Wire up menu item clicks
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const flavor = item.getAttribute('data-flavor');
                if (flavor) {
                    this._setFlavor(flavor);
                }
            });
        });
    }

    _positionPortaledMenu() {
        if (!this._portaledMenu) return;

        const triggerBtn = this.shadowRoot.getElementById('trigger');
        if (!triggerBtn) return;

        const triggerRect = triggerBtn.getBoundingClientRect();
        const menu = this._portaledMenu;

        // Temporarily show to measure
        const prevDisplay = menu.style.display;
        menu.style.display = 'flex';
        const menuRect = menu.getBoundingClientRect();
        menu.style.display = prevDisplay;

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // Check space above and below
        const spaceBelow = viewportH - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        // Position horizontally aligned with trigger left
        let left = triggerRect.left;
        if (left + menuRect.width > viewportW) {
            left = viewportW - menuRect.width - 8;
        }

        // Position vertically: prefer below if space, else above
        let top = (spaceBelow >= menuRect.height || spaceBelow >= spaceAbove)
            ? triggerRect.bottom + 4
            : (triggerRect.top - menuRect.height - 4);

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
    }
}

customElements.define('labs-flavor-selector', LabsFlavorSelector);
