class LabsHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    static get observedAttributes() {
        return ['title', 'date', 'subtitle', 'center', 'show-subtitle'];
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const title = this.getAttribute('title') || '';
        const date = this.getAttribute('date') || '';
        const subtitle = this.getAttribute('subtitle') || '';
        const center = this.hasAttribute('center');
        const showSubtitle = this.hasAttribute('show-subtitle');
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: var(--space-md, 24px);
        }
        header {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs, 8px);
          align-items: ${center ? 'center' : 'flex-start'};
          text-align: ${center ? 'center' : 'left'};
        }
        h1 {
          font-size: var(--font-size-h1, 2rem);
          font-weight: var(--font-weight-heading, 700);
          color: var(--color-on-surface, #222);
          margin: 0;
        }
        .subtitle {
          font-size: var(--font-size-h3, 1.125rem);
          font-weight: var(--font-weight-subheading, 500);
          color: var(--color-on-surface-variant, #555);
          margin: 0;
        }
        .date {
          font-size: var(--font-size-body, 1rem);
          color: var(--color-on-surface-variant, #555);
          font-weight: var(--font-weight-body, 400);
        }
        @media (min-width: 640px) {
          header {
            gap: var(--space-sm, 12px);
          }
        }
      </style>
      <header>
        <h1><slot name="title">${title}</slot></h1>
        ${(showSubtitle && subtitle) ? `<div class="subtitle"><slot name="subtitle">${subtitle}</slot></div>` : ''}
        ${date ? `<div class="date"><slot name="date">${date}</slot></div>` : ''}
      </header>
    `;
    }
}

customElements.define('labs-header', LabsHeader);