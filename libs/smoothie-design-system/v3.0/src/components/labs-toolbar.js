// labs-toolbar: Full-width toolbar using row-layout (start | center | end)
// Perfect for theme controls, headers, and compact top/bottom bars

class LabsToolbar extends HTMLElement {
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
          display: block;
          width: 100%;
          background: var(--color-surface, #f5f5f5);
          border-bottom: 1px solid var(--color-on-surface-variant, #ddd);
          padding: var(--spacing-md, 1rem) var(--spacing-lg, 2rem);
        }

        .toolbar-content {
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

      <div class="toolbar-content">
        <div class="slot-start">
          <slot name="start"></slot>
        </div>
        <div class="slot-center">
          <slot name="center"></slot>
        </div>
        <div class="slot-end">
          <slot name="end"></slot>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('labs-toolbar')) {
  customElements.define('labs-toolbar', LabsToolbar);
}
