import './labs-button.js';
import './labs-icon.js';

class LabsButtonWrapped extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 2rem;
          background: var(--color-surface, #fff);
        }
        .button-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
      </style>
      <div class="button-row">
        <labs-button variant="primary">Primary</labs-button>
        <labs-button variant="secondary">Secondary</labs-button>
        <labs-button variant="destructive">Destructive</labs-button>
        <labs-button variant="icon" aria-label="Settings">
          <labs-icon slot="icon-left" name="settings"></labs-icon>
        </labs-button>
        <labs-button pill size="large" variant="primary">
          <labs-icon slot="icon-left" name="add"></labs-icon>
          Add
        </labs-button>
        <labs-button fullwidth variant="secondary">Fullwidth</labs-button>
      </div>
    `;
    }
}

customElements.define('labs-button-wrapped', LabsButtonWrapped);
