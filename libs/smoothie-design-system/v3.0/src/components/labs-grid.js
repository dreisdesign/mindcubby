// Flexible CSS Grid component for card layouts
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-lg, 24px);
      width: 100%;
      height: auto;
      align-content: start;
      box-sizing: border-box;
    }
    :host([columns="1"]) {
      grid-template-columns: 1fr;
    }
    :host([columns="2"]) {
      grid-template-columns: repeat(2, 1fr);
    }
    :host([columns="3"]) {
      grid-template-columns: repeat(3, 1fr);
    }
    :host([columns="4"]) {
      grid-template-columns: repeat(4, 1fr);
    }
    :host([columns="auto"]) {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
    :host([compact]) {
      gap: var(--space-md, 16px);
    }
    :host([loose]) {
      gap: var(--space-xl, 32px);
    }
    @media (max-width: var(--container-mobile-breakpoint, 640px)) {
      :host([columns="2"]),
      :host([columns="3"]),
      :host([columns="4"]) {
        grid-template-columns: 1fr;
      }
    }
  </style>
  <slot></slot>
`;

class LabsGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
  }
}

if (!customElements.get('labs-grid')) customElements.define('labs-grid', LabsGrid);

export default LabsGrid;
