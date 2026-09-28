// labs-row-layout: 3-column flexible layout (start | center | end)
// Perfect for headers, toolbars, and horizontal component arrangements

class LabsRowLayout extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          width: 100%;
          gap: var(--spacing-md, 1rem);
          align-items: center;
        }

        .slot-start {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
        }

        .slot-center {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm, 0.5rem);
        }

        .slot-end {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
        }
      </style>

      <div class="slot-start">
        <slot name="start"></slot>
      </div>
      <div class="slot-center">
        <slot name="center"></slot>
      </div>
      <div class="slot-end">
        <slot name="end"></slot>
      </div>
    `;
  }
}

if (!customElements.get('labs-row-layout')) {
  customElements.define('labs-row-layout', LabsRowLayout);
}
