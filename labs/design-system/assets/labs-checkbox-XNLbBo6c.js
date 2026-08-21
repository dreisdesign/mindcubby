class e extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._checked=this.hasAttribute("checked"),this.render()}static get observedAttributes(){return["checked","inactive"]}attributeChangedCallback(t,s,c){t==="checked"&&(this._checked=this.hasAttribute("checked")),t==="inactive"&&(this._inactive=this.hasAttribute("inactive")),this._updateAria(),this.render()}connectedCallback(){this.addEventListener("click",this._onClick),this.addEventListener("keydown",this._onKeyDown),this.setAttribute("role",this.getAttribute("role")||"checkbox"),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this._updateAria()}disconnectedCallback(){this.removeEventListener("click",this._onClick),this.removeEventListener("keydown",this._onKeyDown)}_onClick=t=>{t.stopPropagation(),!this._inactive&&this.toggle()};_onKeyDown=t=>{this._inactive||(t.key===" "||t.key==="Spacebar"||t.key==="Enter")&&(t.preventDefault(),this.toggle())};toggle(){this._inactive||(this._checked=!this._checked,this._checked?this.setAttribute("checked",""):this.removeAttribute("checked"),this._updateAria(),this._checked&&(this.classList.add("checking"),setTimeout(()=>{this.classList.remove("checking")},400)),this.dispatchEvent(new CustomEvent("change",{detail:{checked:this._checked},bubbles:!0,composed:!0})),this.render())}_updateAria(){this.shadowRoot&&(this.setAttribute("aria-checked",String(this._checked)),this._inactive?(this.setAttribute("aria-disabled","true"),this.setAttribute("tabindex","-1")):(this.removeAttribute("aria-disabled"),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0")))}render(){const t=this._checked?"check_box":"check_box_outline_blank";this.shadowRoot.innerHTML=`
      <style>
        :host { display: inline-flex; align-items:center; }
        :host([inactive]) { opacity: 0.6; }
        :host([inactive]) { pointer-events: none; }
        ::slotted(*) { pointer-events: none; }
        
        /* Check animation */
        labs-icon {
          transition: transform 0.15s ease-out;
        }
        
        :host(.checking) labs-icon {
          animation: checkboxCheck 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }
        
        @keyframes checkboxCheck {
          0% {
            transform: scale(0.5) rotate(-15deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      </style>
      <labs-button variant="icon" aria-hidden="true" tabindex="-1">
        <labs-icon slot="icon-left" name="${t}" width="20" height="20"></labs-icon>
      </labs-button>
      <slot style="display:none"></slot>
    `}}customElements.get("labs-checkbox")||customElements.define("labs-checkbox",e);
