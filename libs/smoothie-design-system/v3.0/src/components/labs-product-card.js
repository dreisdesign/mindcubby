/**
 * Product Card Component
 * Purpose-built for product showcases (e.g., Etsy listings)
 * 
 * Composition: image + title + actions
 * Responsive: single component, no internal breakpoints
 * 
 * @slot image - Product image (optional)
 * @slot title - Product title/name
 * @slot actions - Action buttons (e.g., "Order on Etsy", "Buy Files")
 * 
 * @attr [no-image] - Hide image slot (useful for text-only products)
 * 
 * @cssprop --product-card-gap - Internal spacing (default: 1rem)
 * @cssprop --product-card-radius - Border radius (default: 0.5rem)
 * @cssprop --product-card-shadow - Box shadow (default: 0 2px 8px rgba(0,0,0,0.1))
 * @cssprop --color-surface - Card background
 * @cssprop --font-size-h4 - Title font size (default: 1rem)
 * @cssprop --color-on-surface - Title color
 */
class LabsProductCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --product-card-gap: 1rem;
          --product-card-radius: 0.5rem;
          --product-card-shadow: 0 2px 8px rgba(0,0,0,0.1);
          
          display: flex;
          flex-direction: column;
          gap: var(--product-card-gap);
          background: var(--color-surface, #fff);
          border-radius: var(--product-card-radius);
          box-shadow: var(--product-card-shadow);
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
        }

        .product-image {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--color-surface-variant, #f5f5f5);
        }

        .product-image ::slotted(*) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        :host([no-image]) .product-image {
          display: none;
        }

        .product-content {
          display: flex;
          flex-direction: column;
          gap: calc(var(--product-card-gap) * 0.75);
          padding: var(--product-card-gap);
          flex: 1;
        }

        .product-title {
          font-size: var(--font-size-h4, 1rem);
          font-weight: 600;
          line-height: 1.3;
          color: var(--color-on-surface, #000);
          margin: 0;
        }

        .product-title ::slotted(*) {
          display: block;
        }

        .product-actions {
          display: flex;
          gap: calc(var(--product-card-gap) * 0.5);
          flex-wrap: wrap;
          margin-top: auto;
        }

        .product-actions ::slotted(*) {
          flex: 1;
          min-width: 120px;
        }
      </style>

      <div class="product-image">
        <slot name="image"></slot>
      </div>

      <div class="product-content">
        <div class="product-title">
          <slot name="title"></slot>
        </div>
        
        <div class="product-actions">
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('labs-product-card', LabsProductCard);
