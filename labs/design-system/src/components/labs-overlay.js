/**
 * Labs Overlay Component
 * A modal overlay component with blur background and customizable content.
 * Based on Tracker app patterns but built from scratch for modularity.
 */

class LabsOverlay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._render();
    this._setupEventListeners();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }

        :host([open]) {
          display: flex;
        }

        .overlay-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          cursor: pointer;
        }

        .overlay-content {
          position: relative;
          background: var(--color-surface, #ffffff);
          color: var(--color-on-surface, #1b1c1f);
          font-family: var(--font-family-base, system-ui, sans-serif);
          font-size: var(--font-size-overlay, 1rem);
          line-height: var(--line-height-overlay, 1.5);
          border-radius: var(--radius-xl, 16px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          max-width: 90vw;
          min-width: 320px;
          width: auto;
          box-sizing: border-box;
          max-height: 90vh;
          overflow: auto;
          transform: scale(0.95);
          opacity: 0;
          transition: all 0.2s ease;
          z-index: 1;
        }

        /* Transparent mode - no background/styling when wrapping styled components */
        :host([transparent]) .overlay-content {
          background: transparent;
          box-shadow: none;
          border-radius: var(--radius-none, 0);
          max-height: 95vh;
        }

        :host([open]) .overlay-content {
          transform: scale(1);
          opacity: 1;
        }

        /* Variants */
        :host([size="small"]) .overlay-content {
          max-width: 400px;
        }

        :host([size="medium"]) .overlay-content {
          max-width: 600px;
        }

        :host([size="large"]) .overlay-content {
          max-width: 800px;
        }

        :host([size="full"]) .overlay-content {
          max-width: 95vw;
          max-height: 95vh;
        }

        /* Disable backdrop blur if not supported */
        @supports not (backdrop-filter: blur(8px)) {
          .overlay-backdrop {
            background: rgba(0, 0, 0, 0.6);
          }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          :host {
            padding: 16px;
          }

          .overlay-content {
            border-radius: var(--radius-lg, 8px);
            max-width: 100%;
          }

          :host([size="full"]) .overlay-content {
            max-width: 100%;
            max-height: 100%;
            border-radius: var(--radius-none, 0);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .overlay-content {
            transition: none;
          }
        }

        /* Animation classes for JavaScript control */
        .overlay-content.entering {
          animation: overlayEnter 0.2s ease forwards;
        }

        .overlay-content.leaving {
          animation: overlayLeave 0.2s ease forwards;
        }

        @keyframes overlayEnter {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes overlayLeave {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.95);
            opacity: 0;
          }
        }
      </style>

      <div class="overlay-backdrop" part="backdrop"></div>
      <div class="overlay-content" part="content">
        <slot></slot>
      </div>
    `;
  }

  _setupEventListeners() {
    // Close on backdrop click
    const backdrop = this.shadowRoot.querySelector('.overlay-backdrop');
    backdrop.addEventListener('click', () => {
      if (this.getAttribute('close-on-backdrop') !== 'false') {
        this.close();
      }
    });

    // Close on Escape key
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.getAttribute('close-on-escape') !== 'false') {
        this.close();
      }
    });

    // Trap focus within overlay when open
    this.addEventListener('keydown', this._handleFocusTrap.bind(this));
  }

  _handleFocusTrap(e) {
    if (!this._isOpen || e.key !== 'Tab') return;

    const focusableElements = this.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }

  // Public API methods
  open() {
    if (this._isOpen) return;

    this._isOpen = true;
    this.setAttribute('open', '');

    // Focus the first focusable element
    requestAnimationFrame(() => {
      const firstFocusable = this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    });

    // Dispatch open event
    this.dispatchEvent(new CustomEvent('overlay-open', {
      bubbles: true,
      composed: true,
    }));
  }

  close() {
    if (!this._isOpen) return;

    this._isOpen = false;
    this.removeAttribute('open');

    // Dispatch close event
    this.dispatchEvent(new CustomEvent('overlay-close', {
      bubbles: true,
      composed: true,
    }));
  }

  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Observed attributes
  static get observedAttributes() {
    return ['open', 'size', 'close-on-backdrop', 'close-on-escape'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      this._isOpen = newValue !== null;
    }
  }

  // Getters
  get isOpen() {
    return this._isOpen;
  }
}

// Register the custom element
if (!customElements.get('labs-overlay')) {
  customElements.define('labs-overlay', LabsOverlay);
}

export default LabsOverlay;
