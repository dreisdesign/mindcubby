/**
 * Labs Mobile Menu - Simple responsive header menu toggle
 *
 * Displays a 3-dot menu toggle button on small screens that reveals menu items
 * in a dropdown. On larger screens, menu items are shown directly inline.
 *
 * Attributes:
 * - `breakpoint` (string): CSS media query breakpoint, e.g. "700px". Default: "768px"
 *
 * Slots:
 * - `menu-item`: Use this slot for items that should appear in the mobile menu.
 *   Example: <labs-theme-button slot="menu-item"></labs-theme-button>
 *
 * Usage:
 * ```html
 * <labs-mobile-menu breakpoint="700px">
 *   <labs-theme-button icon-only slot="menu-item"></labs-theme-button>
 *   <labs-theme-toggle icon-only slot="menu-item"></labs-theme-toggle>
 * </labs-mobile-menu>
 * ```
 */

class LabsMobileMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._breakpoint = this.getAttribute('breakpoint') || '768px';
    this.render();
  }

  connectedCallback() {
    this._setupEventListeners();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  _setupEventListeners() {
    const toggle = this.shadowRoot.querySelector('.menu-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => this._handleToggle(e));
      toggle.addEventListener('keydown', (e) => this._handleKeyDown(e));
    }

    document.addEventListener('click', this._handleOutsideClick = (e) => {
      if (this._isOpen && !this.contains(e.target) && !e.composedPath().includes(this)) {
        this._close();
      }
    });
  }

  _removeEventListeners() {
    document.removeEventListener('click', this._handleOutsideClick);
  }

  _handleToggle(e) {
    e.stopPropagation();
    this._isOpen ? this._close() : this._open();
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      this._close();
    }
  }

  _open() {
    this._isOpen = true;
    const menu = this.shadowRoot.querySelector('.menu-dropdown');
    if (menu) {
      menu.classList.add('open');
      const toggle = this.shadowRoot.querySelector('.menu-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
  }

  _close() {
    this._isOpen = false;
    const menu = this.shadowRoot.querySelector('.menu-dropdown');
    if (menu) {
      menu.classList.remove('open');
      const toggle = this.shadowRoot.querySelector('.menu-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  }

  render() {
    const menuId = `mobile-menu-${Math.random().toString(36).slice(2, 9)}`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --breakpoint: ${this._breakpoint};
          display: contents;
        }

        .menu-container {
          position: relative;
          flex-shrink: 0;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          min-width: 40px;
          min-height: 40px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
        }

        .menu-dropdown {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--color-surface);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 0.5rem;
          gap: 0.5rem;
          flex-direction: column;
          margin-top: 0.5rem;
          z-index: 1000;
        }

        .menu-dropdown.open {
          display: flex;
        }

        @media (max-width: ${this._breakpoint}) {
          .menu-toggle {
            display: flex;
          }

          .menu-dropdown {
            display: none;
          }

          .menu-dropdown.open {
            display: flex;
          }

          ::slotted([slot="menu-item"]) {
            display: none;
          }
        }

        @media (min-width: calc(${this._breakpoint} + 1px)) {
          .menu-toggle {
            display: none;
          }

          .menu-dropdown {
            position: static;
            background: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
            gap: 1rem;
            flex-direction: row;
            display: flex;
            align-items: center;
          }

          ::slotted([slot="menu-item"]) {
            display: inline-flex;
          }
        }
      </style>

      <div class="menu-container">
        <labs-button 
          class="menu-toggle"
          variant="transparent"
          aria-label="Navigation menu"
          aria-expanded="false"
          aria-controls="${menuId}">
          <labs-icon name="more_vert" size="small"></labs-icon>
        </labs-button>

        <div class="menu-dropdown" id="${menuId}" role="navigation">
          <slot name="menu-item"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('labs-mobile-menu', LabsMobileMenu);
