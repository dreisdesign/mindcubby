import '../components/labs-checkbox.js';
import '../components/labs-icon.js';

export default {
  title: '2. Components/Input/Checkbox',
  component: 'labs-checkbox',
  parameters: {
    docs: {
      description: {
        component: 'A canonical, accessible, icon-only checkbox component for use in lists and forms.'
      }
    }
  }
};

export const Default = () => `
  <labs-checkbox aria-label="Toggle" style="margin:8px;"></labs-checkbox>
`;
