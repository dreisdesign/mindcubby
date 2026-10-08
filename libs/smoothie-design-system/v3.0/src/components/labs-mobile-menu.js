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
    this._isOpen = false;
    this._breakpoint = '700px';
    this._onDocumentClick = this._onDocumentClick.bind(this);
    this._onToggleClick = this._onToggleClick.bind(this);
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
        this.updateMenuState();
      }
    } else if (name === 'breakpoint' && newValue) {
      this._breakpoint = newValue;
      this.updateStyles();
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

  render() {
    // Check if we've already rendered (avoid re-rendering on attribute changes)
    if (this.querySelector('.mobile-menu-wrapper')) {
      return;
    }

    // Create style element
    const style = document.createElement('style');
    style.innerHTML = this.getStyleContent();
    this.appendChild(style);

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-menu-wrapper';

    // Create toggle button (simple button element, not labs-button)
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.setAttribute('aria-label', 'Navigation menu');
    toggleBtn.setAttribute('aria-expanded', this._isOpen ? 'true' : 'false');
    toggleBtn.setAttribute('aria-controls', 'mobile-menu-dropdown');

    // Add icon (using simple SVG instead of labs-icon)
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '24');
    icon.setAttribute('height', '24');
    icon.setAttribute('fill', 'currentColor');
    icon.innerHTML = '<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>';
    toggleBtn.appendChild(icon);

    wrapper.appendChild(toggleBtn);

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'mobile-menu-dropdown';
    dropdown.id = 'mobile-menu-dropdown';
    dropdown.setAttribute('role', 'navigation');

    // Create slot for menu items
    const slot = document.createElement('slot');
    slot.setAttribute('name', 'menu-item');
    dropdown.appendChild(slot);

    wrapper.appendChild(dropdown);
    this.appendChild(wrapper);
  }

  setupEventListeners() {
    const toggleBtn = this.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', this._onToggleClick);
    }

    // Close menu when clicking outside
    document.addEventListener('click', this._onDocumentClick);
  }

  removeEventListeners() {
    const toggleBtn = this.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.removeEventListener('click', this._onToggleClick);
    }
    document.removeEventListener('click', this._onDocumentClick);
  }

  _onToggleClick(e) {
    e.stopPropagation();
    this.toggle();
  }

  _onDocumentClick(e) {
    // Only close if click is outside this component
    if (!this.contains(e.target)) {
      this.close();
    }
  }

  updateMenuState() {
    const toggleBtn = this.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', this._isOpen ? 'true' : 'false');
    }
  }

  updateStyles() {
    const style = this.querySelector('style');
    if (style) {
      style.innerHTML = this.getStyleContent();
    }
  }

  getStyleContent() {
    return `
      labs-mobile-menu {
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
      @media (max-width: ${this._breakpoint}) {
        .mobile-menu-toggle {
          display: flex;
        }

        labs-mobile-menu[open] .mobile-menu-dropdown {
          display: flex;
        }
      }

      .mobile-menu-toggle {
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: var(--color-text, #000);
        border-radius: var(--mobile-menu-radius);
        transition: background-color 0.2s ease;
      }

      .mobile-menu-toggle:hover {
        background-color: var(--color-surface-hover, rgba(0, 0, 0, 0.05));
      }

      .mobile-menu-toggle:active {
        background-color: var(--color-surface-active, rgba(0, 0, 0, 0.1));
      }

      .mobile-menu-toggle svg {
        width: 24px;
        height: 24px;
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
        border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
      }

      .mobile-menu-dropdown ::slotted([slot="menu-item"]) {
        display: flex;
        align-items: center;
      }
    `;
  }
}

customElements.define('labs-mobile-menu', LabsMobileMenu);
