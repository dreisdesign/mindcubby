import '../../components/labs-card.js';
import '../../components/labs-button.js';
import '../../components/labs-icon.js';

export default {
    title: '3. Components (Wrapped)/Card/Warning',
    component: 'labs-card',
    parameters: {
        docs: {
            description: {
                component: 'A wrapped warning card variant using the canonical labs-card. Shows warning icon, header, description, actions, and close.'
            }
        }
    }
};

export const Default = () => {
    const card = document.createElement('labs-card');
    card.style.maxWidth = '420px';

    const header = document.createElement('span');
    header.slot = 'header';
    header.textContent = 'Warning';
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

    const warningIcon = document.createElement('labs-icon');
    warningIcon.setAttribute('name', 'warning');
    warningIcon.setAttribute('slot', 'icon');
    warningIcon.style.color = 'var(--color-warning-icon, #ffb300)';
    warningIcon.style.fontSize = '2.5rem';
    card.appendChild(warningIcon);

    const desc = document.createElement('span');
    desc.slot = 'description';
    desc.textContent = 'This action cannot be undone.';
    card.appendChild(desc);

    const actionsDiv = document.createElement('div');
    actionsDiv.slot = 'actions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '10px';
    actionsDiv.style.justifyContent = 'flex-end';
    const deleteBtn = document.createElement('labs-button');
    deleteBtn.setAttribute('variant', 'destructive');
    deleteBtn.textContent = 'Delete';
    actionsDiv.appendChild(deleteBtn);
    card.appendChild(actionsDiv);

    return card;
};
