import"./iframe-BOP8xSmv.js";class a extends HTMLElement{static get observedAttributes(){return["fullwidth","size","variant"]}constructor(){super(),this.attachShadow({mode:"open"}),this.render()}attributeChangedCallback(){this.render()}render(){const t=this.hasAttribute("fullwidth"),e=this.getAttribute("size")||"large",s=this.getAttribute("variant")||"secondary";this.shadowRoot.innerHTML=`
      <style>
        :host { display: block; }
        labs-button {
          width: ${t?"100%":"auto"};
        }
      </style>
      <labs-button
        variant="${s}"
        size="${e}"
        pill
        ${t?"fullwidth":""}
      >
        <labs-icon slot="icon-left" name="replay"></labs-icon>
        Reset
      </labs-button>
    `}}customElements.get("labs-button-reset-media-wrapped")||customElements.define("labs-button-reset-media-wrapped",a);
