// Minimal labs-container component: token-driven max-width and padding
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      max-width: 600px;
      box-sizing: border-box;
      margin-left: auto;
      margin-right: auto;
      padding-left: 2rem;
      padding-right: 2rem;
    }
    :host([small]) {
      max-width: 400px;
    }
    :host([medium]) {
      max-width: 600px;
    }
    :host([large]) {
      max-width: 800px;
    }
    :host([fill]) {
      max-width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    @media (max-width: var(--container-mobile-breakpoint, 640px)) {
      :host,
      :host([small]),
      :host([medium]),
      :host([large]),
      :host([fill]) {
        max-width: 100vw;
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }
  </style>
  <slot></slot>
`;

class LabsContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
  }
}

if (!customElements.get('labs-container')) customElements.define('labs-container', LabsContainer);

export default LabsContainer;
