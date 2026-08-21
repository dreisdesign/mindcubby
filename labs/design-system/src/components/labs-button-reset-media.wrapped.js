import './labs-button.js';
import './labs-icon.js';

class LabsButtonResetMediaWrapped extends HTMLElement {
    static get observedAttributes() {
        return ['fullwidth', 'size', 'variant'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const fullwidth = this.hasAttribute('fullwidth');
        const size = this.getAttribute('size') || 'large';
        const variant = this.getAttribute('variant') || 'secondary';
        this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        labs-button {
          width: ${fullwidth ? '100%' : 'auto'};
        }
      </style>
      <labs-button
        variant="${variant}"
        size="${size}"
        pill
        ${fullwidth ? 'fullwidth' : ''}
      >
        <labs-icon slot="icon-left" name="replay"></labs-icon>
        Reset
      </labs-button>
    `;
    }
}

if (!customElements.get('labs-button-reset-media-wrapped')) {
    customElements.define('labs-button-reset-media-wrapped', LabsButtonResetMediaWrapped);
}

export default LabsButtonResetMediaWrapped;