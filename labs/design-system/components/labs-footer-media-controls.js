
import './labs-footer.js';
import './labs-button-reset-media.wrapped.js';
// import './labs-button-media-timer.wrapped.js'; // Uncomment if you have a wrapped media button
import './labs-overlay.js';
import './labs-settings-card.js';

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
    .footer-center {
      display: flex;
      align-items: center;
      gap: var(--space-lg, 1.25rem);
      justify-content: center;
    }
    .footer-right {
      display: flex;
      align-items: center;
      gap: var(--space-md, 0.75rem);
    }
    #settings-btn {
      padding-right: var(--space-md, 12px);
    }
  </style>

  <labs-footer id="footer" full-width elevated>

  <div slot="left" class="footer-left">
  <labs-button-reset-media-wrapped id="reset-btn" fullwidth size="small" variant="transparent"></labs-button-reset-media-wrapped>
    </div>

    <div slot="center" class="footer-center">
      <labs-button id="media-btn" pill size="large" variant="primary">
        <labs-icon slot="icon-left" name="play_circle"></labs-icon>
        <span id="media-label">Start</span>
      </labs-button>
      
    </div>
    <div slot="right" class="footer-right">
      <labs-button id="settings-btn" variant="icon" aria-label="Settings" size="large">
        <labs-icon id="settings-icon" slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>

  <labs-overlay id="settings-overlay" size="medium" transparent>
    <labs-settings-card></labs-settings-card>
  </labs-overlay>
`;

class LabsFooterMediaControls extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._onMediaClick = this._onMediaClick.bind(this);
        this._onResetClick = this._onResetClick.bind(this);
        this._onSettingsClick = this._onSettingsClick.bind(this);
        this._onCardClose = this._onCardClose.bind(this);

        // Check for mode attribute: 'timer' uses Start → Pause ↔ Resume pattern
        this._mode = this.getAttribute('mode') || 'cycle';

        // All modes use the same 3 states, but timer mode has different cycling logic
        this._mediaStates = [
            { label: 'Start', icon: 'play_circle' },
            { label: 'Pause', icon: 'pause_circle' },
            { label: 'Resume', icon: 'not_started' }
        ];
        this._mediaState = 0;
    }

    connectedCallback() {
        this._mediaBtn = this.shadowRoot.getElementById('media-btn');
        this._mediaLabel = this.shadowRoot.getElementById('media-label');
        this._mediaIcon = this._mediaBtn && this._mediaBtn.querySelector('labs-icon');
        this._resetBtn = this.shadowRoot.getElementById('reset-btn');
        this._settingsBtn = this.shadowRoot.getElementById('settings-btn');
        this._settingsIcon = this.shadowRoot.getElementById('settings-icon');
        this._overlay = this.shadowRoot.getElementById('settings-overlay');
        this._settingsCard = this._overlay && this._overlay.querySelector('labs-settings-card');
        if (this._mediaBtn) this._mediaBtn.addEventListener('click', this._onMediaClick);
        if (this._resetBtn) this._resetBtn.addEventListener('click', this._onResetClick);
        if (this._settingsBtn) this._settingsBtn.addEventListener('click', this._onSettingsClick);
        if (this._settingsCard) {
            this._settingsCard.addEventListener('close', this._onCardClose);
        }
        // Set full-width and elevated on the internal footer
        const footer = this.shadowRoot.getElementById('footer');
        if (footer) {
            footer.setAttribute('full-width', '');
            footer.setAttribute('elevated', '');
        }
        this._updateMediaButton();
    }

    disconnectedCallback() {
        if (this._mediaBtn) this._mediaBtn.removeEventListener('click', this._onMediaClick);
        if (this._resetBtn) this._resetBtn.removeEventListener('click', this._onResetClick);
        if (this._settingsBtn) this._settingsBtn.removeEventListener('click', this._onSettingsClick);
        if (this._settingsCard) this._settingsCard.removeEventListener('close', this._onCardClose);
    }

    _onMediaClick() {
        if (this._mode === 'timer') {
            // Timer mode: Start → Pause ↔ Resume
            // State 0 (Start) → State 1 (Pause)
            // State 1 (Pause) → State 2 (Resume)
            // State 2 (Resume) → State 1 (Pause)
            if (this._mediaState === 0) {
                this._mediaState = 1; // Start → Pause
            } else if (this._mediaState === 1) {
                this._mediaState = 2; // Pause → Resume
            } else {
                this._mediaState = 1; // Resume → Pause
            }
        } else {
            // Default mode: cycle through all states
            this._mediaState = (this._mediaState + 1) % this._mediaStates.length;
        }
        this._updateMediaButton();
        this.dispatchEvent(new CustomEvent('media-action', { detail: this._mediaStates[this._mediaState], bubbles: true }));
    }

    _onResetClick() {
        this._mediaState = 0;
        this._updateMediaButton();
        this.dispatchEvent(new CustomEvent('reset-media', { bubbles: true }));
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

    _updateMediaButton() {
        if (this._mediaLabel) this._mediaLabel.textContent = this._mediaStates[this._mediaState].label;
        if (this._mediaIcon) this._mediaIcon.setAttribute('name', this._mediaStates[this._mediaState].icon);
    }
}

if (!customElements.get('labs-footer-media-controls')) customElements.define('labs-footer-media-controls', LabsFooterMediaControls);

export default LabsFooterMediaControls;