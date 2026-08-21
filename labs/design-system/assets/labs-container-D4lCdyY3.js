const t=document.createElement("template");t.innerHTML=`
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
`;class e extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(t.content.cloneNode(!0))}connectedCallback(){this.hasAttribute("role")||this.setAttribute("role","region")}}customElements.get("labs-container")||customElements.define("labs-container",e);
