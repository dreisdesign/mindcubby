export const Restore = {
  name: 'Restore',
  render: () => `
    <labs-button pill variant="secondary">
      <labs-icon slot="icon-left" name="history"></labs-icon>
      Restore
    </labs-button>
  `,
};
import '../../components/labs-button.js';
import '../../components/labs-icon.js';

export default {
  title: '3. Components (Wrapped)/Button',
  component: 'labs-button',
};

export const Add = {
  name: 'Add',
  render: () => `
    <labs-button pill variant="primary">
      <labs-icon slot="icon-left" name="add"></labs-icon>
      Add
    </labs-button>
  `,
};

export const ResetAllData = {
  name: 'Reset all data',
  render: () => `
    <labs-button variant="destructive" size="large" style="gap:10px;">
      <labs-icon slot="icon-left" name="delete" width="20" height="20" color="var(--color-on-error)"></labs-icon>
      Reset All Data
    </labs-button>
  `,
};

export const AnimationSuccess = {
  name: 'Animation - Success',
  render: () => `
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="success-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="check"></labs-icon>
        Success Animation
      </labs-button>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelector('#success-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.animate('success', 600);
      });
    }
  }
};

export const AnimationCreated = {
  name: 'Animation - Created',
  render: () => `
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="created-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Created Animation
      </labs-button>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelector('#created-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.animate('created', 600);
      });
    }
  }
};

export const AnimationPulse = {
  name: 'Animation - Pulse',
  render: () => `
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="pulse-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="notifications_active"></labs-icon>
        Pulse Animation
      </labs-button>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const btn = canvasElement.querySelector('#pulse-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.animate('pulse', 600);
      });
    }
  }
};
