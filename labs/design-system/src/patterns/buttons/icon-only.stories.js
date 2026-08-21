// Icon Only Button Pattern — Storybook story for usage pattern, not a variant
import '../../components/labs-button/labs-button.js';
import '../../components/labs-icon.js';
import icons from '../../components/icons-list.js';
/**
 * @type { import('@storybook/web-components').Meta }
 */

export default {
  title: 'Patterns/Buttons/Icon Only',
  component: 'labs-button',
  tags: ['autodocs'],
  parameters: {
    docs: {
      autodocs: true,
      description: {
        component: 'Icon Only is a usage pattern, not a variant. Use a regular button variant (e.g. primary) and provide only a slotted icon with an aria-label for accessibility.'
      },
    },
    controls: { hideNoControlsWarning: true },
  },
};

export const IconOnly = {
  name: 'Icon Only',
  args: {
    icon: 'settings',
  },
  argTypes: {
    icon: { control: { type: 'select' }, options: icons, description: 'Icon to display' },
  },
  render: ({ icon }) => `
    <labs-button variant="icon" aria-label="${icon}">
      <span slot="icon-left"><labs-icon name="${icon}"></labs-icon></span>
    </labs-button>
  `,
  parameters: {
    controls: { include: ['icon'], hideNoControlsWarning: true },
  },
};
