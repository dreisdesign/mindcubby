/**
 * Labs Input Card
 * 
 * A card component for capturing text input with save/close actions.
 * Used primarily for adding new items in Today-List and similar apps.
 * 
 * Attributes:
 * - `value` (string): current input value
 * - `placeholder` (string): input placeholder text
 * 
 * Events:
 * - `save`: dispatched when user confirms input (detail: { value: string })
 * - `close`: dispatched when user cancels input
 */

class LabsInputCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['value', 'placeholder'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && this._input) {
      this._input.value = newValue || '';
    }
  }

  render() {
    const placeholder = this.getAttribute('placeholder') || 'Enter text...';
    const value = this.getAttribute('value') || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .card {
          background: var(--color-surface, #fff);
          border-radius: var(--radius-lg, 12px);
          padding: var(--space-lg, 24px);
          box-shadow: var(--shadow-card, 0 4px 12px rgba(0, 0, 0, 0.1));
          max-width: 90vw;
          width: 100%;
          box-sizing: border-box;
        }

        .header {
          font-size: var(--font-size-h2, 1.5rem);
          font-weight: var(--font-weight-heading, 700);
          color: var(--color-on-surface, #222);
          margin-bottom: var(--space-md, 16px);
        }

        .input-wrapper {
          margin-bottom: var(--space-lg, 24px);
        }

        input,
        textarea {
          width: 100%;
          padding: var(--space-md, 12px);
          border: 1px solid var(--color-outline, #ddd);
          border-radius: var(--radius-md, 8px);
          font-size: var(--font-size-body, 1rem);
          font-family: var(--font-family-base, system-ui, sans-serif);
          color: var(--color-on-surface, #222);
          background: var(--color-background, #f9f9f9);
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        input:focus,
        textarea:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
          box-shadow: 0 0 0 2px var(--color-primary, rgba(0, 123, 255, 0.1));
        }

        textarea {
          min-height: 100px;
          resize: vertical;
        }

        .actions {
          display: flex;
          gap: var(--space-md, 12px);
          justify-content: flex-end;
        }

        labs-button {
          flex: 1;
        }

        @media (min-width: 640px) {
          labs-button {
            flex: 0 1 auto;
          }
        }
      </style>

      <div class="card">
        <div class="header">Add Task</div>
        <div class="input-wrapper">
          <input
            type="text"
            placeholder="${placeholder}"
            value="${value.replace(/"/g, '&quot;')}"
            class="text-input"
          />
        </div>
        <div class="actions">
          <labs-button id="cancel-btn" variant="secondary" size="large" fullwidth>Cancel</labs-button>
          <labs-button id="save-btn" variant="primary" size="large" fullwidth>Add</labs-button>
        </div>
      </div>
    `;

    // Cache references after render
    this._input = this.shadowRoot.querySelector('input');
    this._saveBtn = this.shadowRoot.getElementById('save-btn');
    this._cancelBtn = this.shadowRoot.getElementById('cancel-btn');

    // Wire up button events
    if (this._saveBtn) {
      this._saveBtn.addEventListener('click', () => this._handleSave());
    }
    if (this._cancelBtn) {
      this._cancelBtn.addEventListener('click', () => this._handleCancel());
    }

    // Wire up enter key on input
    if (this._input) {
      this._input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._handleSave();
        }
      });
      this._input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this._handleCancel();
        }
      });
    }
  }

  _handleSave() {
    const value = this._input?.value || '';
    this.dispatchEvent(
      new CustomEvent('save', {
        detail: { value },
        bubbles: true,
        composed: true
      })
    );
  }

  _handleCancel() {
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true
      })
    );
  }

  connectedCallback() {
    // Re-render to ensure shadow DOM is ready
    this.render();
    // Focus input on connect
    setTimeout(() => {
      this._input?.focus();
    }, 0);
  }

  // Public API for setting value
  setValue(value) {
    this.setAttribute('value', value);
  }

  // Public API for getting value
  getValue() {
    return this._input?.value || '';
  }

  // Public API for focusing
  focusInput() {
    this._input?.focus();
  }
}

if (!customElements.get('labs-input-card')) {
  customElements.define('labs-input-card', LabsInputCard);
}
