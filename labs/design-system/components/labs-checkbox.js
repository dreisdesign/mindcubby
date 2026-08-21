// Simple Labs Checkbox component (icon-only) - reusable canonical checkbox
class LabsCheckbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._checked = this.hasAttribute('checked');
    this.render();
  }

  static get observedAttributes() { return ['checked', 'inactive']; }

  attributeChangedCallback(name, oldV, newV) {
    if (name === 'checked') this._checked = this.hasAttribute('checked');
    if (name === 'inactive') this._inactive = this.hasAttribute('inactive');
    this._updateAria();
    this.render();
  }

  connectedCallback() {
    // delegate events
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeyDown);
    // default role/tabindex
    this.setAttribute('role', this.getAttribute('role') || 'checkbox');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this._updateAria();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeyDown);
  }

  _onClick = (e) => {
    e.stopPropagation();
    if (this._inactive) return;
    this.toggle();
  }

  _onKeyDown = (e) => {
    if (this._inactive) return;
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  }

  toggle() {
    if (this._inactive) return;
    this._checked = !this._checked;
    if (this._checked) this.setAttribute('checked', ''); else this.removeAttribute('checked');
    this._updateAria();

    // Trigger check animation when checking
    if (this._checked) {
      this.classList.add('checking');
      setTimeout(() => {
        this.classList.remove('checking');
      }, 400);
    }

    this.dispatchEvent(new CustomEvent('change', { detail: { checked: this._checked }, bubbles: true, composed: true }));
    this.render();
  }

  _updateAria() {
    if (!this.shadowRoot) return;
    this.setAttribute('aria-checked', String(this._checked));
    if (this._inactive) {
      this.setAttribute('aria-disabled', 'true');
      this.setAttribute('tabindex', '-1');
    } else {
      this.removeAttribute('aria-disabled');
      if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    }
  }

  render() {
    const icon = this._checked ? 'check_box' : 'check_box_outline_blank';
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-flex; align-items:center; }
        :host([inactive]) { opacity: 0.6; }
        :host([inactive]) { pointer-events: none; }
        ::slotted(*) { pointer-events: none; }
        
        /* Check animation */
        labs-icon {
          transition: transform 0.15s ease-out;
        }
        
        :host(.checking) labs-icon {
          animation: checkboxCheck 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }
        
        @keyframes checkboxCheck {
          0% {
            transform: scale(0.5) rotate(-15deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      </style>
      <labs-button variant="icon" aria-hidden="true" tabindex="-1">
        <labs-icon slot="icon-left" name="${icon}" width="20" height="20"></labs-icon>
      </labs-button>
      <slot style="display:none"></slot>
    `;
  }
}

if (!customElements.get('labs-checkbox')) customElements.define('labs-checkbox', LabsCheckbox);
