import '../components/labs-badge.js';

export default {
  title: '2. Components/Badge',
  component: 'labs-badge',
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['', 'primary', 'secondary', 'success', 'warning', 'error'],
      description: 'Badge variant style'
    },
    text: {
      control: 'text',
      description: 'Badge text content'
    }
  }
};

export const Default = ({ variant = '', text = 'Badge' } = {}) => {
  const el = document.createElement('labs-badge');
  if (variant) el.setAttribute('variant', variant);
  el.setAttribute('text', text);
  return el;
};

Default.args = { variant: 'primary', text: 'Badge' };
