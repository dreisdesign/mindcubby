/**
 * Labs Dropdown - simple overflow menu (icon button + portaled menu)
 *
 * Uses a "portal" pattern where the menu is rendered at document level to avoid
 * clipping issues with ancestor overflow. The menu is automatically positioned
 * relative to the trigger button and cleaned up when the component unmounts.
 *
 * Attributes:
 * - `open` (boolean): when present, menu is shown.
 * - `archived` (boolean): reflect archived state to change Archive -> Restore.
 * - `restored` (boolean): mark the item as a restored copy.
 * - `only` (string|csv): comma-separated list of menu items to show. Supported values: `archive`, `delete`.
 *
 * Events (dispatched on user action):
 * - `archive` (CustomEvent): request to archive the host item.
 * - `restore` (CustomEvent): request to restore the host item.
 * - `remove` (CustomEvent): request to remove/delete the host item.
 * - `open` (CustomEvent): fired when menu opens.
 * - `close` (CustomEvent): fired when menu closes.
 *
 * Technical Notes:
 * - Menu is rendered in a document-level portal container (#labs-dropdown-portal)
 * - Automatically handles positioning, viewport edge detection, and cleanup
 * - No z-index conflicts or ancestor overflow clipping issues
 * - Supports keyboard navigation (Arrow keys, Escape, Tab)
 * - Outside click detection works across shadow DOM boundaries
 */
class LabsDropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._open = false;
        this._menuId = `labs-dropdown-menu-${Math.random().toString(36).slice(2, 8)}`;
        this.render();
    }

    static get observedAttributes() { return ['archived', 'restored', 'open', 'only']; }

    attributeChangedCallback(name) {
        if (name === 'open') this._open = this.hasAttribute('open');
        // 'only' and other attribute changes simply cause a re-render
        this.render();
    }

    get open() { return this._open; }
    set open(val) {
        const isOpen = Boolean(val);
        if (isOpen) this.setAttribute('open', '');
        else this.removeAttribute('open');
    }

    connectedCallback() {
        document.addEventListener('click', this._outsideClick = (e) => {
            if (!this._open) return;
            const path = e.composedPath ? e.composedPath() : (e.path || []);
            if (!path.includes(this) && !path.includes(this.shadowRoot) &&
                (!this._portaledMenu || !path.includes(this._portaledMenu))) {
                this._close();
            }
        });
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._outsideClick);
        this._cleanupPortaledMenu();
    }

    render() {
        // Only render the trigger in shadow DOM; menu will be portaled to document level
        this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; position: relative; }
        .trigger { display:inline-flex; }
        labs-button[variant="icon"] { --icon-size:20px; }
      </style>
      <div class="trigger">
        <labs-button id="toggleBtn" variant="icon" aria-label="More" aria-haspopup="true" aria-expanded="${this._open ? 'true' : 'false'}" aria-controls="${this._menuId}">
          <labs-icon slot="icon-left" name="more_vert" width="20" height="20" color="currentColor"></labs-icon>
        </labs-button>
      </div>
    `;

        // Create or update the portaled menu in document body
        this._createPortaledMenu();

        const toggle = this.shadowRoot.getElementById('toggleBtn');
        if (toggle) {
            toggle.addEventListener('click', (e) => { e.stopPropagation(); this._toggle(); });
            toggle.addEventListener('keydown', (e) => this._onToggleKeyDown(e));
        }

        // Handle open/close state for portaled menu
        if (this._open) {
            if (this._portaledMenu) {
                this._portaledMenu.style.display = 'block';
                this._portaledMenu.setAttribute('aria-hidden', 'false');
                this._positionPortaledMenu();
            }
            this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
        } else {
            if (this._portaledMenu) {
                this._portaledMenu.style.display = 'none';
                this._portaledMenu.setAttribute('aria-hidden', 'true');
            }
            this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
        }

        // update aria-expanded on the toggle for assistive tech
        const toggleEl = this.shadowRoot.getElementById('toggleBtn');
        if (toggleEl) toggleEl.setAttribute('aria-expanded', String(this._open));
    }

    // return focusable menu item hosts (labs-button) in order
    _getMenuItems() {
        const menu = this._portaledMenu || document.getElementById(this._menuId);
        if (!menu) return [];
        return Array.from(menu.querySelectorAll('labs-button'));
    }

    _focusItemAt(index) {
        const items = this._getMenuItems();
        if (!items.length) return;
        const idx = (index + items.length) % items.length;
        const el = items[idx];
        if (!el) return;
        // make sure host is focusable
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        try { el.focus(); } catch (e) { /* best-effort */ }
        this._currentIndex = idx;
    }

    _focusFirstItem() { this._focusItemAt(0); }
    _focusLastItem() { const items = this._getMenuItems(); this._focusItemAt(items.length - 1); }

    _onToggleKeyDown(e) {
        const key = e.key;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
            e.preventDefault(); e.stopPropagation();
            this.open = true;
            this._focusFirstItem();
        } else if (key === 'ArrowDown') {
            e.preventDefault(); e.stopPropagation();
            this.open = true; this._focusFirstItem();
        } else if (key === 'ArrowUp') {
            e.preventDefault(); e.stopPropagation();
            this.open = true; this._focusLastItem();
        }
    }

    _onMenuKeyDown(e) {
        const key = e.key;
        const items = this._getMenuItems();
        if (!items.length) return;
        if (key === 'ArrowDown') {
            e.preventDefault(); e.stopPropagation();
            this._focusItemAt((this._currentIndex || 0) + 1);
        } else if (key === 'ArrowUp') {
            e.preventDefault(); e.stopPropagation();
            this._focusItemAt((this._currentIndex || 0) - 1);
        } else if (key === 'Home') {
            e.preventDefault(); e.stopPropagation();
            this._focusFirstItem();
        } else if (key === 'End') {
            e.preventDefault(); e.stopPropagation();
            this._focusLastItem();
        } else if (key === 'Escape') {
            e.preventDefault(); e.stopPropagation();
            this._close();
            const toggle = this.shadowRoot.getElementById('toggleBtn');
            if (toggle) toggle.focus();
        } else if (key === 'Tab') {
            // allow tab to proceed but close the menu
            this._close();
        }
    }

    _toggle() { this.open = !this._open; }
    _close() { this.open = false; }

    // Create or update the portaled menu in document body
    _createPortaledMenu() {
        // Ensure we have a document-level container for dropdown menus
        let menuContainer = document.getElementById('labs-dropdown-portal');
        if (!menuContainer) {
            menuContainer = document.createElement('div');
            menuContainer.id = 'labs-dropdown-portal';
            menuContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 10000;
            `;
            document.body.appendChild(menuContainer);
        }

        // Remove existing menu for this dropdown if any
        const existingMenu = document.getElementById(this._menuId);
        if (existingMenu) existingMenu.remove();

        // Create the new menu element in the portal
        const menu = document.createElement('div');
        menu.id = this._menuId;
        menu.className = 'labs-dropdown-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-hidden', 'true');
        menu.style.cssText = `
            position: absolute;
            background: var(--color-surface, #fff);
            border-radius: var(--radius-card, 8px);
            box-shadow: var(--labs-card-shadow, 0 6px 26px rgba(0,0,0,0.12));
            padding: 8px;
            min-width: fit-content;
            display: none;
            box-sizing: border-box;
            pointer-events: auto;
        `;

        // Add menu content: strictly show items present in 'only' (or both if 'only' is empty)
        const onlyRaw = this.getAttribute('only') || '';
        const only = onlyRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        const showArchive = only.length === 0 || only.includes('archive');
        const showRestore = only.includes('restore') || this.hasAttribute('archived');
        const showDelete = only.length === 0 || only.includes('delete');
        menu.innerHTML = `
            <style>
                .labs-dropdown-menu labs-button {
                    width: 100%;
                    display: block;
                    text-align: left;
                    gap: 10px;
                    margin: 0;
                    box-sizing: border-box;
                }
                .labs-dropdown-menu labs-button button {
                    display: flex !important;
                    width: 100% !important;
                    align-items: center;
                    justify-content: flex-start;
                    text-align: left;
                }
                .labs-dropdown-menu labs-button + labs-button { margin-top: 6px; }
                .labs-dropdown-menu labs-button[variant="destructive"] labs-icon { color: var(--color-on-error, #fff); }
            </style>
            ${showRestore ? `<labs-button id="restoreBtn" variant="secondary" size="small" fullwidth role="menuitem" tabindex="-1">
                <labs-icon slot="icon-left" name="history" width="20" height="20"></labs-icon>
                Restore
            </labs-button>` : ''}
            ${!showRestore && showArchive ? `<labs-button id="archiveBtn" variant="secondary" size="small" fullwidth role="menuitem" tabindex="-1">
                <labs-icon slot="icon-left" name="archive" width="20" height="20"></labs-icon>
                Archive
            </labs-button>` : ''}
            ${showDelete ? `<labs-button id="deleteBtn" variant="destructive" size="small" fullwidth role="menuitem" tabindex="-1">
                <labs-icon slot="icon-left" name="delete_forever" width="20" height="20"></labs-icon>
                Delete
            </labs-button>` : ''}
        `;

        menuContainer.appendChild(menu);
        this._portaledMenu = menu;

        // Wire up menu button events
        this._wireMenuEvents(menu);
    }

    _wireMenuEvents(menu) {
        const archiveBtn = menu.querySelector('#archiveBtn');
        if (archiveBtn) archiveBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.dispatchEvent(new CustomEvent('archive', { bubbles: true, composed: true }));
            this._close();
        });

        const restoreBtn = menu.querySelector('#restoreBtn');
        if (restoreBtn) restoreBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.dispatchEvent(new CustomEvent('restore', { bubbles: true, composed: true }));
            this._close();
        });

        const deleteBtn = menu.querySelector('#deleteBtn');
        if (deleteBtn) deleteBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.dispatchEvent(new CustomEvent('remove', { bubbles: true, composed: true }));
            this._close();
        });

        // Add keyboard navigation
        menu.addEventListener('keydown', (e) => this._onMenuKeyDown(e));
    }

    // Position the portaled menu relative to the toggle
    _positionPortaledMenu() {
        if (!this._portaledMenu) return;

        const toggleEl = this.shadowRoot.getElementById('toggleBtn');
        if (!toggleEl) return;

        const toggleRect = toggleEl.getBoundingClientRect();
        const menu = this._portaledMenu;

        // Temporarily show menu to measure it
        const prevDisplay = menu.style.display;
        menu.style.display = 'block';
        const menuRect = menu.getBoundingClientRect();
        menu.style.display = prevDisplay;

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // Prefer placing below the toggle
        const spaceBelow = viewportH - toggleRect.bottom;
        const spaceAbove = toggleRect.top;

        // Horizontal positioning: align menu right edge to toggle right by default
        const left = Math.min(Math.max(0, toggleRect.right - menuRect.width), viewportW - menuRect.width);

        // Vertical positioning
        const top = (spaceBelow >= menuRect.height || spaceBelow >= spaceAbove)
            ? toggleRect.bottom
            : (toggleRect.top - menuRect.height);

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        // Listen for viewport changes to reposition
        if (!this._repositionHandler) {
            this._repositionHandler = () => {
                try { this._positionPortaledMenu(); } catch (e) { }
            };
            window.addEventListener('resize', this._repositionHandler, { passive: true });
            window.addEventListener('scroll', this._repositionHandler, { passive: true });
        }
    }

    _cleanupPortaledMenu() {
        if (this._portaledMenu) {
            this._portaledMenu.remove();
            this._portaledMenu = null;
        }
        if (this._repositionHandler) {
            window.removeEventListener('resize', this._repositionHandler);
            window.removeEventListener('scroll', this._repositionHandler);
            this._repositionHandler = null;
        }
    }
}

if (!customElements.get('labs-dropdown')) customElements.define('labs-dropdown', LabsDropdown);
