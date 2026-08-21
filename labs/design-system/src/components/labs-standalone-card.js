
import './labs-card.js';

class LabsStandaloneCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
      <labs-card>
        <span slot="header"><slot name="header"></slot></span>
        <span slot="description"><slot name="description"></slot></span>
        <span slot="content"><slot></slot></span>
        <span slot="actions"><slot name="actions"></slot></span>
        <span slot="close"><slot name="close"></slot></span>
      </labs-card>
      <style>
        :host { display: block; max-width: 420px; margin: 0 auto; }
      </style>
    `;
    }
}
if (!customElements.get('labs-standalone-card')) customElements.define('labs-standalone-card', LabsStandaloneCard);
export default LabsStandaloneCard;
