import"./labs-card-CpkpHeMq.js";const r=document.createElement("template");r.innerHTML=`
  <style>
    :host {
      display: block;
      border-radius: var(--radius-lg, 8px);
      background: var(--color-surface, #fff);
      border: 1px solid color-mix(in srgb, var(--color-on-surface) 6%, transparent);
      box-shadow: var(--card-elevation, none);
      padding: var(--space-lg, 1.5rem);
      text-align: center;
    }
    
    .metric-label {
      font-size: var(--font-size-metric-label, 0.875rem);
      font-weight: var(--font-weight-metric, 800);
      line-height: var(--line-height-metric, 1.2);
      color: var(--color-on-surface-variant, #666);
      margin-bottom: var(--space-xs, 4px);
      text-transform: uppercase;
    }
    
    .metric-value {
      font-size: var(--font-size-metric-display, 2rem);
      font-weight: var(--font-weight-metric, 800);
      line-height: var(--line-height-metric, 1.2);
      color: var(--color-primary, #007acc);
    }
  </style>

  <labs-card variant="metric">
    <div class="metric-container">
      <div class="metric-label"><slot name="label">Label</slot></div>
      <div class="metric-value"><slot name="value">0</slot></div>
    </div>
  </labs-card>
`;class a extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.render()}static get observedAttributes(){return["label","value"]}attributeChangedCallback(){this.render()}connectedCallback(){this.render()}render(){const e=this.getAttribute("label")||"",t=this.getAttribute("value")||"";this.shadowRoot.innerHTML=`
        <style>
          :host {
            display: block;
            border-radius: var(--radius-lg, 8px);
            background: var(--color-surface, #fff);
            box-shadow: var(--card-elevation, none);
            padding: var(--space-lg, 1.5rem);
            text-align: center;
            border: 1px solid color-mix(in srgb, var(--color-on-surface) 6%, transparent);
          }
          
          .metric-label {
            font-size: var(--font-size-metric-label, 0.875rem);
            font-weight: var(--font-weight-metric, 800);
            line-height: var(--line-height-metric, 1.2);
            color: var(--color-on-surface-variant, var(--color-on-surface, #666));
            margin-bottom: var(--space-xs, 4px);
            text-transform: uppercase;
          }
          
          .metric-value {
            font-size: var(--font-size-metric-display, 2rem);
            font-weight: var(--font-weight-metric, 800);
            line-height: var(--line-height-metric, 1.2);
            color: var(--color-on-surface, #fff);
          }
          
          ::slotted([slot="label"]) {
            display: block;
            font-size: var(--font-size-metric-label, 0.875rem);
            font-weight: var(--font-weight-metric, 800);
            line-height: var(--line-height-metric, 1.2);
            color: var(--color-on-surface-variant, var(--color-on-surface, #666));
            margin-bottom: var(--space-xs, 4px);
            text-transform: uppercase;
          }
          
          ::slotted([slot="value"]) {
            display: block;
            font-size: var(--font-size-metric-display, 2rem);
            font-weight: var(--font-weight-metric, 800);
            line-height: var(--line-height-metric, 1.2);
            color: var(--color-on-surface, #fff);
          }
        </style>
        ${e?`<div class="metric-label">${e}</div>`:'<slot name="label"></slot>'}
        ${t?`<div class="metric-value">${t}</div>`:'<slot name="value"></slot>'}
      `}}customElements.get("labs-metric-card")||customElements.define("labs-metric-card",a);
