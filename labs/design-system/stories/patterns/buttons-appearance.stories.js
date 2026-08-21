
import '../../components/labs-button.js';
import '../../components/labs-icon.js';

export default {
  title: '4. Patterns/Buttons/Appearance',
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'destructive'],
      description: 'Visual variant for the button',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A pattern for a theme appearance button (light/dark mode toggle) using Labs Button.'
      }
    }
  }
};

export const Appearance = {
  args: {
    variant: 'secondary',
  },
  render: ({ variant }) => {
    const btn = document.createElement('labs-button');
    btn.setAttribute('variant', variant);
    btn.setAttribute('size', 'large');
    btn.style.width = '100%';
    btn.style.justifyContent = 'flex-start';
    btn.style.margin = '0';
    btn.style.position = 'static';
    btn.id = 'appearance-btn';
    function updateLabel() {
      const isDark = document.documentElement.classList.contains('theme-dark');
      while (btn.firstChild) btn.removeChild(btn.firstChild);
      const icon = document.createElement('labs-icon');
      icon.setAttribute('slot', 'icon-left');
      icon.setAttribute('name', isDark ? 'bedtime_off' : 'bedtime');
      btn.appendChild(icon);
      btn.appendChild(document.createTextNode(isDark ? 'Turn on light mode' : 'Turn on dark mode'));
    }
    btn.onclick = () => {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const root = document.documentElement;
      const flavorClass = Array.from(root.classList).find(c => c.startsWith('flavor-'));
      const flavor = flavorClass ? flavorClass.replace('flavor-', '') : 'vanilla';
      import('../../utils/theme.js').then(({ applyTheme }) => {
        applyTheme({ flavor, theme: isDark ? 'light' : 'dark' });
        updateLabel();
      });
    };
    // Keep the visible label in sync with external theme changes
    const observer = new MutationObserver(() => updateLabel());
    try {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } catch (e) { }
    updateLabel();
    return btn;
  }
};
