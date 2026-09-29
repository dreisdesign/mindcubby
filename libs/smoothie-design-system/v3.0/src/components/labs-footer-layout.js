// Footer Layout Component: Full-page layout with sticky footer
// Handles body-level flex setup to prevent dual scrollbars
// Solves: header bar + scrollable content + sticky footer pattern

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      margin: 0;
      padding: 0;
    }

    /* Header slot (control bar) */
    .header-slot {
      flex-shrink: 0;
      width: 100%;
    }

    /* Content area: scrollable, fills remaining space */
    .content-slot {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      width: 100%;
    }

    /* Footer slot: sticky to bottom of viewport */
    .footer-slot {
      flex-shrink: 0;
      width: 100%;
      position: sticky;
      bottom: 0;
      z-index: 10;
    }
  </style>

  <div class="header-slot">
    <slot name="header"></slot>
  </div>

  <div class="content-slot">
    <slot name="content"></slot>
  </div>

  <div class="footer-slot">
    <slot name="footer"></slot>
  </div>
`;

class LabsFooterLayout extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'application');
  }
}

if (!customElements.get('labs-footer-layout')) customElements.define('labs-footer-layout', LabsFooterLayout);

export default LabsFooterLayout;
