import"./iframe-BSFi6Bzo.js";import{i as d}from"./icons-list-BupfDT4a.js";import"./preload-helper-PPVm8Dsz.js";const o=document.createElement("template");o.innerHTML=`
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
`;class m extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(o.content.cloneNode(!0))}connectedCallback(){this.hasAttribute("role")||this.setAttribute("role","region")}}customElements.get("labs-container")||customElements.define("labs-container",m);const g={title:"1. Foundations/Container",parameters:{docs:{description:{component:"Demonstrates the `labs-container` element and its layout sizes: `small` (max-width: 50%), `medium` (max-width: 60%), `large` (max-width: 70%), and `fill` (100vw). All use consistent 2rem padding on desktop, 1rem on mobile."}}},argTypes:{layout:{control:{type:"radio"},options:["small","medium","large","fill"],description:"Choose a container size"},maxWidth:{control:{type:"text"},description:"Override the container max width (e.g. 960px)"},settingsIcon:{control:{type:"select"},options:Object.keys(d)}},args:{layout:"medium",maxWidth:"",settingsIcon:"settings"}},a={name:"Container Variants",render:n=>{const{layout:t,maxWidth:i,settingsIcon:s}=n,e=t==="small"?"small":t==="medium"?"medium":t==="large"?"large":t==="fill"?"fill":"",l=i?`style="--app-container-max:${i};"`:"",r=t==="small"?"max-width: 50%":t==="medium"?"max-width: 60%":t==="large"?"max-width: 70%":t==="fill"?"100vw":"max-width: 60% (default)";return`
      <style>
        html,body { height:100%; margin:0; padding:0; }
        .page { min-height:100vh; background: var(--color-background, #f6f7f9); padding: 24px 0; }
        .demo-card { background: var(--color-surface, #fff); padding: 16px; border-radius: 10px; box-shadow: var(--elevation-1, none); }
      </style>
      <div class="page">
        <labs-container ${e} ${l}>
          <div class="demo-card">
            <h3 style="margin-top:0;">labs-container ${e?`[${e}]`:""} (${r})</h3>
            <p style="margin:0 0 12px 0; color:var(--color-on-surface-variant,#666);">This container uses viewport-based widths on desktop and fills 100vw on mobile. All variants use consistent 2rem padding on desktop, 1rem on mobile.</p>
            <div style="display:flex;gap:8px;align-items:center;">
              <labs-button pill variant="primary">Primary</labs-button>
              <labs-button variant="icon" aria-label="Settings"><labs-icon name="${s}" slot="icon-left"></labs-icon></labs-button>
            </div>
          </div>
        </labs-container>
      </div>
    `}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'Container Variants',
  render: args => {
    const {
      layout,
      maxWidth,
      settingsIcon
    } = args;
    const attr = layout === 'small' ? 'small' : layout === 'medium' ? 'medium' : layout === 'large' ? 'large' : layout === 'fill' ? 'fill' : '';
    const style = maxWidth ? \`style="--app-container-max:\${maxWidth};"\` : '';
    const widthLabel = layout === 'small' ? 'max-width: 50%' : layout === 'medium' ? 'max-width: 60%' : layout === 'large' ? 'max-width: 70%' : layout === 'fill' ? '100vw' : 'max-width: 60% (default)';
    return \`
      <style>
        html,body { height:100%; margin:0; padding:0; }
        .page { min-height:100vh; background: var(--color-background, #f6f7f9); padding: 24px 0; }
        .demo-card { background: var(--color-surface, #fff); padding: 16px; border-radius: 10px; box-shadow: var(--elevation-1, none); }
      </style>
      <div class="page">
        <labs-container \${attr} \${style}>
          <div class="demo-card">
            <h3 style="margin-top:0;">labs-container \${attr ? \`[\${attr}]\` : ''} (\${widthLabel})</h3>
            <p style="margin:0 0 12px 0; color:var(--color-on-surface-variant,#666);">This container uses viewport-based widths on desktop and fills 100vw on mobile. All variants use consistent 2rem padding on desktop, 1rem on mobile.</p>
            <div style="display:flex;gap:8px;align-items:center;">
              <labs-button pill variant="primary">Primary</labs-button>
              <labs-button variant="icon" aria-label="Settings"><labs-icon name="\${settingsIcon}" slot="icon-left"></labs-icon></labs-button>
            </div>
          </div>
        </labs-container>
      </div>
    \`;
  }
}`,...a.parameters?.docs?.source}}};const u=["Demo"];export{a as Demo,u as __namedExportsOrder,g as default};
