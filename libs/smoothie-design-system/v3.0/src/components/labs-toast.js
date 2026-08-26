// Minimal labs-toast web component
class LabsToast extends HTMLElement {
  static get observedAttributes() {
    return ['variant'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'variant') {
      this._updateVariant();
    }
  }

  _updateVariant() {
    if (!this._actionBtn) return;
    const v = (this.getAttribute('variant') || 'primary').toLowerCase();
    this._actionBtn.classList.remove('primary', 'secondary', 'destructive');
    if (['primary', 'secondary', 'destructive'].includes(v)) {
      this._actionBtn.classList.add(v);
    } else {
      this._actionBtn.classList.add('primary');
    }
  }
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    container.className = 'toast';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');

    const message = document.createElement('div');
    message.className = 'message';
    this._message = message;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const actionBtn = document.createElement('button');
    actionBtn.className = 'action';
    actionBtn.setAttribute('part', 'action');
    actionBtn.type = 'button';
    actionBtn.textContent = 'Undo';
    this._actionBtn = actionBtn;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.setAttribute('part', 'close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.textContent = '✕';
    this._closeBtn = closeBtn;

    actions.appendChild(actionBtn);
    actions.appendChild(closeBtn);

    container.appendChild(message);
    container.appendChild(actions);

    const style = document.createElement('style');
    style.textContent = `:host{position:fixed;left:50%;bottom:var(--toast-bottom,24px);transform:translateX(-50%);z-index:9999;display:block;font-family:var(--font-family-base, inherit)}
.toast{display:flex;align-items:center;gap:12px;min-width:200px;max-width:640px;padding:12px 16px;border-radius:var(--radius-lg, 8px);background:var(--color-surface,#fff);color:var(--color-on-surface);box-shadow:var(--elevation-1, 0 6px 20px rgba(0,0,0,.12));border:1px solid color-mix(in srgb, var(--color-on-surface) 6%, transparent);opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease}
.toast.show{opacity:1;pointer-events:auto;transform:translateY(0)}
.message{flex:1;font-size:var(--font-size-toast, 0.95rem);line-height:var(--line-height-toast, 1.3)}
.actions{display:flex;align-items:center;gap:8px}
.action{background:transparent;border:0;padding:6px 10px;border-radius:var(--radius-md, 4px);color:var(--color-primary);cursor:pointer;font-weight:var(--font-weight-toast-action, 600);font-size:var(--font-size-toast-action, 0.9rem)}
.action.primary{background:var(--color-primary);color:var(--color-on-primary);border:none;}
.action.primary:hover{background:color-mix(in srgb, var(--color-primary) 85%, black);}
.action.secondary{background:transparent;color:var(--color-on-surface);border:1px solid var(--color-outline, var(--color-primary));}
.action.secondary:hover{background:color-mix(in srgb, var(--color-primary) 6%, transparent);}
.action.destructive{background:var(--color-error, #b5005a);color:var(--on-error, #fff);border:none;}
.action.destructive:hover{background:color-mix(in srgb, var(--color-error, #b5005a) 90%, black);}
.action:focus{outline:2px solid color-mix(in srgb, var(--color-primary, var(--color-accent, var(--color-on-surface))) 20%, transparent);outline-offset:2px}
.close{background:transparent;border:0;padding:6px 8px;border-radius:var(--radius-md, 4px);color:var(--color-on-surface);cursor:pointer}
/* Hover + focus visual affordances for close button inside shadow DOM */
.close:hover{background-color:var(--color-primary-25, rgba(0,0,0,0.06));}
.close:focus{outline:2px solid color-mix(in srgb, var(--color-primary, var(--color-accent, var(--color-on-surface))) 20%, transparent);outline-offset:2px}
`;

    this._shadow.appendChild(style);
    this._shadow.appendChild(container);

    this._container = container;
    this._timeout = null;

    this._onAction = this._onAction.bind(this);
    this._onClose = this._onClose.bind(this);
  }

  connectedCallback() {
    this._actionBtn.addEventListener('click', this._onAction);
    this._closeBtn.addEventListener('click', this._onClose);
    this._updateVariant();
  }

  disconnectedCallback() {
    this._actionBtn.removeEventListener('click', this._onAction);
    this._closeBtn.removeEventListener('click', this._onClose);
    this._clearTimeout();
  }

  show(text, { actionText = 'Undo', duration = 5000 } = {}) {
    this._message.textContent = text;

    if (actionText) {
      this._actionBtn.textContent = actionText;
      this._actionBtn.style.display = '';
    } else {
      this._actionBtn.style.display = 'none';
    }

    this._container.classList.add('show');
    this._clearTimeout();
    if (duration > 0) this._timeout = setTimeout(() => this.hide(), duration);
    this.dispatchEvent(new CustomEvent('show', { bubbles: true, composed: true }));
  }

  hide() {
    this._container.classList.remove('show');
    this._clearTimeout();
    this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
  }

  _onAction() {
    this.dispatchEvent(new CustomEvent('action', { detail: { message: this._message.textContent }, bubbles: true, composed: true }));
    this.hide();
  }

  _onClose() {
    this.hide();
  }

  _clearTimeout() {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
  }
}

if (!customElements.get('labs-toast')) {
  customElements.define('labs-toast', LabsToast);
}

export default LabsToast;
