import '../../components/labs-footer.js';
import '../../components/labs-button.js';
import '../../components/labs-icon.js';

export default {
    title: '2. Components/Template/Footer',
    component: 'labs-footer',
    parameters: {
        docs: {
            description: {
                component: 'Canonical `labs-footer` component. Use this for all base layout footers. Fully modular, token-driven, and theme-aware.'
            }
        }
    }
};

export const Default = () => `
  <labs-footer>
    <div slot="center">
      <labs-button pill size="large" variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Add
      </labs-button>
    </div>
    <div slot="right" style="display:flex;align-items:center;gap:8px;">
      <labs-button variant="icon" aria-label="Settings" size="large" style="padding-right:12px;">
        <labs-icon slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>
`;

export const FullWidth = () => `
  <labs-footer full-width>
    <div slot="center">
      <labs-button pill size="large" variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Add
      </labs-button>
    </div>
    <div slot="right" style="display:flex;align-items:center;gap:8px;">
      <labs-button variant="icon" aria-label="Settings" size="large" style="padding-right:12px;">
        <labs-icon slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>
`;
