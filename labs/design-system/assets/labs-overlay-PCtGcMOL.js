class a extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._isOpen=!1,this._render(),this._setupEventListeners()}_render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }

        :host([open]) {
          display: flex;
        }

        .overlay-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          cursor: pointer;
        }

        .overlay-content {
          position: relative;
          background: var(--color-surface, #ffffff);
          color: var(--color-on-surface, #1b1c1f);
          font-family: var(--font-family-base, system-ui, sans-serif);
          font-size: var(--font-size-overlay, 1rem);
          line-height: var(--line-height-overlay, 1.5);
          border-radius: var(--radius-xl, 16px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          max-width: 90vw;
          min-width: 320px;
          width: auto;
          box-sizing: border-box;
          max-height: 90vh;
          overflow: auto;
          transform: scale(0.95);
          opacity: 0;
          transition: all 0.2s ease;
          z-index: 1;
        }

        /* Transparent mode - no background/styling when wrapping styled components */
        :host([transparent]) .overlay-content {
          background: transparent;
          box-shadow: none;
          border-radius: var(--radius-none, 0);
          max-height: 95vh;
        }

        :host([open]) .overlay-content {
          transform: scale(1);
          opacity: 1;
        }

        /* Variants */
        :host([size="small"]) .overlay-content {
          max-width: 400px;
        }

        :host([size="medium"]) .overlay-content {
          max-width: 600px;
        }

        :host([size="large"]) .overlay-content {
          max-width: 800px;
        }

        :host([size="full"]) .overlay-content {
          max-width: 95vw;
          max-height: 95vh;
        }

        /* Disable backdrop blur if not supported */
        @supports not (backdrop-filter: blur(8px)) {
          .overlay-backdrop {
            background: rgba(0, 0, 0, 0.6);
          }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          :host {
            padding: 16px;
          }

          .overlay-content {
            border-radius: var(--radius-lg, 8px);
            max-width: 100%;
          }

          :host([size="full"]) .overlay-content {
            max-width: 100%;
            max-height: 100%;
            border-radius: var(--radius-none, 0);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .overlay-content {
            transition: none;
          }
        }

        /* Animation classes for JavaScript control */
        .overlay-content.entering {
          animation: overlayEnter 0.2s ease forwards;
        }

        .overlay-content.leaving {
          animation: overlayLeave 0.2s ease forwards;
        }

        @keyframes overlayEnter {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes overlayLeave {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.95);
            opacity: 0;
          }
        }
      </style>

      <div class="overlay-backdrop" part="backdrop"></div>
      <div class="overlay-content" part="content">
        <slot></slot>
      </div>
    `}_setupEventListeners(){this.shadowRoot.querySelector(".overlay-backdrop").addEventListener("click",()=>{this.getAttribute("close-on-backdrop")!=="false"&&this.close()}),this.addEventListener("keydown",t=>{t.key==="Escape"&&this.getAttribute("close-on-escape")!=="false"&&this.close()}),this.addEventListener("keydown",this._handleFocusTrap.bind(this))}_handleFocusTrap(e){if(!this._isOpen||e.key!=="Tab")return;const t=this.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),o=t[0],s=t[t.length-1];e.shiftKey&&document.activeElement===o?(e.preventDefault(),s?.focus()):!e.shiftKey&&document.activeElement===s&&(e.preventDefault(),o?.focus())}open(){this._isOpen||(this._isOpen=!0,this.setAttribute("open",""),requestAnimationFrame(()=>{this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()}),this.dispatchEvent(new CustomEvent("overlay-open",{bubbles:!0,composed:!0})))}close(){this._isOpen&&(this._isOpen=!1,this.removeAttribute("open"),this.dispatchEvent(new CustomEvent("overlay-close",{bubbles:!0,composed:!0})))}toggle(){this._isOpen?this.close():this.open()}static get observedAttributes(){return["open","size","close-on-backdrop","close-on-escape"]}attributeChangedCallback(e,t,o){e==="open"&&(this._isOpen=o!==null)}get isOpen(){return this._isOpen}}customElements.get("labs-overlay")||customElements.define("labs-overlay",a);
