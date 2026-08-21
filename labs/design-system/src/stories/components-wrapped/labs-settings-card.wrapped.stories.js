import '../../components/labs-settings-card.js';
import '../../components/labs-icon.js';

export default {
    title: '3. Components (Wrapped)/Card/Settings',
    component: 'labs-settings-card',
};

export const Default = {
    name: 'Default',
    render: () => `
    <labs-settings-card>
      <div class="header-row" slot="header">
        <h3>Settings</h3>
        <button class="close-btn" aria-label="Close">
          <labs-icon name="close"></labs-icon>
        </button>
      </div>
      <div>
        <p>Settings content goes here. Add toggles, options, or info as needed.</p>
      </div>
      <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px;">
        <button class="close-btn" aria-label="Close">
          <labs-icon name="close"></labs-icon>
        </button>
      </div>
    </labs-settings-card>
  `,
};