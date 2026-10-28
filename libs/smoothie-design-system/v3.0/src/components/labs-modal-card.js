// Labs Modal Card - flexible modal content wrapper with named slots
// Allows custom content injection (header, content, footer) while maintaining consistent styling
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

        .modal-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Header slot */
        ::slotted([slot="header"]) {
          margin: 0 0 1rem 0;
          padding: 0 0 1rem 0;
          border-bottom: 1px solid var(--color-on-surface-variant, #ddd);
        }

        /* Content slot (default) - main content area */
        ::slotted([slot="content"]),
        ::slotted(labs-settings-card) {
          flex: 1;
        }

        /* Footer slot */
        ::slotted([slot="footer"]) {
          margin: 1rem 0 0 0;
          padding: 1rem 0 0 0;
          border-top: 1px solid var(--color-on-surface-variant, #ddd);
          font-size: 0.875rem;
        }
      </style>

      <div class="modal-container">
        <slot name="header"></slot>
        <slot name="content">
          <!-- Default slot for main content (e.g., labs-settings-card) -->
          <slot></slot>
        </slot>
        <slot name="footer"></slot>
      </div>
    `;
  }
}

customElements.define('labs-modal-card', LabsModalCard);
