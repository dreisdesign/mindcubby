import '../../components/labs-card.js';
import '../../components/labs-button.js';
import '../../components/labs-icon.js';

export default {
    title: '3. Components (Wrapped)/Card/Welcome',
    component: 'labs-card',
    parameters: {
        docs: {
            description: {
                component: 'A wrapped welcome card variant using the canonical labs-card. Shows header, description, actions, and (optionally) an icon.'
            }
        }
    }
};

export const Default = () => {
    const card = document.createElement('labs-card');
    card.setAttribute('variant', 'welcome');
    card.style.maxWidth = '420px';

    const header = document.createElement('span');
    header.slot = 'header';
    header.textContent = 'Welcome!';
    card.appendChild(header);

    // Optionally add an icon (uncomment if needed)
    // const icon = document.createElement('labs-icon');
    // icon.setAttribute('name', 'star');
    // icon.setAttribute('slot', 'icon');
    // icon.style.color = 'var(--color-primary, #007bff)';
    // icon.style.fontSize = '2rem';
    // card.appendChild(icon);

    const desc = document.createElement('div');
    desc.slot = 'description';
    desc.textContent = 'Get started by exploring our design system components.';
    card.appendChild(desc);

    const actionsDiv = document.createElement('div');
    actionsDiv.slot = 'actions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '10px';
    actionsDiv.style.justifyContent = 'center';
    const getStartedBtn = document.createElement('labs-button');
    getStartedBtn.setAttribute('variant', 'primary');
    getStartedBtn.textContent = 'Get Started';
    actionsDiv.appendChild(getStartedBtn);
    card.appendChild(actionsDiv);

    return card;
};
