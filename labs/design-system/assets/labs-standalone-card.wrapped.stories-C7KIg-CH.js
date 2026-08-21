import"./labs-card-qLLTGPla.js";class s extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.render()}render(){this.shadowRoot.innerHTML=`
      <labs-card>
        <span slot="header"><slot name="header"></slot></span>
        <span slot="description"><slot name="description"></slot></span>
        <span slot="content"><slot></slot></span>
        <span slot="actions"><slot name="actions"></slot></span>
        <span slot="close"><slot name="close"></slot></span>
      </labs-card>
      <style>
        :host { display: block; max-width: 420px; margin: 0 auto; }
      </style>
    `}}customElements.get("labs-standalone-card")||customElements.define("labs-standalone-card",s);const n={title:"3. Components (Wrapped)/Card/Standalone",component:"labs-standalone-card",parameters:{docs:{description:{component:"A wrapped standalone card variant using labs-standalone-card. Shows header, description, content, and actions."}}}},e=[];export{e as __namedExportsOrder,n as default};
