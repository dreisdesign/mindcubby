class n extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._id=this.getAttribute("data-id")||`item-${Math.random().toString(36).slice(2,9)}`,this._value=this.getAttribute("value")||this.textContent||"",this._timestamp=this.getAttribute("timestamp")||null,this._date=this.getAttribute("date")||null,this._checked=this.hasAttribute("checked"),this._slotChangeHandler=this._onSlotChange.bind(this),this.render()}connectedCallback(){this.render(),this.addEventListener("change",e=>{if(e.target&&e.target.matches&&e.target.matches("labs-checkbox")){const t=e.detail&&!!e.detail.checked;this._checked=t,this._checked?this.setAttribute("checked",""):this.removeAttribute("checked"),this.dispatchEvent(new CustomEvent("toggle",{detail:{checked:this._checked,id:this._id},bubbles:!0,composed:!0})),this.render()}}),this._updateMobileAlignment(),window.addEventListener("resize",()=>this._updateMobileAlignment());const i=this.shadowRoot?.querySelector(".row");i&&["dragstart","drag","dragend","dragover","dragleave","drop"].forEach(e=>{i.addEventListener(e,t=>{this.dispatchEvent(new DragEvent(t.type,{bubbles:!0,cancelable:!0,dataTransfer:t.dataTransfer,clientX:t.clientX,clientY:t.clientY}))})})}_updateMobileAlignment(){const i=window.innerWidth<=640,e=this.shadowRoot?.querySelector(".text");e&&this.getAttribute("variant")==="text-only"&&(e.style.textAlign=i?"left":"center")}static get observedAttributes(){return["value","checked","archived","restored","timestamp","date","variant","state","draggable"]}attributeChangedCallback(i,e,t){i==="value"&&(this._value=t),i==="timestamp"&&(this._timestamp=t),i==="date"&&(this._date=t),i==="checked"&&(this._checked=this.hasAttribute("checked")),i==="variant"&&(this.shadowRoot.innerHTML=""),i==="state"&&this.render(),i==="variant"&&this._updateMobileAlignment(),this.render()}_onSlotChange(){this.render()}render(){const i=this.shadowRoot.getElementById("archivedBadgeContainer");i&&!i.textContent.trim()?i.style.display="none":i&&(i.style.display=""),this.shadowRoot.innerHTML||(this.shadowRoot.innerHTML=`
        <style>
          :host { display: block; width: 100%; font-family: var(--font-family-base, system-ui, sans-serif); }
          :host([state="archived"]) {
            opacity: 0.5;
            pointer-events: auto;
          }
          /* Drag-drop states for reorderable lists */
          :host([draggable]) .row { cursor: grab; transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1); }
          :host([draggable]:active) .row { cursor: grabbing; }
          :host([dragging]) .row { 
            opacity: 0.5; 
            transform: scale(0.98);
            background: var(--color-surface-variant, #f5f5f5);
          }
          :host([drag-over]) .row { 
            background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
            border-color: var(--color-primary, #6200ea);
            box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
          }
          .row { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:var(--radius-xl, 16px); background:var(--color-surface, #fff); border:1px solid color-mix(in srgb,var(--color-on-surface) 6%,transparent); width:100%; box-sizing:border-box; min-width:0; min-height:60px; overflow: hidden; }
          .text { flex:1; font-size:1rem; color:var(--color-on-surface, #111); word-break:break-word; min-width:0; text-align: var(--list-item-text-align, left); }
          .timestamp { font-size:0.75rem; color:var(--color-on-surface-variant, #666); margin-left:6px; }
          .badge { font-size:0.625rem; padding:4px 8px; border-radius:var(--radius-badge, 9999px); background:var(--color-surface-secondary, #f1f3f4); color:var(--color-on-surface); margin-left:8px; }
          .actions { display:flex; gap:8px; align-items:center; flex: 0 0 auto; min-width:40px; min-height:32px; }
          ::slotted([slot="control"]) {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            min-height: 32px;
            padding: 0 2px;
          }
          ::slotted([slot="actions"]) {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            min-height: 32px;
            padding: 0 2px;
          }
          /* Control slot SVG: container may be up to 40px wide; icon should not exceed 20px height */
          ::slotted([slot="control"] svg) {
            display: block;
            margin: auto;
            max-width: 40px !important;
            max-height: 20px !important;
            width: auto !important;
            height: auto !important;
          }
          /* Ensure timestamp variant also constrains control/label icons to match the checkbox sizing */
          :host([variant="timestamp"]) ::slotted([slot="control"]),
          :host([variant="timestamp"]) ::slotted([slot="label"]) {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            min-height: 32px;
            padding: 0 2px;
          }
          :host([variant="timestamp"]) ::slotted([slot="control"] svg),
          :host([variant="timestamp"]) ::slotted([slot="label"] svg) {
            display: block;
            margin: auto;
            max-width: 40px !important;
            max-height: 20px !important;
            width: auto !important;
            height: auto !important;
          }
          labs-button[variant="icon"] { --icon-size:20px; }
          .secondary-variant { background: var(--color-surface-secondary, #f6f7f8); }
          :host([variant="text-only"]) .row { padding: 8px 12px; min-height: 60px; }
          :host([variant="timestamp"]) .row { padding: 8px 12px; min-height: 60px; }
          :host([variant="text-only"]) .row:has(:not([slot="actions"])) .text {
            margin-right: auto;
            margin-left: auto;
            text-align: var(--list-item-text-align, center);
          }
          :host([variant="text-only"]) .text {
            font-weight: var(--font-weight-semibold, 600);
          }
          :host([variant="text-only"]) .timestamp { margin-left: 0; margin-top: 2px; font-size: 0.75rem; }
          :host([variant="text-only"]) ::slotted([slot="control"]),
          :host([variant="text-only"]) ::slotted([slot="actions"]) {
            padding: 0 1px;
          }
          /* Enforced constraints already applied above for control SVG */
          /* Style for a slotted primary label (timestamp) when present */
          .labelHost { font-size: 0.95rem; color: var(--color-on-surface, #111); margin-right: 12px; white-space: nowrap; flex: 0 0 auto; }
          ::slotted(.item-label) {
            font-size: 0.95rem;
            color: var(--color-on-surface-variant, #666);
            margin-right: 12px;
            white-space: nowrap;
            flex: 0 0 auto;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 140px;
          }
          /* Constrain timestamp label text so it doesn't overflow the row */
          :host([variant="timestamp"]) ::slotted([slot="label"]) {
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 0 0 auto;
          }
        </style>
        <div class="row" role="listitem" data-id="${this._id}">
          <slot name="control"></slot>
          <div class="text"><slot name="content"></slot></div>
          <div id="archivedBadgeContainer" aria-hidden="true"></div>
          <div class="actions" style="display:none;width:0;min-width:0;">
            <slot name="actions" onslotchange="
              const parent = this.parentElement;
              if (this.assignedNodes().length) {
                parent.style.display = 'flex';
                parent.style.minWidth = '40px';
                parent.style.width = '';
              } else {
                parent.style.display = 'none';
                parent.style.minWidth = '0';
                parent.style.width = '0';
              }
            "></slot>
          </div>
        </div>
      `,this.shadowRoot.querySelectorAll("slot").forEach(o=>o.addEventListener("slotchange",this._slotChangeHandler)));const e=this.shadowRoot.getElementById("archiveIcon"),t=this.shadowRoot.getElementById("archiveBtn"),a=this.shadowRoot.querySelector(".row");if(this.hasAttribute("restored"))e&&(e.setAttribute("name","history"),e.setAttribute("color","var(--color-on-surface)"),e.style.opacity="0.45"),t&&(t.setAttribute("aria-label","Already restored"),t.setAttribute("disabled",""),t.style.pointerEvents="none"),a&&(a.style.opacity="var(--labs-archived-opacity, 0.7)");else if(this.hasAttribute("archived")){if(e&&(e.setAttribute("name","history"),e.setAttribute("color","var(--color-on-surface)"),e.style.opacity=""),t){t.setAttribute("aria-label","Restore"),t.style.pointerEvents="",t.removeAttribute("disabled");try{t.innerHTML='<labs-icon slot="icon-left" name="history" width="20" height="20"></labs-icon> Restore',t.setAttribute("variant","secondary"),t.setAttribute("size","small")}catch{}}a&&(a.style.opacity="")}else{if(e&&(e.setAttribute("name","archive"),e.setAttribute("color","var(--color-on-surface)"),e.style.opacity=""),t){t.setAttribute("aria-label","Archive"),t.removeAttribute("disabled"),t.style.pointerEvents="";try{t.innerHTML='<labs-icon id="archiveIcon" slot="icon-left" name="archive" width="20" height="20"></labs-icon> Archive',t.setAttribute("variant","secondary"),t.setAttribute("size","small")}catch{}}a&&(a.style.opacity="",a.classList.remove("secondary-variant"))}const s=this.querySelector('[slot="actions"] #deleteBtn')||this.shadowRoot.getElementById("deleteBtn");s&&(this.hasAttribute("archived")?(s.style.display="",s.removeAttribute("aria-hidden"),s.removeAttribute("disabled")):(s.style.display="none",s.setAttribute("aria-hidden","true"),s.setAttribute("disabled","")))}_archive(){this.setAttribute("archived",""),this.dispatchEvent(new CustomEvent("archive",{detail:{value:this._value,id:this._id},bubbles:!0,composed:!0}))}_restore(){this.hasAttribute("restored")||(this.removeAttribute("archived"),this.setAttribute("restored",""),this.dispatchEvent(new CustomEvent("restore",{detail:{value:this._value,id:this._id},bubbles:!0,composed:!0})))}_remove(){this.dispatchEvent(new CustomEvent("remove",{detail:{value:this._value,id:this._id},bubbles:!0,composed:!0}))}get value(){return this._value}set value(i){this._value=i,this.setAttribute("value",i)}}customElements.get("labs-list-item")||customElements.define("labs-list-item",n);
