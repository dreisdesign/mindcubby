import '../../components/labs-button/labs-button.js';
import '../../components/labs-icon.js';
import icons from '../../components/icons-list.js';

export default {
  title: 'Patterns/Buttons',
  component: 'labs-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'destructive'],
      description: 'Visual variant for the button (icon-only usage is provided as a Pattern)',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    pill: { control: { type: 'boolean' }, description: 'Make the button a pill (rounded)' },
    'icon-left': { control: { type: 'select' }, options: icons, description: 'Name of left icon (optional)' },
    'icon-right': { control: { type: 'select' }, options: icons, description: 'Name of right icon (optional)' },
    children: { control: 'text', name: 'Label', description: 'Button label text' },
  },
};

export const Default = {
  args: {
    variant: 'primary',
    size: 'medium',
    pill: true,
    'icon-left': '',
    'icon-right': '',
    children: 'Button',
  },
  render: ({ variant, size, 'icon-left': iconLeft, 'icon-right': iconRight, children }) => {
    const left = iconLeft ? `<labs-icon name="${iconLeft}"></labs-icon>` : '';
    const right = iconRight ? `<labs-icon name="${iconRight}"></labs-icon>` : '';
    const leftAttr = iconLeft ? `icon-left="${iconLeft}"` : '';
    const rightAttr = iconRight ? `icon-right="${iconRight}"` : '';
    return `<div style="background: none; box-shadow: none; padding: 0; border: none;">
  <labs-button ${pill ? 'pill' : ''} variant="${variant}" size="${size}" ${leftAttr} ${rightAttr}>${left}${children}${right}</labs-button>
    </div>`;
  },
  parameters: {
    docs: { description: { story: 'Default button example. Use controls to change variant, size and icons.' } },
  },
};

export const Add = {
  args: {
    variant: 'primary',
    size: 'large',
    'icon-left': 'add',
    'icon-right': '',
    children: 'Add',
  },
  render: ({ variant, size, 'icon-left': iconLeft, 'icon-right': iconRight, children }) => {
    const left = iconLeft ? `<labs-icon name="${iconLeft}"></labs-icon>` : '';
    const right = iconRight ? `<labs-icon name="${iconRight}"></labs-icon>` : '';
    const leftAttr = iconLeft ? `icon-left="${iconLeft}"` : '';
    const rightAttr = iconRight ? `icon-right="${iconRight}"` : '';
    return `<div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button variant="${variant}" size="${size}" ${leftAttr} ${rightAttr}>${left}${children}${right}</labs-button>
    </div>`;
  },
  parameters: {
    docs: { description: { story: 'Add button pattern. Use controls to change variant, size, and icons.' } },
  },
};
