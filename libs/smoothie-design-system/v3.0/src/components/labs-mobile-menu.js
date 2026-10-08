/**
 * Mobile Menu Component
 * 
 * A responsive navigation menu that displays as a dropdown on small screens.
 * Uses slot-based composition for flexible menu content.
 * 
 * Usage:
 *   <labs-mobile-menu breakpoint="700px">
 *     <labs-theme-button icon-only slot="menu-item"></labs-theme-button>
 *     <labs-theme-toggle icon-only slot="menu-item"></labs-theme-toggle>
 *   </labs-mobile-menu>
 * 
 * Slots:
 *   - menu-item: Content to display in the dropdown menu
 * 
 * CSS Variables:
 *   --mobile-menu-breakpoint: Viewport width where menu switches to mobile layout (default: 700px)
 *   --mobile-menu-gap: Spacing between menu items (default: 0.5rem)
 *   --mobile-menu-padding: Padding inside the menu dropdown (default: 0.5rem)
 *   --mobile-menu-radius: Border radius of the dropdown (default: 8px)
 *   --mobile-menu-shadow: Box shadow of the dropdown (default: 0 4px 12px rgba(0, 0, 0, 0.15))
 *   --mobile-menu-surface: Background color (uses --color-surface by default)
 * 
 * Attributes:
 *   - breakpoint: CSS media query breakpoint (default: "700px")
 *   - open: Boolean attribute, set when menu is open
 */

class LabsMobileMenu extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'breakpoint'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._breakpoint = '700px';
    this._onDocumentClick = this._onDocumentClick.bind(this);
  }

  connectedCallback() {
    this._breakpoint = this.getAttribute('breakpoint') || '700px';
    this._isOpen = this.hasAttribute('open');
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      const newOpen = this.hasAttribute('open');
      if (newOpen !== this._isOpen) {
        this._isOpen = newOpen;
        this.render();
        this.updateMenuState();
      }
    } else if (name === 'breakpoint' && newValue) {
      this._breakpoint = newValue;
      this.render();
    }
  }

  /**
   * Open the menu
   */
  open() {
    this.setAttribute('open', '');
  }

  /**
   * Close the menu
   */
  close() {
    this.removeAttribute('open');
  }

  /**
   * Toggle menu open/closed state
   */
  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  setupEventListeners() {
    const toggleBtn = this.shadowRoot?.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', this._onDocumentClick);
  }

  removeEventListeners() {
    document.removeEventListener('click', this._onDocumentClick);
  }

  _onDocumentClick(e) {
    // Only close if click is outside this component
    if (!this.contains(e.target)) {
      this.close();
    }
  }

  updateMenuState() {
    const toggleBtn = this.shadowRoot?.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', this._isOpen ? 'true' : 'false');
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --mobile-menu-breakpoint: ${this._breakpoint};
          --mobile-menu-gap: 0.5rem;
          --mobile-menu-padding: 0.5rem;
          --mobile-menu-radius: 8px;
          --mobile-menu-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          --mobile-menu-surface: var(--color-surface, #FBFBFD);
        }

        .mobile-menu-wrapper {
          position: relative;
        }

        /* Hide mobile menu by default (desktop) */
        .mobile-menu-toggle {
          display: none;
        }

        .mobile-menu-dropdown {
          display: none;
        }

        /* Show mobile menu on small screens */
        @media (max-width: var(--mobile-menu-breakpoint)) {
          .mobile-menu-toggle {
            display: flex;
          }

          :host([open]) .mobile-menu-dropdown {
            display: flex;
          }
        }

        .mobile-menu-toggle {
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mobile-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--mobile-menu-surface);
          border-radius: var(--mobile-menu-radius);
          box-shadow: var(--mobile-menu-shadow);
          padding: var(--mobile-menu-padding);
          gap: var(--mobile-menu-gap);
          flex-direction: column;
          margin-top: 0.5rem;
          z-index: 1000;
        }

        ::slotted([slot="menu-item"]) {
          display: block;
        }
      </style>

      <div class="mobile-menu-wrapper">
        <!-- Toggle button (visible on mobile) -->
        <labs-button 
          class="mobile-menu-toggle"
          variant="transparent"
          aria-label="Navigation menu"
          aria-expanded="${this._isOpen ? 'true' : 'false'}"
          aria-controls="mobile-menu-dropdown">
          <labs-icon name="more_vert" size="small"></labs-icon>
        </labs-button>

        <!-- Dropdown menu (shown when open, only on mobile) -->
        <div class="mobile-menu-dropdown" id="mobile-menu-dropdown" role="navigation">
          <slot name="menu-item"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('labs-mobile-menu', LabsMobileMenu);
