// button.stories.js
// Remove Storybook autodocs surface background for button stories
const style = document.createElement('style');
style.innerHTML = `
  .labs-autodocs-surface {
    background: none !important;
    box-shadow: none !important;
  }
`;
document.head.appendChild(style);
// Storybook stories for Labs Button (best practice structure)
import '../components/labs-button.js';
import '../components/labs-icon.js';
import iconsList from '../components/icons-list.js';

export default {
  title: '2. Components/Button',
  component: 'labs-button',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modular, theme-agnostic Labs Button web component. Uses CSS custom properties for all styling.'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'destructive', 'transparent'],
      description: 'Button variant style'
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['small', 'medium', 'large'],
      description: 'Button size variant',
      table: { defaultValue: { summary: 'medium' } }
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable the button'
    },
    text: {
      control: { type: 'text' },
      description: 'Button text content'
    },
    leftIcon: {
      control: { type: 'select' },
      options: iconsList,
      description: 'Left icon name (optional)'
    },
    rightIcon: {
      control: { type: 'select' },
      options: iconsList,
      description: 'Right icon name (optional)'
    }
  },
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    text: 'Button',
    leftIcon: '',
    rightIcon: '',
    pill: true
  }
};

export const Default = {
  name: 'Default',
  render: (args) => `
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button
        variant="${args.variant}"
        ${args.disabled ? 'disabled' : ''}
        ${args.size ? `size="${args.size}"` : ''}
        ${args.pill ? 'pill' : ''}
      >
        ${args.leftIcon ? `<labs-icon slot="icon-left" name="${args.leftIcon}"></labs-icon>` : ''}
        ${args.text}
        ${args.rightIcon ? `<labs-icon slot="icon-right" name="${args.rightIcon}"></labs-icon>` : ''}
      </labs-button>
    </div>
  `,
};

export const Primary = {
  name: 'Primary',
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'Primary'
  },
  render: (args) => `
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${args.variant}"
        ${args.disabled ? 'disabled' : ''}
        ${args.size ? `size="${args.size}"` : ''}
        ${args.pill ? 'pill' : ''}
      >${args.text}</labs-button>
    </div>
  `,
};

export const Secondary = {
  name: 'Secondary',
  args: {
    variant: 'secondary',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'Secondary'
  },
  render: (args) => `
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${args.variant}"
        ${args.disabled ? 'disabled' : ''}
        ${args.size ? `size="${args.size}"` : ''}
        ${args.pill ? 'pill' : ''}
      >${args.text}</labs-button>
    </div>
  `,
};

export const WithLeftIcon = {
  name: 'With Left Icon',
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'With Left Icon'
  },
  render: (args) => `
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${args.variant}"
        ${args.disabled ? 'disabled' : ''}
        ${args.size ? `size="${args.size}"` : ''}
        ${args.pill ? 'pill' : ''}
      >
        <labs-icon slot="icon-left" name="add"></labs-icon>
        ${args.text}
      </labs-button>
    </div>
  `,
};

export const WithRightIcon = {
  name: 'With Right Icon',
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'With Right Icon'
  },
  render: (args) => `
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${args.variant}"
        ${args.disabled ? 'disabled' : ''}
        ${args.size ? `size="${args.size}"` : ''}
        ${args.pill ? 'pill' : ''}
      >
        ${args.text}
        <labs-icon slot="icon-right" name="edit"></labs-icon>
      </labs-button>
    </div>
  `,
};


export const Destructive = {
  name: 'Destructive',
  args: {
    variant: 'destructive',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'Destructive'
  },
  render: (args) => `
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${args.variant}"
        ${args.disabled ? 'disabled' : ''}
        ${args.size ? `size="${args.size}"` : ''}
        ${args.pill ? 'pill' : ''}
      >${args.text}</labs-button>
    </div>
  `,
};

export const Transparent = {
  name: 'Transparent',
  args: {
    variant: 'transparent',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'Transparent'
  },
  render: (args) => `
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${args.variant}"
        ${args.disabled ? 'disabled' : ''}
        ${args.size ? `size="${args.size}"` : ''}
        ${args.pill ? 'pill' : ''}
      >${args.text}</labs-button>
    </div>
  `,
};

export const Pill = {
  name: 'Pill',
  render: () => `
    <div style="display:flex;gap:12px;padding:8px;background:transparent;align-items:center;">
      <labs-button pill variant="primary" size="medium">Primary</labs-button>
      <labs-button pill variant="secondary" size="medium">Secondary</labs-button>
      <labs-button pill variant="destructive" size="medium">Destructive</labs-button>
      <labs-button pill variant="transparent" size="medium">Transparent</labs-button>
      <labs-button pill variant="primary" size="medium"><labs-icon slot="icon-left" name="add"></labs-icon>Add</labs-button>
    </div>
  `,
};
