

class LabsButton extends HTMLElement {

  static get observedAttributes() {
    return ['disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    console.log('[labs-button] connectedCallback');
    // Force a re-render after initial connection to catch late style application
    setTimeout(() => this.render(), 0);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'disabled') {
      this.updateDisabledState();
    }
  }

  /**
   * Plays a completion animation on the button.
   * Useful for visual feedback when a task is completed.
   * @param {string} type - Animation type: 'success' (default), 'created', or 'custom'
   * @param {number} duration - Animation duration in milliseconds (default: 600)
   */
  animate(type = 'success', duration = 600) {
    const button = this.shadowRoot?.querySelector('button');
    if (!button) return;

    // Create keyframes based on animation type
    const keyframes = {
      success: [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0.95)', opacity: 1, offset: 0.85 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      created: [
        { transform: 'scale(0.8) rotate(-5deg)', opacity: 0 },
        { transform: 'scale(1.05) rotate(5deg)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1 }
      ],
      pulse: [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.15)', opacity: 0.8, offset: 0.5 },
        { transform: 'scale(1)', opacity: 1 }
      ]
    };

    const animationKeyframes = keyframes[type] || keyframes.success;

    // Play animation
    button.animate(animationKeyframes, {
      duration,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards'
    });
  }

  updateDisabledState() {
    const button = this.shadowRoot?.querySelector('button');
    if (button) {
      if (this.hasAttribute('disabled')) {
        button.setAttribute('disabled', '');
      } else {
        button.removeAttribute('disabled');
      }
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Transparent variant: no fill, no stroke, no hover/focus background */
        :host([variant="transparent"]) button {
          background: none !important;
          color: inherit !important;
          border: none !important;
          box-shadow: none !important;
        }
        :host([variant="transparent"]) button:hover,
        :host([variant="transparent"]) button:focus-visible {
          background: none !important;
          box-shadow: none !important;
        }
        :host {
          /* component-local token defaults */
          --button-padding: 0.5em 1.25em;
          --button-radius: 6px;
          --button-shadow: 0 1px 2px rgba(0,0,0,0.04);
          --button-focus: 0 0 0 2px rgba(147,197,253,0.6);
          /* Use typography tokens for font size, weight, and line height */
          --button-font: var(--font-weight-button, 600) var(--font-size-button, 1rem)/var(--line-height-button, 1.2) var(--font-family-base, system-ui, sans-serif);
          --button-icon-padding: 0.5em;
          --button-icon-size: 1.25em;

          display: inline-block;
        }
        :host([fullwidth]) {
          display: block !important;
          width: 100% !important;
        }
        :host([fullwidth]) button {
          display: flex !important;
          width: 100% !important;
          justify-content: center;
        }
        /* Size variants: default is medium, add large variant via attribute size="large" */
        /* Small size — tighter padding and smaller font */
        :host([size="small"]) {
          --button-padding: 0.375em 0.75em;
          --button-font: var(--font-weight-button, 600) var(--font-size-button-small, 0.875rem)/var(--line-height-button, 1.2) var(--font-family-base, system-ui, sans-serif);
          --button-radius: 8px;
        }

        :host([size="large"]) {
          --button-padding: 0.75em 1.5em;
          --button-font: var(--font-weight-button, 600) var(--font-size-button-large, 1.125rem)/var(--line-height-button, 1.2) var(--font-family-base, system-ui, sans-serif);
          --button-radius: 10px;
          --button-shadow: 0 6px 18px rgba(0,0,0,0.08);
        }
  /* Pill shape support: set a very large radius when 'pill' attribute present */
        :host([pill]) {
          --button-radius: 999px;
        }
        button {
          /* Provide component-scoped color fallbacks so globals stay tiny */
          --button-focus: var(--button-focus, 0 0 0 2px var(--color-primary, #93c5fd));
          --button-icon-only-hover-bg: var(--button-icon-only-hover-bg, var(--color-hover-light, #f1f5f9));
        }
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5em;
          font: var(--button-font, 600 20px/1.2 system-ui, sans-serif);
          background: var(--color-primary);
          color: var(--color-on-primary);
          border: none;
          border-radius: var(--radius-button, 9999px);
          padding: var(--button-padding, 0.5em 1.25em);
          cursor: pointer;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.1s;
          box-shadow: var(--button-shadow, 0 1px 2px rgba(0,0,0,0.04));
          outline: none;
          min-width: fit-content;
          min-height: 2.5em;
        }
        /* Click animation - scale down slightly */
        button:active {
          transform: scale(0.95);
        }
        button:focus-visible {
          box-shadow: 0 0 0 2px var(--button-focus);
        }
        
        /* Disabled state - reduced opacity, no pointer, no interactions */
        :host([disabled]) button,
        button[disabled] {
          opacity: 0.5;
          cursor: default;
          pointer-events: none;
        }
        
        /* Hover effects for primary variant */
        button:hover {
          background: color-mix(in srgb, var(--color-primary) 85%, black);
        }
        /* Secondary variant - no fill, outline only */
        :host([variant="secondary"]) button {
          background: transparent;
          color: var(--color-on-surface);
          border: 1px solid var(--color-outline, var(--color-primary));
        }
        :host([variant="secondary"]) button:hover {
          background: color-mix(in srgb, var(--color-primary) 6%, transparent);
        }

        /* Secondary with left icon (same as secondary but left-aligned content) */
        :host([variant="secondary-left"]) button {
          background: transparent;
          color: var(--color-on-surface);
          border: 1px solid var(--color-outline, var(--color-primary));
          justify-content: flex-start;
          padding-left: 1rem;
        }

        /* Destructive/danger variants - solid error color with white text (token-driven)
           Accept both destructive and the legacy danger name so stories and configs
           that use variant="danger" continue to render as intended. Also style
           container-danger to match container destructive buttons. */
        :host([variant="destructive"]) button,
        :host([variant="danger"]) button,
        :host([variant="container-danger"]) button {
          background: var(--color-error, #b5005a);
          color: var(--on-error, #ffffff);
          border: none;
        }
        :host([variant="destructive"]) button:hover,
        :host([variant="danger"]) button:hover,
        :host([variant="container-danger"]) button:hover {
          background: color-mix(in srgb, var(--color-error, #b5005a) 90%, black);
        }

        /* Alias: primary-right-icon variant - same as primary but right-icon emphasized */
        :host([variant="primary-right-icon"]) button {
          /* keep primary styling; this alias exists for story names and clarity */
        }

        /* Full-width container-danger (maps to destructive styling for container buttons) */
        :host([variant="container-danger"]) button {
          background: var(--color-error);
          color: var(--on-error, #fff);
          border: none;
        }
      /* Icon-only variant — use color-on-surface for consistent icon color across all contexts */
      :host([variant="icon"]) button {
       background: none;
       /* Use --color-on-surface as primary color so icon-only buttons (including checkboxes)
          have consistent color. This ensures checkboxes match the surface text color. */
       color: var(--color-on-surface, #333);
          border: none;
          padding: var(--button-icon-padding, 0.5em);
          min-width: fit-content;
          min-height: 2.5em;
          width: 2.5em;
          height: 2.5em;
          border-radius: var(--radius-full, 9999px);
          box-shadow: none;
          aspect-ratio: 1 / 1;
        }
        :host([variant="icon"]) button:hover,
        :host([variant="icon"]) button:focus-visible {
          background: var(--button-icon-only-hover-bg);
        }
        /* Icon sizing */
        ::slotted([slot="icon-left"]),
        ::slotted([slot="icon-right"]) {
          display: inline-flex;
          align-items: center;
          font-size: var(--button-icon-size, 1.25em);
          margin: 0 !important;
          vertical-align: middle !important;
        }
        /* Make slotted icons inherit the host/button color so they follow tokens/currentColor */
        ::slotted([slot="icon-left"]) labs-icon,
        ::slotted([slot="icon-right"]) labs-icon,
        ::slotted([slot="icon-left"]) svg,
        ::slotted([slot="icon-right"]) svg {
          color: inherit !important;
          fill: currentColor !important;
          stroke: currentColor !important;
        }
        /* Default slot label alignment */
        ::slotted(:not([slot])) {
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
          line-height: 1;
        }
        /* Hide label for icon-only */
        :host([variant="icon"]) ::slotted(:not([slot])) {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0,0,0,0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }

        /* Responsive collapse: allow callers to mark the button to collapse its label
           at small viewport widths by setting data-collapse="small" on the host. */
        @media (max-width: 700px) {
          :host([data-collapse~="small"]) ::slotted(:not([slot])) {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0,0,0,0) !important;
            white-space: nowrap !important;
            border: 0 !important;
          }

          :host([data-collapse~="small"]) button {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            min-width: fit-content;
            width: auto;
          }
        }
      </style>
      <button part="button">
        <slot name="icon-left"></slot>
        <slot></slot>
        <slot name="icon-right"></slot>
      </button>
    `;

    // Update disabled state after render
    this.updateDisabledState();
  }
}

customElements.define('labs-button', LabsButton);
