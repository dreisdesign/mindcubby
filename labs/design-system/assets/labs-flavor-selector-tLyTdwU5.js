class d extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._open=!1,this._menuId=`labs-flavor-menu-${Math.random().toString(36).slice(2,8)}`,this._flavors=["vanilla","blueberry","strawberry"],this._observer=null,this._portaledMenu=null,this.render()}static get observedAttributes(){return["open"]}connectedCallback(){const e=document.documentElement;this._observer=new MutationObserver(()=>{this.render()}),this._observer.observe(e,{attributes:!0,attributeFilter:["class"]}),document.addEventListener("click",this._outsideClick=t=>{if(!this._open)return;const o=t.composedPath?t.composedPath():t.path||[];!o.includes(this)&&!o.includes(this.shadowRoot)&&this._closeMenu()})}disconnectedCallback(){this._observer&&(this._observer.disconnect(),this._observer=null),document.removeEventListener("click",this._outsideClick)}attributeChangedCallback(e,t,o){e==="open"&&(this._open=this.hasAttribute("open"),this.render())}get open(){return this._open}set open(e){e?this.setAttribute("open",""):this.removeAttribute("open")}_getCurrentFlavor(){const e=[...document.documentElement.classList].find(t=>t.startsWith("flavor-"));return e?e.replace("flavor-",""):"vanilla"}_getFlavorLabel(e){return e.split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}_openMenu(){this.setAttribute("open","")}_closeMenu(){this.removeAttribute("open")}_setFlavor(e){const t=document.documentElement,o=document.body;for(const s of this._flavors)t.classList.remove(`flavor-${s}`),o.classList.remove(`flavor-${s}`);t.classList.add(`flavor-${e}`),o.classList.add(`flavor-${e}`);try{localStorage.setItem("tracker-flavor",e);const s=[...t.classList].find(r=>r.startsWith("theme-")),n=s?s.replace("theme-",""):"light";localStorage.setItem("tracker-theme",n)}catch{}this.dispatchEvent(new CustomEvent("flavor-changed",{detail:{flavor:e},bubbles:!0,composed:!0})),this._closeMenu(),this.render()}render(){const e=this._getCurrentFlavor(),t=this._getFlavorLabel(e);this.shadowRoot.innerHTML=`
      <style>
        :host { display: block; }
        labs-button { width: 100%; }
      </style>
      <div class="trigger">
        <labs-button id="trigger" variant="secondary" size="large" style="gap: 10px; justify-content: flex-start; width: 100%;">
          <labs-icon name="colors" slot="icon-left" width="20" height="20"></labs-icon>
          ${t}
        </labs-button>
      </div>
    `,this._createPortaledMenu();const o=this.shadowRoot.getElementById("trigger");o&&o.addEventListener("click",()=>{this._open?this._closeMenu():this._openMenu()}),this._open?this._portaledMenu&&(this._portaledMenu.style.display="flex",this._positionPortaledMenu()):this._portaledMenu&&(this._portaledMenu.style.display="none")}_createPortaledMenu(){let e=document.getElementById("labs-flavor-selector-portal");e||(e=document.createElement("div"),e.id="labs-flavor-selector-portal",e.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 10000;
      `,document.body.appendChild(e));const t=document.getElementById(this._menuId);t&&t.remove();const o=this._getCurrentFlavor(),s=document.createElement("div");s.id=this._menuId,s.style.cssText=`
      position: absolute;
      top: 0;
      left: 0;
      background: var(--color-surface, #fff);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      min-width: 160px;
      display: none;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      box-sizing: border-box;
      pointer-events: auto;
    `,s.innerHTML=`
      <style>
        .menu-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--color-on-surface, #222);
          font-size: 0.95rem;
          font-family: var(--font-family-base, system-ui, sans-serif);
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          transition: background 0.15s ease;
          box-sizing: border-box;
        }

        .menu-item:hover {
          background: var(--color-surface-hover, #f5f5f5);
        }

        .menu-item.active {
          background: var(--color-primary-container, #e8f0ff);
          color: var(--color-primary, #0066cc);
          font-weight: 600;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          font-size: 1rem;
        }
      </style>
      ${this._flavors.map(n=>`
        <button
          class="menu-item ${n===o?"active":""}"
          data-flavor="${n}"
        >
          <span>${this._getFlavorLabel(n)}</span>
          ${n===o?'<span class="checkmark">✓</span>':""}
        </button>
      `).join("")}
    `,e.appendChild(s),this._portaledMenu=s,s.querySelectorAll(".menu-item").forEach(n=>{n.addEventListener("click",()=>{const r=n.getAttribute("data-flavor");r&&this._setFlavor(r)})})}_positionPortaledMenu(){if(!this._portaledMenu)return;const e=this.shadowRoot.getElementById("trigger");if(!e)return;const t=e.getBoundingClientRect(),o=this._portaledMenu,s=o.style.display;o.style.display="flex";const n=o.getBoundingClientRect();o.style.display=s;const r=window.innerWidth,a=window.innerHeight-t.bottom,l=t.top;let i=t.left;i+n.width>r&&(i=r-n.width-8);let c=a>=n.height||a>=l?t.bottom+4:t.top-n.height-4;o.style.left=`${i}px`,o.style.top=`${c}px`}}customElements.define("labs-flavor-selector",d);
