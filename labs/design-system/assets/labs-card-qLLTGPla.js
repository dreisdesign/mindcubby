class e extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.render()}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin: 0 auto;
          background: var(--color-surface, #fff);
          border-radius: var(--radius-card, 0.5rem);
          box-shadow: var(--labs-card-shadow, 0 6px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04));
          padding: var(--labs-card-padding, 20px 18px);
          font-family: var(--font-family-base, system-ui, sans-serif);
          position: relative;
        }
        :host([variant="welcome"]) {
          text-align: center;
        }
        .header-row {
          display:flex;
          align-items:center;
          justify-content:space-between;
        }
        :host([variant="welcome"]) .header-row {
          justify-content: center;
        }
        .header {
          margin: 0;
          font-size: var(--font-size-h3, 1.25rem);
          font-weight: var(--font-weight-card-header, 600);
          line-height: var(--line-height-card-header, 1.2);
          color: var(--color-on-background, inherit);
          flex: 1;
        }
        :host([variant="welcome"]) .header {
          width: 100%;
        }
        .description {
          margin-top: 8px;
          color: var(--color-on-surface-muted, #666);
          font-size: var(--font-size-base, 1rem);
        }
        .input-row { margin-top: 14px; }
        .actions { display: flex; gap: 10px; margin-top: 16px; justify-content: center; }
        :host([variant="welcome"]) .actions {
          justify-content: flex-end;
        }
        ::slotted([slot="header"]) { font-size: inherit; font-weight: inherit; }
        ::slotted([slot="close"]) { margin-left: 8px; }
        ::slotted([slot="description"]) { margin-top: 8px; color: var(--color-on-surface-muted, #666); font-size: var(--font-size-base, 1rem); }
        ::slotted([slot="input"]) { margin-top: 14px; display: block; font-size: var(--font-size-base, 1rem); }
        ::slotted([slot="actions"]) { display: flex; gap: 10px; margin-top: 16px; justify-content: center; }
      </style>
      <div class="header-row">
        <div class="header"><slot name="header"></slot></div>
        <slot name="close"></slot>
      </div>
      <slot name="description"></slot>
      <slot name="input"></slot>
      <slot name="actions"></slot>
    `}}customElements.define("labs-card",e);
