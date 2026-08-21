/**
 * Expandable Card Component
 *
 * Extends labs-card with fullscreen expand/collapse functionality.
 * Perfect for editing interfaces, detail views, and modal-like experiences.
 *
 * @slot header - Card title/header
 * @slot close - Close icon/button (often contains expand/collapse button)
 * @slot description - Card description text
 * @slot input - Input field or custom input (expands to fill vertical space)
 * @slot actions - Action buttons (footer)
 *
 * @attribute expanded - Boolean attribute indicating expanded state
 * @cssprop --labs-expandable-card-max-width - Max width in normal state (default: 520px)
 * @cssprop --labs-expandable-card-min-width - Min width (default: 280px)
 * @cssprop --labs-expandable-card-padding - Card padding (default: 20px 18px)
 * @cssprop --labs-expandable-card-expanded-padding - Padding when expanded (default: 24px 32px)
 * @color-surface - Card background
 * @color-on-background - Header text color
 */
class LabsExpandableCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isExpanded = false;
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin: 0 auto;
          background: var(--color-surface, #fff);
          border-radius: var(--radius-card, 0.5rem);
          box-shadow: var(--labs-card-shadow, 0 6px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04));
          padding: var(--labs-expandable-card-padding, 20px 18px);
          font-family: var(--font-family-base, system-ui, sans-serif);
          position: relative;
          max-width: var(--labs-expandable-card-max-width, 520px);
        }

        /* Expanded state: fullscreen mode */
        :host([expanded]) {
          max-width: 100vw;
          width: 100vw;
          height: 100vh;
          padding: var(--labs-expandable-card-expanded-padding, 24px 32px);
          border-radius: 0;
          margin: 0;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }

        :host([expanded]) .wrapper {
          height: 100%;
        }

        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .header {
          margin: 0;
          font-size: var(--font-size-h3, 1.25rem);
          font-weight: var(--font-weight-card-header, 600);
          line-height: var(--line-height-card-header, 1.2);
          color: var(--color-on-background, inherit);
          flex: 1;
        }

        .description {
          margin-top: 8px;
          color: var(--color-on-surface-muted, #666);
          font-size: var(--font-size-base, 1rem);
          flex-shrink: 0;
        }

        .input-wrapper {
          margin-top: 14px;
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        :host([expanded]) .input-wrapper {
          margin-top: 20px;
          flex: 1;
          overflow: auto;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          justify-content: center;
          flex-shrink: 0;
        }

        :host([expanded]) .actions {
          margin-top: 24px;
          justify-content: flex-start;
        }

        ::slotted([slot="header"]) {
          font-size: inherit;
          font-weight: inherit;
        }

        ::slotted([slot="close"]) {
          margin-left: 8px;
          flex-shrink: 0;
        }

        ::slotted([slot="description"]) {
          margin-top: 8px;
          color: var(--color-on-surface-muted, #666);
          font-size: var(--font-size-base, 1rem);
          flex-shrink: 0;
        }

        ::slotted([slot="input"]) {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          flex: 1;
          font-size: var(--font-size-base, 1rem);
          min-height: 0;
        }

        :host([expanded]) ::slotted([slot="input"]) {
          margin-top: 20px;
          flex: 1;
          min-height: 0;
        }

        ::slotted([slot="actions"]) {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          justify-content: center;
          flex-shrink: 0;
        }

        :host([expanded]) ::slotted([slot="actions"]) {
          margin-top: 24px;
          justify-content: flex-start;
        }
      </style>
      <div class="wrapper">
        <div class="header-row">
          <div class="header"><slot name="header"></slot></div>
          <slot name="close"></slot>
        </div>
        <slot name="description"></slot>
        <div class="input-wrapper">
          <slot name="input"></slot>
        </div>
        <slot name="actions"></slot>
      </div>
    `;
    }

    setupEventListeners() {
        // Listen for expand/collapse button clicks
        this.addEventListener('click', (e) => {
            const expandBtn = e.target.closest('[data-expand-toggle]');
            if (expandBtn) {
                this.toggleExpanded();
            }
        });
    }

    /**
     * Toggle expanded state
     */
    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            this.setAttribute('expanded', '');
            document.body.style.overflow = 'hidden';
        } else {
            this.removeAttribute('expanded');
            document.body.style.overflow = '';
        }
        this.dispatchEvent(
            new CustomEvent('expanded-changed', {
                detail: { expanded: this.isExpanded },
                bubbles: true,
                composed: true
            })
        );
    }

    /**
     * Get expanded state
     */
    getExpanded() {
        return this.isExpanded;
    }

    /**
     * Set expanded state programmatically
     */
    setExpanded(expanded) {
        if (expanded !== this.isExpanded) {
            this.toggleExpanded();
        }
    }

    /**
     * Restore expanded state from external source (e.g., localStorage)
     */
    restoreExpanded(shouldBeExpanded) {
        if (shouldBeExpanded) {
            this.setAttribute('expanded', '');
            this.isExpanded = true;
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close expanded view (without toggle)
     */
    closeExpanded() {
        if (this.isExpanded) {
            this.toggleExpanded();
        }
    }
}

customElements.define('labs-expandable-card', LabsExpandableCard);

export default LabsExpandableCard;
