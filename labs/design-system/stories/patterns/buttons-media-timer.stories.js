import '../../components/labs-button.js';
import '../../components/labs-icon.js';

export default {
  title: '4. Patterns/Buttons/Timer',
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'destructive'],
      description: 'Visual variant for the button',
    },
  },
  parameters: {
    layout: 'centered',
  },
};

const states = [
  { label: 'Start', icon: 'play_circle' },
  { label: 'Pause', icon: 'pause_circle' },
  { label: 'Resume', icon: 'not_started' },
];

export const Timer = {
  args: {
    variant: 'secondary',
  },
  render: ({ variant }) => {
    const btn = document.createElement('labs-button');
    btn.setAttribute('variant', variant);
    btn.setAttribute('pill', '');
    btn.setAttribute('size', 'large');
    btn.style.width = '100%';
    btn.style.justifyContent = 'flex-start';
    btn.style.margin = '0';
    btn.style.position = 'static';
    btn.id = 'timer-btn';
    let state = 0;

    function updateLabel() {
      while (btn.firstChild) btn.removeChild(btn.firstChild);
      const icon = document.createElement('labs-icon');
      icon.setAttribute('slot', 'icon-left');
      icon.setAttribute('name', states[state].icon);
      btn.appendChild(icon);
      btn.appendChild(document.createTextNode(states[state].label));
    }

    btn.onclick = () => {
      state = (state + 1) % states.length;
      updateLabel();
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