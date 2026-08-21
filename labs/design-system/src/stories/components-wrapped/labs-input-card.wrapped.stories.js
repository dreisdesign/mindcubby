import '../../components/labs-card.js';
import '../../components/labs-button.js';
import '../../components/labs-icon.js';
import '../../components/labs-input.js';

export default {
    title: '3. Components (Wrapped)/Card/Input',
    component: 'labs-card',
    parameters: {
        docs: {
            description: {
                component: 'A wrapped input card variant using the canonical labs-card. Prefills header, input, actions, and close.'
            }
        }
    }
};

export const Default = () => {
    const card = document.createElement('labs-card');
    card.style.maxWidth = '420px';

    const header = document.createElement('span');
    header.slot = 'header';
    header.textContent = 'New item';
    card.appendChild(header);

    const closeBtn = document.createElement('labs-button');
    closeBtn.slot = 'close';
    closeBtn.setAttribute('variant', 'icon');
    closeBtn.setAttribute('aria-label', 'Close');
    const icon = document.createElement('labs-icon');
    icon.setAttribute('name', 'close');
    icon.setAttribute('slot', 'icon-left');
    icon.setAttribute('width', '24');
    icon.setAttribute('height', '24');
    closeBtn.appendChild(icon);
    card.appendChild(closeBtn);

    const inputDiv = document.createElement('div');
    inputDiv.slot = 'input';
    inputDiv.className = 'input-row';
    const input = document.createElement('labs-input');
    input.setAttribute('placeholder', 'What do you want to do?');
    inputDiv.appendChild(input);
    card.appendChild(inputDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.slot = 'actions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '10px';
    actionsDiv.style.justifyContent = 'flex-end';
    const cancelBtn = document.createElement('labs-button');
    cancelBtn.setAttribute('variant', 'secondary');
    cancelBtn.textContent = 'Cancel';
    const saveBtn = document.createElement('labs-button');
    saveBtn.setAttribute('variant', 'primary');
    saveBtn.textContent = 'Save';
    actionsDiv.appendChild(cancelBtn);
    actionsDiv.appendChild(saveBtn);
    card.appendChild(actionsDiv);

    return card;
};
