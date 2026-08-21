import"./labs-footer-Ccsak1Jj.js";import"./labs-button-reset-media.wrapped-D698GfX9.js";import"./labs-overlay-PCtGcMOL.js";import"./labs-settings-card-BmHPLBrl.js";import{x as s}from"./iframe-Cd7NLwLp.js";import"./preload-helper-PPVm8Dsz.js";const i=document.createElement("template");i.innerHTML=`
  <style>
    :host { display: block; box-sizing: border-box; }
    #settings-btn labs-icon {
      width: var(--lfs-icon-size, 28px);
      height: var(--lfs-icon-size, 28px);
      transition: transform 0.4s cubic-bezier(.4,2,.6,1);
      display: inline-block;
    }
    #settings-btn:hover labs-icon {
      transform: rotate(90deg);
    }
    .footer-center {
      display: flex;
      align-items: center;
      gap: var(--space-lg, 1.25rem);
      justify-content: center;
    }
    .footer-right {
      display: flex;
      align-items: center;
      gap: var(--space-md, 0.75rem);
    }
    #settings-btn {
      padding-right: var(--space-md, 12px);
    }
  </style>

  <labs-footer id="footer" full-width elevated>

  <div slot="left" class="footer-left">
  <labs-button-reset-media-wrapped id="reset-btn" fullwidth size="small" variant="transparent"></labs-button-reset-media-wrapped>
    </div>

    <div slot="center" class="footer-center">
      <labs-button id="media-btn" pill size="large" variant="primary">
        <labs-icon slot="icon-left" name="play_circle"></labs-icon>
        <span id="media-label">Start</span>
      </labs-button>
      
    </div>
    <div slot="right" class="footer-right">
      <labs-button id="settings-btn" variant="icon" aria-label="Settings" size="large">
        <labs-icon id="settings-icon" slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>

  <labs-overlay id="settings-overlay" size="medium" transparent>
    <labs-settings-card></labs-settings-card>
  </labs-overlay>
`;class a extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(i.content.cloneNode(!0)),this._onMediaClick=this._onMediaClick.bind(this),this._onResetClick=this._onResetClick.bind(this),this._onSettingsClick=this._onSettingsClick.bind(this),this._onCardClose=this._onCardClose.bind(this),this._mode=this.getAttribute("mode")||"cycle",this._mediaStates=[{label:"Start",icon:"play_circle"},{label:"Pause",icon:"pause_circle"},{label:"Resume",icon:"not_started"}],this._mediaState=0}connectedCallback(){this._mediaBtn=this.shadowRoot.getElementById("media-btn"),this._mediaLabel=this.shadowRoot.getElementById("media-label"),this._mediaIcon=this._mediaBtn&&this._mediaBtn.querySelector("labs-icon"),this._resetBtn=this.shadowRoot.getElementById("reset-btn"),this._settingsBtn=this.shadowRoot.getElementById("settings-btn"),this._settingsIcon=this.shadowRoot.getElementById("settings-icon"),this._overlay=this.shadowRoot.getElementById("settings-overlay"),this._settingsCard=this._overlay&&this._overlay.querySelector("labs-settings-card"),this._mediaBtn&&this._mediaBtn.addEventListener("click",this._onMediaClick),this._resetBtn&&this._resetBtn.addEventListener("click",this._onResetClick),this._settingsBtn&&this._settingsBtn.addEventListener("click",this._onSettingsClick),this._settingsCard&&this._settingsCard.addEventListener("close",this._onCardClose);const e=this.shadowRoot.getElementById("footer");e&&(e.setAttribute("full-width",""),e.setAttribute("elevated","")),this._updateMediaButton()}disconnectedCallback(){this._mediaBtn&&this._mediaBtn.removeEventListener("click",this._onMediaClick),this._resetBtn&&this._resetBtn.removeEventListener("click",this._onResetClick),this._settingsBtn&&this._settingsBtn.removeEventListener("click",this._onSettingsClick),this._settingsCard&&this._settingsCard.removeEventListener("close",this._onCardClose)}_onMediaClick(){this._mode==="timer"?this._mediaState===0?this._mediaState=1:this._mediaState===1?this._mediaState=2:this._mediaState=1:this._mediaState=(this._mediaState+1)%this._mediaStates.length,this._updateMediaButton(),this.dispatchEvent(new CustomEvent("media-action",{detail:this._mediaStates[this._mediaState],bubbles:!0}))}_onResetClick(){this._mediaState=0,this._updateMediaButton(),this.dispatchEvent(new CustomEvent("reset-media",{bubbles:!0}))}_onSettingsClick(){this._overlay&&typeof this._overlay.open=="function"&&(this._overlay.open(),this.dispatchEvent(new CustomEvent("settings-open",{bubbles:!0})))}_onCardClose(){this._overlay&&typeof this._overlay.close=="function"&&this._overlay.close(),this.dispatchEvent(new CustomEvent("settings-close",{bubbles:!0}))}_updateMediaButton(){this._mediaLabel&&(this._mediaLabel.textContent=this._mediaStates[this._mediaState].label),this._mediaIcon&&this._mediaIcon.setAttribute("name",this._mediaStates[this._mediaState].icon)}}customElements.get("labs-footer-media-controls")||customElements.define("labs-footer-media-controls",a);const m={title:"4. Patterns/Template - Footer",parameters:{docs:{description:{component:"Footer pattern for Timer app with media controls in the center and a Reset Media button (motion_play icon) on the right."}}}},t={name:"Media Controls",render:()=>s`
            <labs-footer-media-controls></labs-footer-media-controls>
        `};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  name: 'Media Controls',
  render: () => html\`
            <labs-footer-media-controls></labs-footer-media-controls>
        \`
}`,...t.parameters?.docs?.source}}};const _=["MediaFooter"];export{t as MediaFooter,_ as __namedExportsOrder,m as default};
