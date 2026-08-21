import '../../components/labs-toast.js';
import '../../components/labs-button.js';

export default {
  title: '4. Patterns/Toast',
  tags: ['autodocs'],
  parameters: { viewMode: 'docs' }
};

export const UndoOnly = {
  name: 'Undo Only',
  render: () => `
    <div style="padding:20px;">
      <labs-button id="show-undo" variant="primary" pill>Show Undo Toast</labs-button>
    </div>
  `,
  // Use Storybook's play function to attach JS in a way Storybook executes in the canvas
  play: async ({ canvasElement }) => {
    const root = canvasElement || document;
    const btn = root.querySelector('#show-undo');
    if (!btn) return;
    const handler = () => {
      let toast = document.querySelector('labs-toast');
      if (!toast) {
        toast = document.createElement('labs-toast');
        document.body.appendChild(toast);
      }
      toast.show('Item moved to archive', { actionText: 'Undo', duration: 5000 });
      const onAction = () => {
        toast.removeEventListener('action', onAction);
        document.dispatchEvent(new CustomEvent('pattern-undo', { detail: {} }));
      };
      toast.addEventListener('action', onAction);
    };

    // Remove any previous listener to avoid duplicate wiring during hot reloads
    btn.removeEventListener('click', handler);
    btn.addEventListener('click', handler);
  }
};
