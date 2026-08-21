import '../../components/labs-footer-with-settings.js';
import iconsList from '../../components/icons-list.js';
import { html } from 'lit';

export default {
    title: '3. Components (Wrapped)/Template/Footer',
    parameters: {
        docs: {
            description: {
                component: 'Encapsulated `labs-footer-with-settings` wrapper that includes animation and overlay wiring. Use controls to adjust icon and sizes.'
            }
        }
    }
};

export const WithSettings = {
    name: 'With Settings',
    render: (args) => html`
    <div style="min-height:100vh; display:flex; flex-direction:column;">
      <main style="flex:1 1 auto;"></main>
      <labs-footer-with-settings
        settings-icon=${args.settingsIcon}
        settings-size=${args.settingsSize}
        add-size=${args.addSize}
        add-variant=${args.addVariant}
        ?full-width=${args.fullWidth}
        ?elevated=${args.elevated}
      ></labs-footer-with-settings>
    </div>
  `
};

WithSettings.argTypes = {
    settingsIcon: { control: { type: 'select' }, options: Object.keys(iconsList) },
    settingsSize: { control: { type: 'inline-radio' }, options: ['small', 'medium', 'large'] },
    addSize: { control: { type: 'inline-radio' }, options: ['small', 'medium', 'large'] },
    addVariant: { control: { type: 'select' }, options: ['primary', 'secondary', 'transparent'] },
    fullWidth: { control: 'boolean' },
    elevated: { control: 'boolean' }
};

WithSettings.args = {
    settingsIcon: 'settings',
    settingsSize: 'large',
    addSize: 'large',
    addVariant: 'primary',
    fullWidth: true,
    elevated: true
};
