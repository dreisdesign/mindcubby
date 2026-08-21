// Modular section wrapper for groups of labs-list-item
class LabsListSection extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    static get observedAttributes() {
        return ['gap'];
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const gap = this.getAttribute('gap') || 'var(--list-gap, var(--space-sm, 12px))';
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          gap: ${gap};
          width: 100%;
        }
      </style>
      <slot></slot>
    `;
    }
}

if (!customElements.get('labs-list-section')) customElements.define('labs-list-section', LabsListSection);

export default LabsListSection;
