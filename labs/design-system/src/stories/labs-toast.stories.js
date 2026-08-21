import '../components/labs-toast.js';

export default {
  title: '2. Components/Toast',
  tags: ['autodocs'],
  args: {
    open: false,
    variant: 'primary',
  },
  argTypes: {
    open: { control: { type: 'boolean' }, description: 'Open toast on render' },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'destructive'],
      description: 'Button style variant for the Toast action button',
      defaultValue: 'primary',
    },
  }
};

export const Default = {
  render: ({ variant }) => {
    const root = document.createElement('div');
    const toast = document.createElement('labs-toast');
    toast.setAttribute('variant', variant);
    // ensure single instance in document body for demo
    document.body.appendChild(toast);

    const btn = document.createElement('labs-button');
    btn.setAttribute('variant', variant);
    btn.setAttribute('pill', '');
    btn.textContent = 'Show undo toast';
    btn.addEventListener('click', () => {
      toast.setAttribute('variant', variant);
      toast.show('Item deleted', { actionText: 'Undo', duration: 4000 });

      toast.addEventListener('action', (e) => {
        const p = document.createElement('p');
        p.textContent = `Action clicked: ${e.detail.message}`;
        root.appendChild(p);
      }, { once: true });

      toast.addEventListener('dismiss', () => {
        const p = document.createElement('p');
        p.textContent = 'Toast dismissed';
        root.appendChild(p);
      }, { once: true });
    });

    root.appendChild(btn);
    return root;
  },
  play: async ({ args }) => {
    if (!args.open) return;
    let toast = document.querySelector('labs-toast');
    if (!toast) {
      toast = document.createElement('labs-toast');
      document.body.appendChild(toast);
    }
    toast.setAttribute('variant', args.variant || 'primary');
    toast.show('Item deleted', { actionText: 'Undo', duration: 4000 });
  }
};
