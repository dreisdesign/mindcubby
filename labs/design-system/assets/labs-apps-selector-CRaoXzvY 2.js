class c extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._open=!1,this._menuId=`labs-apps-menu-${Math.random().toString(36).slice(2,8)}`,this._portaledMenu=null,this._apps=[{name:"Timer",icon:"schedule",path:"/labs/timer/"},{name:"Tracker",icon:"trending_up",path:"/labs/tracker/"},{name:"Today List",icon:"list_alt",path:"/labs/today-list/"},{name:"Note",icon:"description",path:"/labs/note/"},{name:"Pad",icon:"draw",path:"/labs/pad/"},{name:"Design System",icon:"palette",path:"/labs/design-system/"}],this.render()}static get observedAttributes(){return["open"]}connectedCallback(){document.addEventListener("click",this._outsideClick=t=>{if(!this._open)return;const e=t.composedPath?t.composedPath():t.path||[];!e.includes(this)&&!e.includes(this.shadowRoot)&&this._closeMenu()})}disconnectedCallback(){document.removeEventListener("click",this._outsideClick)}attributeChangedCallback(t,e,n){t==="open"&&(this._open=this.hasAttribute("open"),this.render())}get open(){return this._open}set open(t){t?this.setAttribute("open",""):this.removeAttribute("open")}_openMenu(){this.setAttribute("open","")}_closeMenu(){this.removeAttribute("open")}_getBaseUrl(){return typeof window<"u"&&window.location&&(window.location.hostname.includes("localhost")||window.location.hostname==="127.0.0.1")?"http://localhost:8000":""}render(){const t=this._getBaseUrl();this.shadowRoot.innerHTML=`
      <style>
        :host { display: block; }
        labs-button { width: 100%; }
      </style>
      <div class="trigger">
        <labs-button id="trigger" variant="secondary" size="large" style="gap: 10px; justify-content: flex-start; width: 100%;">
          <labs-icon name="apps" slot="icon-left" width="20" height="20"></labs-icon>
          All Apps
        </labs-button>
      </div>
    `,this._createPortaledMenu(t);const e=this.shadowRoot.getElementById("trigger");e&&e.addEventListener("click",()=>{this._open?this._closeMenu():this._openMenu()}),this._open?this._portaledMenu&&(this._portaledMenu.style.display="flex",this._positionPortaledMenu()):this._portaledMenu&&(this._portaledMenu.style.display="none")}_createPortaledMenu(t){let e=document.getElementById("labs-apps-selector-portal");e||(e=document.createElement("div"),e.id="labs-apps-selector-portal",e.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 10000;
      `,document.body.appendChild(e));const n=document.getElementById(this._menuId);n&&n.remove();const o=document.createElement("div");o.id=this._menuId,o.style.cssText=`
      position: absolute;
      top: 0;
      left: 0;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      min-width: 180px;
      display: none;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      box-sizing: border-box;
      pointer-events: auto;
    `,o.innerHTML=`
      <style>
        .menu-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--color-on-surface, #222);
          font-size: 0.95rem;
          font-family: var(--font-family-base, system-ui, sans-serif);
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          transition: background 0.15s ease;
          box-sizing: border-box;
          text-decoration: none;
          display: flex;
          align-items: center;
        }

        .menu-item:hover {
          background: var(--color-surface-hover, #f5f5f5);
        }

        .menu-item labs-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
      </style>
      ${this._apps.map(i=>`
        <a href="${t}${i.path}" class="menu-item" target="_blank">
          <labs-icon name="${i.icon}" width="20" height="20"></labs-icon>
          <span>${i.name}</span>
        </a>
      `).join("")}
    `,e.appendChild(o),this._portaledMenu=o,o.querySelectorAll(".menu-item").forEach(i=>{i.addEventListener("click",()=>{this._closeMenu()})})}_positionPortaledMenu(){if(!this._portaledMenu)return;const t=this.shadowRoot.getElementById("trigger");if(!t)return;const e=t.getBoundingClientRect(),n=this._portaledMenu,o=n.style.display;n.style.display="flex";const i=n.getBoundingClientRect();n.style.display=o;const a=window.innerWidth,l=window.innerHeight-e.bottom,r=e.top;let s=e.left;s+i.width>a&&(s=a-i.width-8);let d=l>=i.height||l>=r?e.bottom+4:e.top-i.height-4;n.style.left=`${s}px`,n.style.top=`${d}px`}}customElements.define("labs-apps-selector",c);
