// Minimal labs-container component: token-driven max-width and padding
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg, 24px);
      width: 100%;
      max-width: 600px;
      box-sizing: border-box;
      margin-left: auto;
      margin-right: auto;
      padding-left: 2rem;
      padding-right: 2rem;
      padding-top: var(--space-md, 16px);
      padding-bottom: var(--space-lg, 24px);
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
    :host([full-width]) {
      max-width: 100%;
      width: 100%;
    }
    :host([fill]) {
      max-width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
    :host([compact]) {
      padding-top: var(--space-md, 16px);
      padding-bottom: 0;
      gap: var(--space-md, 16px);
    }
    :host([bottom-pad]) {
      padding-bottom: 100px;
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
