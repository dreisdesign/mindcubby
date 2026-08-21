
import './labs-card.js';

class LabsWarningCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
      <labs-card variant="warning">
        <span slot="icon">
          <slot name="icon">
            <labs-icon name="warning" style="color:var(--color-warning-icon,#ffb300);font-size:2.5rem;"></labs-icon>
          </slot>
        </span>
        <span slot="header"><slot name="header">Warning</slot></span>
        <span slot="description"><slot name="message"><slot></slot></slot></span>
        <span slot="actions"><slot name="actions"></slot></span>
        <span slot="close"><slot name="close"></slot></span>
      </labs-card>
      <style>
        :host { display: block; max-width: 420px; margin: 0 auto; }
      </style>
    `;
    }
}
if (!customElements.get('labs-warning-card')) customElements.define('labs-warning-card', LabsWarningCard);
export default LabsWarningCard;
