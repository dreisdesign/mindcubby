// labs-details - small wrapper component for a styled <details>
class LabsDetails extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.shadowRoot.innerHTML) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display:block; width:100%; }
          details {
            width:100%;
            border:1.5px solid var(--color-primary-lighter);
            border-radius:var(--radius-card, 8px);
            padding:0;
            box-sizing:border-box;
            background:var(--color-surface-variant);
            transition: border-color 0.2s;
          }
          /* Use spacing tokens for summary row to match labs-list-item */
          summary {
            list-style: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-md, 16px);
            padding: var(--space-md, 1rem) 12px;
            font-weight: 600;
          }
          summary labs-icon {
            transition: transform 0.2s ease;
            color: var(--color-on-surface);
            font-size: 1.25em;
          }
          details[open] summary labs-icon {
            transform: rotate(90deg);
          }
          .content { padding:8px 12px 12px 12px; }
        </style>
        <details>
          <summary>
            <labs-icon name="keyboard_arrow_right"></labs-icon>
            <span class="summary-text"><slot></slot></span>
          </summary>
          <div class="content"><slot name="content"></slot></div>
        </details>
      `;
    }
  }
}

if (!customElements.get('labs-details')) customElements.define('labs-details', LabsDetails);
