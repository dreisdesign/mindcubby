class LabsTemplateHeaderWrapped extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          padding-top: var(--space-lg, 1.5rem);
          padding-bottom: var(--space-md, 1rem);
        }
        
        .header-title {
          font-size: var(--font-size-h1, 3rem);
          font-weight: var(--font-weight-heading, 800);
          margin: 0;
          line-height: 1.2;
          text-align: center;
          color: var(--color-on-surface, #1b1c1f);
        }
      </style>
      <header>
        <h1 class="header-title"><slot name="title">Footer Test Page</slot></h1>
      </header>
    `;
    }
}
customElements.define('labs-template-header-wrapped', LabsTemplateHeaderWrapped);
