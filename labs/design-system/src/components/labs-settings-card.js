// Labs Settings Card - matches Tracker app settings overlay
class LabsSettingsCard extends HTMLElement {
  static get observedAttributes() {
    return ['hide-reset'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'hide-reset') this.render();
  }

  get hideReset() {
    return this.hasAttribute('hide-reset');
  }
  set hideReset(val) {
    if (val) this.setAttribute('hide-reset', '');
    else this.removeAttribute('hide-reset');
  }

  render() {
    const hideReset = this.hideReset;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 340px;
          margin: 0 auto;
          background: var(--color-surface, #fff);
          border-radius: var(--radius-xl, 16px);
          box-shadow: 0 4px 32px rgba(0,0,0,0.10), 0 1.5px 4px rgba(0,0,0,0.04);
          padding: 28px 24px 20px 24px;
          font-family: var(--font-family-base, system-ui, sans-serif);
          position: relative;
          /*
            Modular override: ensure secondary button borders match text/icon color for visual consistency
            - --color-outline is set to var(--color-on-surface) so secondary button borders always match the text and icon color in this context.
            - This override is local to the settings card, preserving modularity and reusability of the button component.
            - No global override is used; other usages of secondary buttons are unaffected.
            - No box-shadow is applied to secondary buttons in this context for clarity.
          */
          --color-outline: var(--color-on-surface);
        }
        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .close-btn {
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border-radius: var(--radius-full, 9999px);
          position: static;
          background: inherit;
          box-shadow: none;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.10s cubic-bezier(.4,2,.6,1), color 0.10s cubic-bezier(.4,2,.6,1);
        }
        :host {
          background: var(--color-surface, #fff);
        }
        :host-context(.theme-dark) .close-btn {
          background: var(--color-surface, #181a1b);
        }
        :host-context(.theme-dark) .close-btn:hover,
        :host-context(.theme-dark) .close-btn:focus-visible {
          background: var(--color-surface-hover, #23272a);
        }
        :host-context(.theme-light) .close-btn {
          background: var(--color-surface, #fff);
        }
        :host-context(.theme-light) .close-btn:hover,
        :host-context(.theme-light) .close-btn:focus-visible {
          background: var(--color-surface-hover, #f5f5f5);
        }
        .close-btn:hover,
        .close-btn:focus-visible {
          color: var(--color-on-surface, #222);
        }
        .close-btn labs-icon {
          --icon-size: 28px;
        }
        h3 {
          margin: 0;
          font-size: 1.18rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        /* Layout for appearance slot: ensure buttons inside are stacked with spacing */
        .settings-list #appearance-btn-slot {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .settings-list labs-button {
          width: 100%;
          box-sizing: border-box;
          /* Remove any box-shadow for secondary buttons in settings card context */
        }
        .settings-list labs-button[variant="secondary"] button {
          box-shadow: none !important;
        }
        .settings-actions {
          display: none;
        }
        /* Icon hover animation for settings icon in icon-only button */
        labs-button[variant="icon"] labs-icon[name="settings"] {
          transition: transform 0.3s cubic-bezier(.4,2,.6,1);
        }
        labs-button[variant="icon"]:hover labs-icon[name="settings"] {
          transform: rotate(180deg);
        }
        /* Fix icon color in destructive buttons: ensure icon inherits semantic error color */
        labs-button[variant="destructive"] labs-icon,
        labs-button[variant="destructive"] ::slotted(labs-icon) {
          color: var(--color-on-error, #fff);
        }
        /*
          Modular override pattern:
          - --color-outline is set only in the settings card context for visible secondary button borders.
          - No global override; this ensures modularity and reusability.
          - No box-shadow for secondary buttons in this context for visual clarity.
        */
  </style>
      <div class="header-row">
        <h3>Settings</h3>
        <labs-button id="icon-close-btn" class="close-btn" variant="icon" aria-label="Close">
          <labs-icon name="close" slot="icon-left" width="28" height="28"></labs-icon>
        </labs-button>
      </div>
      <div class="settings-list">
        <div id="apps-selector-slot"></div>
        <div id="appearance-btn-slot"></div>
        <labs-button id="simulate-next-btn" variant="secondary" size="large" style="gap:10px; display:none;">
          <labs-icon name="add" slot="icon-left" width="20" height="20"></labs-icon>
          Simulate Next Day
        </labs-button>
        ${!hideReset ? `
        <labs-button id="reset-all-btn" variant="destructive" size="large" style="gap:10px;">
          <labs-icon name="delete" slot="icon-left" width="20" height="20" color="var(--color-on-error)"></labs-icon>
          Reset All Data
        </labs-button>
        ` : ''}
      </div>
    `;
    // Add close event for icon button (dispatches a custom event for overlay to handle)
    const iconCloseBtn = this.shadowRoot.getElementById('icon-close-btn');
    if (iconCloseBtn) {
      iconCloseBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
      });
    }
    // Wire All Apps selector to display dropdown menu
    const appsSlot = this.shadowRoot.getElementById('apps-selector-slot');
    if (appsSlot) {
      import('../components/labs-apps-selector.js').then(() => {
        if (!this.shadowRoot.getElementById('apps-selector')) {
          const appsSelector = document.createElement('labs-apps-selector');
          appsSelector.id = 'apps-selector';
          appsSlot.appendChild(appsSelector);
        }
      }).catch(() => { });
    }
    // Inline theme toggle button logic for shadow DOM compatibility
    const slot = this.shadowRoot.getElementById('appearance-btn-slot');
    if (slot) {
      const btn = document.createElement('labs-button');
      btn.setAttribute('variant', 'secondary');
      btn.setAttribute('size', 'large');
      btn.style.width = '100%';
      btn.style.justifyContent = 'flex-start';
      btn.style.margin = '0';
      btn.style.position = 'static';
      btn.id = 'theme-toggle-btn';
      function updateLabel() {
        const isDark = document.documentElement.classList.contains('theme-dark');
        // Remove any existing icon and label
        while (btn.firstChild) btn.removeChild(btn.firstChild);
        // Create the icon with the correct slot
        const icon = document.createElement('labs-icon');
        icon.setAttribute('slot', 'icon-left');
        icon.setAttribute('name', isDark ? 'bedtime_off' : 'bedtime');
        btn.appendChild(icon);
        // Add the label as a text node
        btn.appendChild(document.createTextNode(isDark ? 'Turn on light mode' : 'Turn on dark mode'));
      }
      btn.onclick = () => {
        const isDark = document.documentElement.classList.contains('theme-dark');
        const root = document.documentElement;
        const flavorClass = Array.from(root.classList).find(c => c.startsWith('flavor-'));
        const flavor = flavorClass ? flavorClass.replace('flavor-', '') : 'vanilla';
        const theme = isDark ? 'light' : 'dark';

        // Use ThemeManager if available (preferred), otherwise fall back to direct DOM manipulation
        import('../utils/theme-manager.js').then(({ ThemeManager }) => {
          if (ThemeManager.appName) {
            ThemeManager.setTheme(theme);
          } else {
            // Fallback for apps not using ThemeManager yet (e.g. Tracker)
            import('../utils/theme.js').then(({ applyTheme }) => {
              applyTheme({ flavor, theme });
              try {
                localStorage.setItem('tracker-theme', theme);
                localStorage.setItem('tracker-flavor', flavor);
              } catch (e) { }
            });
          }
          updateLabel();
        }).catch(() => {
          // Fallback if ThemeManager import fails
          import('../utils/theme.js').then(({ applyTheme }) => {
            applyTheme({ flavor, theme });
            updateLabel();
          });
        });
      };
      // Keep the visible label in sync with external theme changes
      const observer = new MutationObserver(() => updateLabel());
      try {
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      } catch (e) { }
      updateLabel();
      slot.appendChild(btn);

      // Ensure a flavor selector is present — use labs-flavor-selector for dropdown UX
      import('../components/labs-flavor-selector.js').then(() => {
        if (!this.shadowRoot.getElementById('flavor-selector')) {
          const flavorSelector = document.createElement('labs-flavor-selector');
          flavorSelector.id = 'flavor-selector';
          slot.appendChild(flavorSelector);
          // Bubble up flavor-changed event from selector and persist via ThemeManager
          flavorSelector.addEventListener('flavor-changed', (e) => {
            const newFlavor = e.detail.flavor;
            import('../utils/theme-manager.js').then(({ ThemeManager }) => {
              if (ThemeManager.appName) {
                ThemeManager.setFlavor(newFlavor);
              } else {
                // Fallback persistence for legacy apps
                try {
                  localStorage.setItem('tracker-flavor', newFlavor);
                } catch (err) { }
              }
            });
            this.dispatchEvent(new CustomEvent('flavor-changed', { detail: e.detail, bubbles: true, composed: true }));
          });
        }
      }).catch(() => { });

      // Wire reset button to dispatch a confirmed reset event
      const resetBtn = this.shadowRoot.getElementById('reset-all-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
          // Check if button is disabled and prevent action if so
          if (resetBtn.hasAttribute('disabled')) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          e.preventDefault();
          const confirmed = window.confirm('Warning: This will delete all entries. Are you sure you want to continue?');
          if (confirmed) {
            this.dispatchEvent(new CustomEvent('reset-all', { bubbles: true, composed: true }));
            // Close overlay after reset so the app can refresh UI
            this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
          }
        });
      }
      // Wire simulate next day button to dispatch a simulate event so apps can handle the behavior
      const simulateBtn = this.shadowRoot.getElementById('simulate-next-btn');
      if (simulateBtn) {
        // Show simulate button only when URL contains simulate=1 or simulate=true
        try {
          const url = new URL(window.location.href);
          const simulateFlag = url.searchParams.get('simulate') || url.searchParams.get('simulateNext');
          if (simulateFlag === '1' || simulateFlag === 'true') simulateBtn.style.display = '';
        } catch (e) { }
        simulateBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Let apps handle the simulated action
          this.dispatchEvent(new CustomEvent('simulate-next-day', { bubbles: true, composed: true }));
          // Also emit a close event so overlays listening for 'close' will close automatically
          this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
        });
      }
    }
  }
}
customElements.define('labs-settings-card', LabsSettingsCard);
