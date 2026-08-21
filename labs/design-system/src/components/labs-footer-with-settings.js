import './labs-footer.js';
import './labs-button.js';
import './labs-icon.js';
import './labs-overlay.js';
import './labs-settings-card.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    /* Icon animation scoped to the wrapper */
    #settings-btn labs-icon {
      width: var(--lfs-icon-size, 28px);
      height: var(--lfs-icon-size, 28px);
      transition: transform 0.4s cubic-bezier(.4,2,.6,1);
      display:inline-block;
    }
    #settings-btn:hover labs-icon {
      transform: rotate(90deg);
    }
    /* Ensure footer sits in normal flow; consumers control page layout */
    :host { box-sizing: border-box; }
  </style>

  <labs-footer id="footer">
    <slot name="left" slot="left"></slot>
    <div slot="center">
      <labs-button id="add-btn" pill size="large" variant="primary"><labs-icon slot="icon-left" name="add"></labs-icon>Add</labs-button>
    </div>
    <div slot="right" style="display:flex;align-items:center;gap:8px;">
      <slot name="actions"></slot>
      <labs-button id="settings-btn" variant="icon" aria-label="Settings" size="large" style="padding-right:12px;">
        <labs-icon id="settings-icon" slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>

  <labs-overlay id="settings-overlay" size="medium" transparent>
    <labs-settings-card></labs-settings-card>
  </labs-overlay>
`;

class LabsFooterWithSettings extends HTMLElement {
  static get observedAttributes() {
    return ['settings-icon', 'settings-size', 'add-size', 'add-variant', 'full-width', 'elevated'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._onSettingsClick = this._onSettingsClick.bind(this);
    this._onCardClose = this._onCardClose.bind(this);
    this._onAddClick = this._onAddClick.bind(this);
    this._onResetAll = this._onResetAll.bind(this);
  }

  connectedCallback() {
    this._upgradeProperty('settingsIcon');
    this._upgradeProperty('settingsSize');
    this._upgradeProperty('addSize');
    this._upgradeProperty('addVariant');

    this._settingsBtn = this.shadowRoot.getElementById('settings-btn');
    this._settingsIcon = this.shadowRoot.getElementById('settings-icon');
    this._overlay = this.shadowRoot.getElementById('settings-overlay');
    this._settingsCard = this._overlay && this._overlay.querySelector('labs-settings-card');

    if (this._settingsBtn) this._settingsBtn.addEventListener('click', this._onSettingsClick);
    this._addBtn = this.shadowRoot.getElementById('add-btn');
    if (this._addBtn) this._addBtn.addEventListener('click', this._onAddClick);
    if (this._settingsCard) {
      this._settingsCard.addEventListener('close', this._onCardClose);
      this._settingsCard.addEventListener('reset-all', this._onResetAll);
    }

    // Reflect initial boolean attributes to the internal footer
    this._applyFooterAttrs();
  }

  disconnectedCallback() {
    if (this._settingsBtn) this._settingsBtn.removeEventListener('click', this._onSettingsClick);
    if (this._addBtn) this._addBtn.removeEventListener('click', this._onAddClick);
    if (this._settingsCard) {
      this._settingsCard.removeEventListener('close', this._onCardClose);
      this._settingsCard.removeEventListener('reset-all', this._onResetAll);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'settings-icon':
        if (this._settingsIcon) this._settingsIcon.setAttribute('name', newValue || 'settings');
        break;
      case 'settings-size':
        if (this._settingsBtn) this._settingsBtn.setAttribute('size', newValue || 'large');
        break;
      case 'add-size':
        const addBtn = this.shadowRoot.getElementById('add-btn');
        if (addBtn) addBtn.setAttribute('size', newValue || 'large');
        break;
      case 'add-variant':
        const addBtn2 = this.shadowRoot.getElementById('add-btn');
        if (addBtn2) addBtn2.setAttribute('variant', newValue || 'primary');
        break;
      case 'full-width':
      case 'elevated':
        this._applyFooterAttrs();
        break;
    }
  }

  // Property wrappers for convenience
  get settingsIcon() { return this.getAttribute('settings-icon'); }
  set settingsIcon(val) { this.setAttribute('settings-icon', val); }

  get settingsSize() { return this.getAttribute('settings-size'); }
  set settingsSize(val) { this.setAttribute('settings-size', val); }

  get addSize() { return this.getAttribute('add-size'); }
  set addSize(val) { this.setAttribute('add-size', val); }

  get addVariant() { return this.getAttribute('add-variant'); }
  set addVariant(val) { this.setAttribute('add-variant', val); }

  get fullWidth() { return this.hasAttribute('full-width'); }
  set fullWidth(val) { if (val) this.setAttribute('full-width', ''); else this.removeAttribute('full-width'); }

  get elevated() { return this.hasAttribute('elevated'); }
  set elevated(val) { if (val) this.setAttribute('elevated', ''); else this.removeAttribute('elevated'); }

  _upgradeProperty(prop) {
    if (this.hasOwnProperty(prop)) {
      let value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  _applyFooterAttrs() {
    const footer = this.shadowRoot.getElementById('footer');
    if (!footer) return;
    if (this.hasAttribute('full-width')) footer.setAttribute('full-width', ''); else footer.removeAttribute('full-width');
    if (this.hasAttribute('elevated')) footer.setAttribute('elevated', ''); else footer.removeAttribute('elevated');
  }

  _onSettingsClick() {
    if (this._overlay && typeof this._overlay.open === 'function') {
      this._overlay.open();
      this.dispatchEvent(new CustomEvent('settings-open', { bubbles: true }));
    }
  }

  _onCardClose() {
    if (this._overlay && typeof this._overlay.close === 'function') this._overlay.close();
    this.dispatchEvent(new CustomEvent('settings-close', { bubbles: true }));
  }

  _onAddClick() {
    // Emit an `add` event for host pages to handle adding entries
    this.dispatchEvent(new CustomEvent('add', { bubbles: true }));
  }

  _onResetAll() {
    // Forward reset-all so host pages can react
    this.dispatchEvent(new CustomEvent('reset-all', { bubbles: true }));
  }
}

if (!customElements.get('labs-footer-with-settings')) customElements.define('labs-footer-with-settings', LabsFooterWithSettings);

export default LabsFooterWithSettings;
