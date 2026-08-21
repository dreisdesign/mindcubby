const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./iframe-BY8OoYG6.js","./preload-helper-PPVm8Dsz.js","./iframe-C449oE3-.css"])))=>i.map(i=>d[i]);
import{_ as p}from"./preload-helper-PPVm8Dsz.js";class v extends HTMLElement{static get observedAttributes(){return["hide-reset"]}constructor(){super(),this.attachShadow({mode:"open"}),this.render()}attributeChangedCallback(i,d,u){i==="hide-reset"&&this.render()}get hideReset(){return this.hasAttribute("hide-reset")}set hideReset(i){i?this.setAttribute("hide-reset",""):this.removeAttribute("hide-reset")}render(){const i=this.hideReset;this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          max-width: 340px;
          margin: 0 auto;
          background: var(--color-surface, #fff);
          border-radius: var(--radius-xl, 16px);
          box-shadow: 0 4px 32px rgba(0,0,0,0.10), 0 1.5px 4px rgba(0,0,0,0.04);
          padding: 28px 24px 20px 24px;
          font-family: var(--font-family-base, system-ui, sans-serif);
          position: relative;
          /*
            Modular override: ensure secondary button borders match text/icon color for visual consistency
            - --color-outline is set to var(--color-on-surface) so secondary button borders always match the text and icon color in this context.
            - This override is local to the settings card, preserving modularity and reusability of the button component.
            - No global override is used; other usages of secondary buttons are unaffected.
            - No box-shadow is applied to secondary buttons in this context for clarity.
          */
          --color-outline: var(--color-on-surface);
        }
        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .close-btn {
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border-radius: var(--radius-full, 9999px);
          position: static;
          background: inherit;
          box-shadow: none;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.10s cubic-bezier(.4,2,.6,1), color 0.10s cubic-bezier(.4,2,.6,1);
        }
        :host {
          background: var(--color-surface, #fff);
        }
        :host-context(.theme-dark) .close-btn {
          background: var(--color-surface, #181a1b);
        }
        :host-context(.theme-dark) .close-btn:hover,
        :host-context(.theme-dark) .close-btn:focus-visible {
          background: var(--color-surface-hover, #23272a);
        }
        :host-context(.theme-light) .close-btn {
          background: var(--color-surface, #fff);
        }
        :host-context(.theme-light) .close-btn:hover,
        :host-context(.theme-light) .close-btn:focus-visible {
          background: var(--color-surface-hover, #f5f5f5);
        }
        .close-btn:hover,
        .close-btn:focus-visible {
          color: var(--color-on-surface, #222);
        }
        .close-btn labs-icon {
          --icon-size: 28px;
        }
        h3 {
          margin: 0;
          font-size: 1.18rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        /* Layout for appearance slot: ensure buttons inside are stacked with spacing */
        .settings-list #appearance-btn-slot {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .settings-list labs-button {
          width: 100%;
          box-sizing: border-box;
          /* Remove any box-shadow for secondary buttons in settings card context */
        }
        .settings-list labs-button[variant="secondary"] button {
          box-shadow: none !important;
        }
        .settings-actions {
          display: none;
        }
        /* Icon hover animation for settings icon in icon-only button */
        labs-button[variant="icon"] labs-icon[name="settings"] {
          transition: transform 0.3s cubic-bezier(.4,2,.6,1);
        }
        labs-button[variant="icon"]:hover labs-icon[name="settings"] {
          transform: rotate(180deg);
        }
        /* Fix icon color in destructive buttons: ensure icon inherits semantic error color */
        labs-button[variant="destructive"] labs-icon,
        labs-button[variant="destructive"] ::slotted(labs-icon) {
          color: var(--color-on-error, #fff);
        }
        /*
          Modular override pattern:
          - --color-outline is set only in the settings card context for visible secondary button borders.
          - No global override; this ensures modularity and reusability.
          - No box-shadow for secondary buttons in this context for visual clarity.
        */
  </style>
      <div class="header-row">
        <h3>Settings</h3>
        <labs-button id="icon-close-btn" class="close-btn" variant="icon" aria-label="Close">
          <labs-icon name="close" slot="icon-left" width="28" height="28"></labs-icon>
        </labs-button>
      </div>
      <div class="settings-list">
        <labs-button id="all-apps-btn" variant="secondary" size="large" style="gap:10px;">
          <labs-icon name="apps" slot="icon-left"></labs-icon>
          All Apps
        </labs-button>
        <div id="appearance-btn-slot"></div>
        <labs-button id="simulate-next-btn" variant="secondary" size="large" style="gap:10px; display:none;">
          <labs-icon name="add" slot="icon-left" width="20" height="20"></labs-icon>
          Simulate Next Day
        </labs-button>
        ${i?"":`
        <labs-button id="reset-all-btn" variant="destructive" size="large" style="gap:10px;">
          <labs-icon name="delete" slot="icon-left" width="20" height="20" color="var(--color-on-error)"></labs-icon>
          Reset All Data
        </labs-button>
        `}
      </div>
    `;const d=this.shadowRoot.getElementById("icon-close-btn");d&&d.addEventListener("click",()=>{this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))});const u=this.shadowRoot.getElementById("all-apps-btn");if(u){const e="http://localhost:8000/",a="/labs/",h=typeof window<"u"&&window.location&&(window.location.hostname.includes("localhost")||window.location.hostname==="127.0.0.1"),r=async()=>{if(!h){window.open(a,"_blank");return}const n=new AbortController,t=setTimeout(()=>n.abort(),600);try{await fetch(e,{mode:"no-cors",signal:n.signal}),window.open(e,"_blank")}catch{window.open(a,"_blank")}finally{clearTimeout(t)}};u.addEventListener("click",n=>{n.preventDefault(),r()})}const b=this.shadowRoot.getElementById("appearance-btn-slot");if(b){let a=function(){const t=document.documentElement.classList.contains("theme-dark");for(;e.firstChild;)e.removeChild(e.firstChild);const o=document.createElement("labs-icon");o.setAttribute("slot","icon-left"),o.setAttribute("name",t?"bedtime_off":"bedtime"),e.appendChild(o),e.appendChild(document.createTextNode(t?"Turn on light mode":"Turn on dark mode"))};const e=document.createElement("labs-button");e.setAttribute("variant","secondary"),e.setAttribute("size","large"),e.style.width="100%",e.style.justifyContent="flex-start",e.style.margin="0",e.style.position="static",e.id="theme-toggle-btn",e.onclick=()=>{const t=document.documentElement.classList.contains("theme-dark"),o=document.documentElement,m=Array.from(o.classList).find(l=>l.startsWith("flavor-")),c=m?m.replace("flavor-",""):"vanilla",s=t?"light":"dark";p(async()=>{const{applyTheme:l}=await import("./iframe-BY8OoYG6.js").then(f=>f.t);return{applyTheme:l}},__vite__mapDeps([0,1,2]),import.meta.url).then(({applyTheme:l})=>{l({flavor:c,theme:s});try{localStorage.setItem("tracker-theme",s),localStorage.setItem("tracker-flavor",c)}catch{}a()})};const h=new MutationObserver(()=>a());try{h.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]})}catch{}a(),b.appendChild(e),p(()=>import("./labs-flavor-button-D9aMHAuY.js"),[],import.meta.url).then(()=>{const t=document.createElement("labs-flavor-button"),o=Array.from(document.documentElement.classList).find(s=>s&&s.startsWith("flavor-")),c=(o?o.replace("flavor-",""):"blueberry").split("-").map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(" ");t.setAttribute("label",c),this.shadowRoot.getElementById("flavor-btn")||b.appendChild(t),t.addEventListener("cycle-flavor",s=>{this.dispatchEvent(new CustomEvent("flavor-changed",{detail:s.detail,bubbles:!0,composed:!0}))})}).catch(()=>{});const r=this.shadowRoot.getElementById("reset-all-btn");r&&r.addEventListener("click",t=>{if(r.hasAttribute("disabled")){t.preventDefault(),t.stopPropagation();return}t.preventDefault(),window.confirm("Warning: This will delete all entries. Are you sure you want to continue?")&&(this.dispatchEvent(new CustomEvent("reset-all",{bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0})))});const n=this.shadowRoot.getElementById("simulate-next-btn");if(n){try{const t=new URL(window.location.href),o=t.searchParams.get("simulate")||t.searchParams.get("simulateNext");(o==="1"||o==="true")&&(n.style.display="")}catch{}n.addEventListener("click",t=>{t.preventDefault(),this.dispatchEvent(new CustomEvent("simulate-next-day",{bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))})}}}}customElements.define("labs-settings-card",v);
