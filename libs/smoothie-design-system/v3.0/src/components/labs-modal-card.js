// Labs Modal Card - flexible modal content wrapper with slots
// Allows custom content injection while maintaining consistent styling
class LabsModalCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 340px;
          margin: 0 auto;
          background: var(--color-surface, #fff);
          border-radius: var(--radius-xl, 16px);
          box-shadow: 0 4px 32px rgba(0,0,0,0.10), 0 1.5px 4px rgba(0,0,0,0.04);
          padding: 28px 24px 20px 24px;
          font-family: var(--font-family-base, system-ui, sans-serif);
          position: relative;
        }

        /* Default slot for main content */
        ::slotted(*) {
          all: initial;
        }

        ::slotted(labs-settings-card) {
          all: revert;
        }
      </style>

      <slot></slot>
    `;
  }
}

customElements.define('labs-modal-card', LabsModalCard);
