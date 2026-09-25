/**
 * labs-button-reset-media.wrapped.js
 * 
 * A wrapped variant of labs-button configured for media reset actions.
 * This is a specialized button for resetting/stopping media playback.
 * 
 * Used by: labs-footer-media-controls
 */

import './labs-button.js';
import './labs-icon.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
    }
  </style>
  <labs-button fullwidth variant="secondary" size="small">
    <labs-icon slot="icon-left" name="replay"></labs-icon>
    <span id="label">Reset</span>
  </labs-button>
`;

class LabsButtonResetMediaWrapped extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this._button = this.shadowRoot.querySelector('labs-button');
    if (this._button) {
      // Proxy click events
      this._button.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('click', { bubbles: true, composed: true }));
      });
    }
  }

  // Proxy attributes to internal button
  get fullwidth() {
    return this._button?.getAttribute('fullwidth');
  }

  set fullwidth(value) {
    if (this._button) {
      if (value) this._button.setAttribute('fullwidth', '');
      else this._button.removeAttribute('fullwidth');
    }
  }
}

customElements.define('labs-button-reset-media-wrapped', LabsButtonResetMediaWrapped);
