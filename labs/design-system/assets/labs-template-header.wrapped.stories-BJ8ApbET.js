class a extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          width: 100%;
          padding-top: var(--space-lg, 1.5rem);
          padding-bottom: var(--space-md, 1rem);
        }
        
        .header-title {
          font-size: var(--font-size-h1, 3rem);
          font-weight: var(--font-weight-heading, 800);
          margin: 0;
          line-height: 1.2;
          text-align: center;
          color: var(--color-on-surface, #1b1c1f);
        }
      </style>
      <header>
        <h1 class="header-title"><slot name="title">Footer Test Page</slot></h1>
      </header>
    `}}customElements.define("labs-template-header-wrapped",a);const r={title:"3. Components (Wrapped)/Template/Header",component:"labs-template-header-wrapped"},e=()=>`
  <labs-template-header-wrapped>
    <span slot="title">Footer Test Page</span>
  </labs-template-header-wrapped>
`;e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`() => \`
  <labs-template-header-wrapped>
    <span slot="title">Footer Test Page</span>
  </labs-template-header-wrapped>
\``,...e.parameters?.docs?.source}}};const s=["Default"];export{e as Default,s as __namedExportsOrder,r as default};
