import '../components/labs-overlay.js';
import '../components/labs-button.js';
import '../components/labs-card.js';

export default {
  title: '2. Components/Overlay',
  parameters: {
    docs: {
      description: {
        component: 'A modal overlay component with backdrop blur and customizable content.'
      }
    }
  }
};

export const OverlayWithCard = {
  name: 'Overlay with Card',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <labs-button id="open-overlay-btn" pill>Open Overlay</labs-button>
      <labs-overlay id="card-overlay">
        <labs-card>
          <h2 slot="header">Overlay with Card</h2>
          <p>This overlay contains a card with a header, content, and actions.</p>
          <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px;">
            <labs-button pill variant="secondary" onclick="document.getElementById('card-overlay').close()">Cancel</labs-button>
            <labs-button pill variant="primary" onclick="document.getElementById('card-overlay').close()">Confirm</labs-button>
          </div>
        </labs-card>
      </labs-overlay>
    `;

    const openBtn = container.querySelector('#open-overlay-btn');
    const overlay = container.querySelector('#card-overlay');

    openBtn.addEventListener('click', () => {
      overlay.open();
    });

    return container;
  }
};

export const OpenOverlay = {
  name: 'Open by default',
  render: () => {
    return `
        <labs-overlay open>
          <labs-card>
            <h2 slot="header">Open Overlay</h2>
            <p>This overlay is open by default.</p>
            <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px;">
              <labs-button pill variant="secondary" onclick="this.closest('labs-overlay').close()">Close</labs-button>
            </div>
          </labs-card>
        </labs-overlay>
      `;
  }
};
