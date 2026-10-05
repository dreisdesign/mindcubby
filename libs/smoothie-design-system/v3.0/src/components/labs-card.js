
/**
 * Canonical slot-driven Labs Card
 *
 * @slot image - Card cover image (aspect-ratio 1:1, centered crop)
 * @slot header - Card title/header
 * @slot close - Close icon/button
 * @slot description - Card description text
 * @slot input - Input field or custom input
 * @slot actions - Action buttons (footer)
 *
 * @cssprop --labs-card-max-width - Maximum width of the card (default: 520px)
 * @cssprop --labs-card-min-width - Minimum width of the card (default: 280px)
 * @cssprop --labs-card-padding - Card padding (default: 20px 18px)
 * @cssprop --labs-card-max-height - Maximum height of card (default: 80vh, prevents cards from exceeding viewport height on mobile)
 * @cssprop --labs-card-header-clamp - Number of lines to clamp header to (default: 999 = no clamp, set to 2-3 to enable)
 * @cssprop --radius-card - Card border radius (default: 0.5rem/8px)
 * @cssprop --labs-card-shadow - Card box-shadow (default: 0 6px 40px ...)
 * @cssprop --color-surface - Card background color
 * @cssprop --color-on-background - Header text color
 * @cssprop --color-on-surface-variant - Description text color
 * @cssprop --font-family-base - Font family
 * @cssprop --font-size-h3 - Header font size (from tokens)
 * @cssprop --font-size-base - Description/input font size (from tokens)
 * @cssprop --font-weight-card-header - Header font weight
 * @cssprop --line-height-card-header - Header line height
 */
class LabsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --labs-card-padding: 2rem;
          --labs-card-header-clamp: 999;
          --labs-card-max-height: none;
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: auto minmax(0, 1fr) auto;
          width: 100%;
          height: 100%;
          max-height: var(--labs-card-max-height);
          box-sizing: border-box;
          margin: 0 auto;
          background: var(--color-surface, #fff);
          border-radius: var(--radius-card, 0.5rem);
          box-shadow: var(--labs-card-shadow, 0 6px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04));
          padding: 0;
          font-family: var(--font-family-base, system-ui, sans-serif);
          position: relative;
          overflow: hidden;
        }
        .card-image {
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface-container, #f5f5f5);
          grid-row: 1;
          grid-column: 1;
          flex-shrink: 0;
        }
        .card-image ::slotted(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .card-content {
          padding: var(--labs-card-padding);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          grid-row: 2;
          grid-column: 1;
          height: 100%;
          min-height: min-content;
          background: var(--color-surface, #fff);
        }
        /* Compact layout: image left, content right - ONLY on mobile */
        @media (max-width: 750px), (max-height: 650px) {
          :host([compact]) {
            flex-direction: row;
          }
          :host([compact]) .card-image {
            width: 120px;
            min-width: 120px;
            aspect-ratio: 1;
            flex-shrink: 0;
          }
          :host([compact]) .card-content {
            flex: 1;
            min-width: 0;
            padding: 1rem;
            justify-content: space-between;
          }
        }
        :host([variant="welcome"]) {
          text-align: center;
        }
        .header-row {
          display:flex;
          align-items:center;
          justify-content:space-between;
          flex: 0 0 auto;
        }
        :host([variant="welcome"]) .header-row {
          justify-content: center;
        }
        .header {
          margin: 0;
          font-size: var(--font-size-h3, 1.25rem);
          font-weight: var(--font-weight-card-header, 600);
          line-height: var(--line-height-card-header, 1.2);
          color: var(--color-on-background, inherit);
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: var(--labs-card-header-clamp);
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        :host([variant="welcome"]) .header {
          width: 100%;
        }
        .description {
          margin-top: 8px;
          color: var(--color-on-surface-variant, #666);
          font-size: var(--font-size-base, 1rem);
        }
        .input-row { margin-top: 14px; }
        .actions { 
          display: flex; 
          gap: 10px; 
          margin-top: 16px; 
          justify-content: center; 
          flex-wrap: wrap;
          padding: var(--labs-card-padding);
          background: var(--color-surface, #fff);
          grid-row: 3;
          grid-column: 1;
        }
        :host([variant="welcome"]) .actions {
          justify-content: flex-end;
        }
        ::slotted([slot="header"]) { font-size: inherit; font-weight: inherit; flex: 0 0 auto; }
        ::slotted([slot="close"]) { margin-left: 8px; }
        ::slotted([slot="description"]) { 
          flex: 0 0 auto;
          margin-top: 8px; 
          color: var(--color-on-surface-variant, #666); 
          font-size: var(--font-size-base, 1rem);
        }
        ::slotted([slot="input"]) { margin-top: 14px; display: flex; flex-direction: column; flex: 1; flex-grow: 1; font-size: var(--font-size-base, 1rem); }
      </style>
      <div class="card-image">
        <slot name="image"></slot>
      </div>
      <div class="card-content">
        <div class="header-row">
          <div class="header"><slot name="header"></slot></div>
          <slot name="close"></slot>
        </div>
        <slot name="description"></slot>
        <slot name="input"></slot>
      </div>
      <div class="actions">
        <slot name="actions"></slot>
      </div>
    `;
  }
}
if (!customElements.get('labs-card')) customElements.define('labs-card', LabsCard);
