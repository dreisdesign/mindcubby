class u extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._open=!1,this._menuId=`labs-dropdown-menu-${Math.random().toString(36).slice(2,8)}`,this.render()}static get observedAttributes(){return["archived","restored","open","only"]}attributeChangedCallback(t){t==="open"&&(this._open=this.hasAttribute("open")),this.render()}get open(){return this._open}set open(t){!!t?this.setAttribute("open",""):this.removeAttribute("open")}connectedCallback(){document.addEventListener("click",this._outsideClick=t=>{if(!this._open)return;const e=t.composedPath?t.composedPath():t.path||[];!e.includes(this)&&!e.includes(this.shadowRoot)&&(!this._portaledMenu||!e.includes(this._portaledMenu))&&this._close()})}disconnectedCallback(){document.removeEventListener("click",this._outsideClick),this._cleanupPortaledMenu()}render(){this.shadowRoot.innerHTML=`
      <style>
        :host { display: inline-block; position: relative; }
        .trigger { display:inline-flex; }
        labs-button[variant="icon"] { --icon-size:20px; }
      </style>
      <div class="trigger">
        <labs-button id="toggleBtn" variant="icon" aria-label="More" aria-haspopup="true" aria-expanded="${this._open?"true":"false"}" aria-controls="${this._menuId}">
          <labs-icon slot="icon-left" name="more_vert" width="20" height="20" color="currentColor"></labs-icon>
        </labs-button>
      </div>
    `,this._createPortaledMenu();const t=this.shadowRoot.getElementById("toggleBtn");t&&(t.addEventListener("click",o=>{o.stopPropagation(),this._toggle()}),t.addEventListener("keydown",o=>this._onToggleKeyDown(o))),this._open?(this._portaledMenu&&(this._portaledMenu.style.display="block",this._portaledMenu.setAttribute("aria-hidden","false"),this._positionPortaledMenu()),this.dispatchEvent(new CustomEvent("open",{bubbles:!0,composed:!0}))):(this._portaledMenu&&(this._portaledMenu.style.display="none",this._portaledMenu.setAttribute("aria-hidden","true")),this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0})));const e=this.shadowRoot.getElementById("toggleBtn");e&&e.setAttribute("aria-expanded",String(this._open))}_getMenuItems(){const t=this._portaledMenu||document.getElementById(this._menuId);return t?Array.from(t.querySelectorAll("labs-button")):[]}_focusItemAt(t){const e=this._getMenuItems();if(!e.length)return;const o=(t+e.length)%e.length,s=e[o];if(s){s.hasAttribute("tabindex")||s.setAttribute("tabindex","0");try{s.focus()}catch{}this._currentIndex=o}}_focusFirstItem(){this._focusItemAt(0)}_focusLastItem(){const t=this._getMenuItems();this._focusItemAt(t.length-1)}_onToggleKeyDown(t){const e=t.key;e==="Enter"||e===" "||e==="Spacebar"?(t.preventDefault(),t.stopPropagation(),this.open=!0,this._focusFirstItem()):e==="ArrowDown"?(t.preventDefault(),t.stopPropagation(),this.open=!0,this._focusFirstItem()):e==="ArrowUp"&&(t.preventDefault(),t.stopPropagation(),this.open=!0,this._focusLastItem())}_onMenuKeyDown(t){const e=t.key;if(this._getMenuItems().length)if(e==="ArrowDown")t.preventDefault(),t.stopPropagation(),this._focusItemAt((this._currentIndex||0)+1);else if(e==="ArrowUp")t.preventDefault(),t.stopPropagation(),this._focusItemAt((this._currentIndex||0)-1);else if(e==="Home")t.preventDefault(),t.stopPropagation(),this._focusFirstItem();else if(e==="End")t.preventDefault(),t.stopPropagation(),this._focusLastItem();else if(e==="Escape"){t.preventDefault(),t.stopPropagation(),this._close();const s=this.shadowRoot.getElementById("toggleBtn");s&&s.focus()}else e==="Tab"&&this._close()}_toggle(){this.open=!this._open}_close(){this.open=!1}_createPortaledMenu(){let t=document.getElementById("labs-dropdown-portal");t||(t=document.createElement("div"),t.id="labs-dropdown-portal",t.style.cssText=`
                position: fixed;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 10000;
            `,document.body.appendChild(t));const e=document.getElementById(this._menuId);e&&e.remove();const o=document.createElement("div");o.id=this._menuId,o.className="labs-dropdown-menu",o.setAttribute("role","menu"),o.setAttribute("aria-hidden","true"),o.style.cssText=`
            position: absolute;
            background: var(--color-surface, #fff);
            border-radius: var(--labs-card-radius, 12px);
            box-shadow: var(--labs-card-shadow, 0 6px 26px rgba(0,0,0,0.12));
            padding: 8px;
            min-width: fit-content;
            display: none;
            box-sizing: border-box;
            pointer-events: auto;
        `;const n=(this.getAttribute("only")||"").split(",").map(a=>a.trim().toLowerCase()).filter(Boolean),r=n.length===0||n.includes("archive"),l=n.includes("restore")||this.hasAttribute("archived"),i=n.length===0||n.includes("delete");o.innerHTML=`
            <style>
                .labs-dropdown-menu labs-button {
                    width: 100%;
                    display: block;
                    text-align: left;
                    gap: 10px;
                    margin: 0;
                    box-sizing: border-box;
                }
                .labs-dropdown-menu labs-button button {
                    display: flex !important;
                    width: 100% !important;
                    align-items: center;
                    justify-content: flex-start;
                    text-align: left;
                }
                .labs-dropdown-menu labs-button + labs-button { margin-top: 6px; }
                .labs-dropdown-menu labs-button[variant="destructive"] labs-icon { color: var(--color-on-error, #fff); }
            </style>
            ${l?`<labs-button id="restoreBtn" variant="secondary" size="small" fullwidth role="menuitem" tabindex="-1">
                <labs-icon slot="icon-left" name="history" width="20" height="20"></labs-icon>
                Restore
            </labs-button>`:""}
            ${!l&&r?`<labs-button id="archiveBtn" variant="secondary" size="small" fullwidth role="menuitem" tabindex="-1">
                <labs-icon slot="icon-left" name="archive" width="20" height="20"></labs-icon>
                Archive
            </labs-button>`:""}
            ${i?`<labs-button id="deleteBtn" variant="destructive" size="small" fullwidth role="menuitem" tabindex="-1">
                <labs-icon slot="icon-left" name="delete_forever" width="20" height="20"></labs-icon>
                Delete
            </labs-button>`:""}
        `,t.appendChild(o),this._portaledMenu=o,this._wireMenuEvents(o)}_wireMenuEvents(t){const e=t.querySelector("#archiveBtn");e&&e.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),this.dispatchEvent(new CustomEvent("archive",{bubbles:!0,composed:!0})),this._close()});const o=t.querySelector("#restoreBtn");o&&o.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),this.dispatchEvent(new CustomEvent("restore",{bubbles:!0,composed:!0})),this._close()});const s=t.querySelector("#deleteBtn");s&&s.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),this.dispatchEvent(new CustomEvent("remove",{bubbles:!0,composed:!0})),this._close()}),t.addEventListener("keydown",n=>this._onMenuKeyDown(n))}_positionPortaledMenu(){if(!this._portaledMenu)return;const t=this.shadowRoot.getElementById("toggleBtn");if(!t)return;const e=t.getBoundingClientRect(),o=this._portaledMenu,s=o.style.display;o.style.display="block";const n=o.getBoundingClientRect();o.style.display=s;const r=window.innerWidth,i=window.innerHeight-e.bottom,a=e.top,d=Math.min(Math.max(0,e.right-n.width),r-n.width),c=i>=n.height||i>=a?e.bottom:e.top-n.height;o.style.left=`${d}px`,o.style.top=`${c}px`,this._repositionHandler||(this._repositionHandler=()=>{try{this._positionPortaledMenu()}catch{}},window.addEventListener("resize",this._repositionHandler,{passive:!0}),window.addEventListener("scroll",this._repositionHandler,{passive:!0}))}_cleanupPortaledMenu(){this._portaledMenu&&(this._portaledMenu.remove(),this._portaledMenu=null),this._repositionHandler&&(window.removeEventListener("resize",this._repositionHandler),window.removeEventListener("scroll",this._repositionHandler),this._repositionHandler=null)}}customElements.get("labs-dropdown")||customElements.define("labs-dropdown",u);
