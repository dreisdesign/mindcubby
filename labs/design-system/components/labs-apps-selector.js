/**
 * Labs Apps Selector - Dropdown for direct app navigation
 * 
 * Provides a dropdown menu to quickly navigate between all Labs apps.
 * Uses portal-based positioning for consistent UX.
 * 
 * Attributes:
 * - `open` (boolean): when present, dropdown menu is shown
 */

class LabsAppsSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._open = false;
        this._menuId = `labs-apps-menu-${Math.random().toString(36).slice(2, 8)}`;
        this._portaledMenu = null;
        this._apps = [
            { name: 'Timer', icon: 'schedule', path: './timer/' },
            { name: 'Tracker', icon: 'trending_up', path: './tracker/' },
            { name: 'Today List', icon: 'list_alt', path: './today-list/' },
            { name: 'Note', icon: 'description', path: './note/' },
            { name: 'Pad', icon: 'draw', path: './pad/' },
            { name: 'Design System', icon: 'palette', path: './design-system/' },
        ];
        this.render();
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
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

    _openMenu() {
        this.setAttribute('open', '');
    }

    _closeMenu() {
        this.removeAttribute('open');
    }

    _getBaseUrl() {
        // Detect if we're on localhost or production
        const isLocalHostPage = typeof window !== 'undefined' && (window.location &&
            (window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'));

        if (isLocalHostPage) {
            return 'http://localhost:8000';
        }
        return '';
    }

    render() {
        const baseUrl = this._getBaseUrl();

        // Render only the trigger button in shadow DOM
        this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        labs-button { width: 100%; }
      </style>
      <div class="trigger">
        <labs-button id="trigger" variant="secondary" size="large" style="gap: 10px; justify-content: flex-start; width: 100%;">
          <labs-icon name="apps" slot="icon-left" width="20" height="20"></labs-icon>
          All Apps
        </labs-button>
      </div>
    `;

        // Create or update the portaled menu at document level
        this._createPortaledMenu(baseUrl);

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

    _createPortaledMenu(baseUrl) {
        // Ensure we have a document-level container
        let menuContainer = document.getElementById('labs-apps-selector-portal');
        if (!menuContainer) {
            menuContainer = document.createElement('div');
            menuContainer.id = 'labs-apps-selector-portal';
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
        const menu = document.createElement('div');
        menu.id = this._menuId;
        menu.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      min-width: 180px;
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
          gap: 12px;
          color: var(--color-on-surface, #222);
          font-size: 0.95rem;
          font-family: var(--font-family-base, system-ui, sans-serif);
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          transition: background 0.15s ease;
          box-sizing: border-box;
          text-decoration: none;
          display: flex;
          align-items: center;
        }

        .menu-item:hover {
          background: var(--color-surface-hover, #f5f5f5);
        }

        .menu-item labs-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
      </style>
      ${this._apps
                .map(
                    app => `
        <a href="${baseUrl}${app.path}" class="menu-item" target="_blank">
          <labs-icon name="${app.icon}" width="20" height="20"></labs-icon>
          <span>${app.name}</span>
        </a>
      `
                )
                .join('')}
    `;

        menuContainer.appendChild(menu);
        this._portaledMenu = menu;

        // Wire up link clicks to close menu
        menu.querySelectorAll('.menu-item').forEach(link => {
            link.addEventListener('click', () => {
                this._closeMenu();
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

customElements.define('labs-apps-selector', LabsAppsSelector);
