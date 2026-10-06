/**
 * Product Card Component
 * Purpose-built for product showcases (Etsy-style listings)
 * 
 * Container query responsive:
 * - Narrow cards (<280px): image left, content right
 * - Wide cards (≥280px): image full-width top
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
    this.setupVideoDetection();
  }

  setupVideoDetection() {
    const videoSlot = this.shadowRoot.querySelector('slot[name="video"]');
    if (videoSlot) {
      videoSlot.addEventListener('slotchange', () => {
        const hasVideo = this.querySelector('[slot="video"]') !== null;
        if (hasVideo) {
          this.setAttribute('has-video', '');
        } else {
          this.removeAttribute('has-video');
        }
      });
      // Check on initial load
      const hasVideo = this.querySelector('[slot="video"]') !== null;
      if (hasVideo) {
        this.setAttribute('has-video', '');
      }
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --product-card-gap: 1rem;
          --product-card-radius: 0.5rem;
          --product-card-shadow: 0 2px 8px rgba(0,0,0,0.1);
          --product-image-size: 120px;
          
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: auto auto 1fr;
          gap: var(--product-card-gap);
          background: var(--color-surface, #fff);
          border-radius: var(--product-card-radius);
          box-shadow: var(--product-card-shadow);
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
          padding: var(--product-card-gap);
          container-type: inline-size;
        }

        .product-image {
          grid-column: 1;
          grid-row: 1;
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--color-surface-variant, #f5f5f5);
          border-radius: calc(var(--product-card-radius) * 0.5);
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

        :host([no-image]) {
          grid-template-columns: 1fr;
        }

        .product-video {
          grid-column: 1;
          grid-row: 1 / 4;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: var(--color-surface-variant, #f5f5f5);
          border-radius: calc(var(--product-card-radius) * 0.5);
        }

        .product-video ::slotted(*) {
          width: 100%;
          height: 100%;
          display: block;
        }

        :host([has-video]) {
          padding: 0;
          grid-template-rows: 1fr;
        }

        :host([has-video]) .product-image,
        :host([has-video]) .product-title,
        :host([has-video]) .product-actions {
          display: none;
        }

        :host([has-video]) .product-video {
          grid-column: 1;
          grid-row: 1;
        }

        .product-title {
          grid-column: 1;
          grid-row: 2;
          font-size: var(--font-size-h4, 1rem);
          font-weight: 600;
          line-height: 1.3;
          color: var(--color-on-surface, #000);
          margin: 0;
          display: flex;
          flex-direction: column;
        }

        .product-title ::slotted(*) {
          display: block;
        }

        .product-actions {
          grid-column: 1;
          grid-row: 3;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-content: flex-end;
          margin-top: auto;
        }

        .product-actions ::slotted(*) {
          flex: 1;
          min-width: 100px;
        }

        /* If the slotted content is a wrapper div with multiple buttons, make it flex */
        .product-actions ::slotted(div) {
          display: flex !important;
          flex-direction: column;
          gap: calc(1rem * 1.2);
          width: 100%;
          flex: none;
          min-width: auto;
        }

        /* Progressive enhancement: wider cards (>320px) use compact layout with image on left */
        @container (min-width: 320px) {
          :host {
            grid-template-columns: var(--product-image-size) 1fr;
            grid-template-rows: auto 1fr;
          }

          .product-image {
            grid-column: 1;
            grid-row: 1 / 3;
            width: var(--product-image-size);
          }

          .product-title {
            grid-column: 2;
            grid-row: 1;
          }

          .product-actions {
            grid-column: 2;
            grid-row: 2;
            row-gap: calc(var(--product-card-gap) * 0.5);
          }
        }
      </style>

      <div class="product-image">
        <slot name="image"></slot>
      </div>

      <div class="product-video">
        <slot name="video"></slot>
      </div>

      <div class="product-title">
        <slot name="title"></slot>
      </div>

      <div class="product-actions">
        <slot name="actions"></slot>
      </div>
    `;
  }
}

if (!customElements.get('labs-product-card')) {
  customElements.define('labs-product-card', LabsProductCard);
}
