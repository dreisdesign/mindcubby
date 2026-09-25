/**
 * Labs Footer Settings Wrapper
 * Encapsulates settings modal in shadow DOM for consistent behavior across apps
 */
import './labs-footer.js';
import './labs-overlay.js';
import './labs-settings-card.js';
import './labs-button.js';
import './labs-icon.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; box-sizing: border-box; }
    
    #settings-btn labs-icon {
      width: var(--lfs-icon-size, 28px);
      height: var(--lfs-icon-size, 28px);
      transition: transform 0.4s cubic-bezier(.4,2,.6,1);
      display: inline-block;
    }
    
    #settings-btn:hover labs-icon {
      transform: rotate(90deg);
    }
    
    .footer-right {
      display: flex;
      align-items: center;
      gap: var(--space-md, 0.75rem);
    }
  </style>

  <labs-footer id="footer" full-width>
    <slot name="left" slot="left"></slot>
    <slot name="center" slot="center"></slot>
    <div slot="right" class="footer-right">
      <slot name="actions"></slot>
      <labs-button id="settings-btn" variant="icon" aria-label="Settings" size="large" style="--button-icon-size: 1.5em;">
        <labs-icon slot="icon-left" name="settings"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>

  <labs-overlay id="settings-overlay" size="medium" transparent>
    <labs-settings-card></labs-settings-card>
  </labs-overlay>
`;

class LabsFooterSettingsWrapper extends HTMLElement {
  static get observedAttributes() {
    return ['hide-reset'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._onSettingsClick = this._onSettingsClick.bind(this);
    this._onCardClose = this._onCardClose.bind(this);
    this._onResetAll = this._onResetAll.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'hide-reset' && this._settingsCard) {
      if (this.hasAttribute('hide-reset')) {
        this._settingsCard.setAttribute('hide-reset', '');
      } else {
        this._settingsCard.removeAttribute('hide-reset');
      }
    }
  }

  connectedCallback() {
    this._settingsBtn = this.shadowRoot.getElementById('settings-btn');
    this._overlay = this.shadowRoot.getElementById('settings-overlay');
    this._settingsCard = this._overlay && this._overlay.querySelector('labs-settings-card');
    
    // Pass hide-reset attribute to internal card if present
    if (this._settingsCard && this.hasAttribute('hide-reset')) {
      this._settingsCard.setAttribute('hide-reset', '');
    }
    
    if (this._settingsBtn) {
      this._settingsBtn.addEventListener('click', () => this._onSettingsClick());
    }
    
    if (this._settingsCard) {
      this._settingsCard.addEventListener('close', () => this._onCardClose());
      this._settingsCard.addEventListener('reset-all', () => this._onResetAll());
    }
  }

  _onSettingsClick() {
    if (this._overlay) {
      this._overlay.toggle();
    }
  }

  _onCardClose() {
    if (this._overlay) {
      this._overlay.close();
    }
  }

  _onResetAll() {
    // Dispatch reset-all event to parent so apps can handle it
    this.dispatchEvent(new CustomEvent('reset-all', { bubbles: true, composed: true }));
  }

  disconnectedCallback() {
    // Arrow function listeners don't need to be removed since they're bound to component lifecycle
  }
}

if (!customElements.get('labs-footer-settings-wrapper')) {
  customElements.define('labs-footer-settings-wrapper', LabsFooterSettingsWrapper);
}
