import"./labs-footer-Ch46fT0C.js";import{x as d}from"./iframe-BTl-QeGS.js";import"./labs-overlay-DHSRSCHf.js";import"./labs-settings-card-BmY_Lbnm.js";import{i as l}from"./icons-list-BupfDT4a.js";import"./preload-helper-PPVm8Dsz.js";const r=document.createElement("template");r.innerHTML=`
  <style>
    :host { display: block; }
    /* Icon animation scoped to the wrapper */
    #settings-btn labs-icon {
      width: var(--lfs-icon-size, 28px);
      height: var(--lfs-icon-size, 28px);
      transition: transform 0.4s cubic-bezier(.4,2,.6,1);
      display:inline-block;
    }
    #settings-btn:hover labs-icon {
      transform: rotate(90deg);
    }
    /* Ensure footer sits in normal flow; consumers control page layout */
    :host { box-sizing: border-box; }
  </style>

  <labs-footer id="footer">
    <div slot="center">
      <labs-button id="add-btn" pill size="large" variant="primary"><labs-icon slot="icon-left" name="add"></labs-icon>Add</labs-button>
    </div>
    <div slot="right" style="display:flex;align-items:center;gap:8px;">
      <labs-button id="settings-btn" variant="icon" aria-label="Settings" size="large" style="padding-right:12px;">
        <labs-icon id="settings-icon" slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>

  <labs-overlay id="settings-overlay" size="medium" transparent>
    <labs-settings-card></labs-settings-card>
  </labs-overlay>
`;class h extends HTMLElement{static get observedAttributes(){return["settings-icon","settings-size","add-size","add-variant","full-width","elevated"]}constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(r.content.cloneNode(!0)),this._onSettingsClick=this._onSettingsClick.bind(this),this._onCardClose=this._onCardClose.bind(this),this._onAddClick=this._onAddClick.bind(this),this._onResetAll=this._onResetAll.bind(this)}connectedCallback(){this._upgradeProperty("settingsIcon"),this._upgradeProperty("settingsSize"),this._upgradeProperty("addSize"),this._upgradeProperty("addVariant"),this._settingsBtn=this.shadowRoot.getElementById("settings-btn"),this._settingsIcon=this.shadowRoot.getElementById("settings-icon"),this._overlay=this.shadowRoot.getElementById("settings-overlay"),this._settingsCard=this._overlay&&this._overlay.querySelector("labs-settings-card"),this._settingsBtn&&this._settingsBtn.addEventListener("click",this._onSettingsClick),this._addBtn=this.shadowRoot.getElementById("add-btn"),this._addBtn&&this._addBtn.addEventListener("click",this._onAddClick),this._settingsCard&&(this._settingsCard.addEventListener("close",this._onCardClose),this._settingsCard.addEventListener("reset-all",this._onResetAll)),this._applyFooterAttrs()}disconnectedCallback(){this._settingsBtn&&this._settingsBtn.removeEventListener("click",this._onSettingsClick),this._addBtn&&this._addBtn.removeEventListener("click",this._onAddClick),this._settingsCard&&(this._settingsCard.removeEventListener("close",this._onCardClose),this._settingsCard.removeEventListener("reset-all",this._onResetAll))}attributeChangedCallback(t,n,i){switch(t){case"settings-icon":this._settingsIcon&&this._settingsIcon.setAttribute("name",i||"settings");break;case"settings-size":this._settingsBtn&&this._settingsBtn.setAttribute("size",i||"large");break;case"add-size":const a=this.shadowRoot.getElementById("add-btn");a&&a.setAttribute("size",i||"large");break;case"add-variant":const o=this.shadowRoot.getElementById("add-btn");o&&o.setAttribute("variant",i||"primary");break;case"full-width":case"elevated":this._applyFooterAttrs();break}}get settingsIcon(){return this.getAttribute("settings-icon")}set settingsIcon(t){this.setAttribute("settings-icon",t)}get settingsSize(){return this.getAttribute("settings-size")}set settingsSize(t){this.setAttribute("settings-size",t)}get addSize(){return this.getAttribute("add-size")}set addSize(t){this.setAttribute("add-size",t)}get addVariant(){return this.getAttribute("add-variant")}set addVariant(t){this.setAttribute("add-variant",t)}get fullWidth(){return this.hasAttribute("full-width")}set fullWidth(t){t?this.setAttribute("full-width",""):this.removeAttribute("full-width")}get elevated(){return this.hasAttribute("elevated")}set elevated(t){t?this.setAttribute("elevated",""):this.removeAttribute("elevated")}_upgradeProperty(t){if(this.hasOwnProperty(t)){let n=this[t];delete this[t],this[t]=n}}_applyFooterAttrs(){const t=this.shadowRoot.getElementById("footer");t&&(this.hasAttribute("full-width")?t.setAttribute("full-width",""):t.removeAttribute("full-width"),this.hasAttribute("elevated")?t.setAttribute("elevated",""):t.removeAttribute("elevated"))}_onSettingsClick(){this._overlay&&typeof this._overlay.open=="function"&&(this._overlay.open(),this.dispatchEvent(new CustomEvent("settings-open",{bubbles:!0})))}_onCardClose(){this._overlay&&typeof this._overlay.close=="function"&&this._overlay.close(),this.dispatchEvent(new CustomEvent("settings-close",{bubbles:!0}))}_onAddClick(){this.dispatchEvent(new CustomEvent("add",{bubbles:!0}))}_onResetAll(){this.dispatchEvent(new CustomEvent("reset-all",{bubbles:!0}))}}customElements.get("labs-footer-with-settings")||customElements.define("labs-footer-with-settings",h);const v={title:"3. Components (Wrapped)/Template/Footer",parameters:{docs:{description:{component:"Encapsulated `labs-footer-with-settings` wrapper that includes animation and overlay wiring. Use controls to adjust icon and sizes."}}}},s={name:"With Settings",render:e=>d`
    <div style="min-height:100vh; display:flex; flex-direction:column;">
      <main style="flex:1 1 auto;"></main>
      <labs-footer-with-settings
        settings-icon=${e.settingsIcon}
        settings-size=${e.settingsSize}
        add-size=${e.addSize}
        add-variant=${e.addVariant}
        ?full-width=${e.fullWidth}
        ?elevated=${e.elevated}
      ></labs-footer-with-settings>
    </div>
  `};s.argTypes={settingsIcon:{control:{type:"select"},options:Object.keys(l)},settingsSize:{control:{type:"inline-radio"},options:["small","medium","large"]},addSize:{control:{type:"inline-radio"},options:["small","medium","large"]},addVariant:{control:{type:"select"},options:["primary","secondary","transparent"]},fullWidth:{control:"boolean"},elevated:{control:"boolean"}};s.args={settingsIcon:"settings",settingsSize:"large",addSize:"large",addVariant:"primary",fullWidth:!0,elevated:!0};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: 'With Settings',
  render: args => html\`
    <div style="min-height:100vh; display:flex; flex-direction:column;">
      <main style="flex:1 1 auto;"></main>
      <labs-footer-with-settings
        settings-icon=\${args.settingsIcon}
        settings-size=\${args.settingsSize}
        add-size=\${args.addSize}
        add-variant=\${args.addVariant}
        ?full-width=\${args.fullWidth}
        ?elevated=\${args.elevated}
      ></labs-footer-with-settings>
    </div>
  \`
}`,...s.parameters?.docs?.source}}};const f=["WithSettings"];export{s as WithSettings,f as __namedExportsOrder,v as default};
