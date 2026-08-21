import '../../components/labs-settings-card.js';
import '../../components/labs-button.js';
import '../../components/labs-icon.js';

export default {
  title: '4. Patterns/Cards/Settings Card',
  parameters: {
    docs: {
      description: {
        component: 'A settings card pattern matching the Tracker app, using Labs Button components.'
      }
    }
  }
};

export const SettingsCard = {
  render: () => `
    <labs-settings-card></labs-settings-card>
  `
};
