import '../components/labs-list-item.js';
export const WithArchivedListItem = () => {
    const details = document.createElement('labs-details');
    details.textContent = 'Archived'; // summary text as default slot

    const archivedItem = document.createElement('labs-list-item');
    archivedItem.setAttribute('variant', 'task');
    archivedItem.setAttribute('state', 'archived');
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = 'This is an archived item (50% opacity)';
    archivedItem.appendChild(content);

    // Place the archived item in the details content slot
    const contentDiv = document.createElement('div');
    contentDiv.setAttribute('slot', 'content');
    contentDiv.appendChild(archivedItem);
    details.appendChild(contentDiv);

    return details;
};
import '../components/labs-details.js';
import '../components/labs-icon.js';


export default {
    title: '2. Components/Details',
    component: 'labs-details',
    parameters: {
        docs: {
            description: {
                component: 'Canonical details/accordion component. Uses native <details> for accessibility. Slots: summary (header), default (content).'
            }
        }
    },
    argTypes: {
        variant: { control: { type: 'select' }, options: ['', 'secondary'], description: 'Visual variant' },
    },
    args: {
        variant: '',
    },
};


export const Default = ({ variant }) => {
    const details = document.createElement('labs-details');
    if (variant) details.setAttribute('variant', variant);

    const summary = document.createElement('span');
    summary.slot = 'summary';
    summary.innerHTML = '<labs-icon name="keyboard_arrow_right"></labs-icon> Expand Me';
    details.appendChild(summary);

    const content = document.createElement('div');
    content.textContent = 'This is the expandable content. You can put anything here.';
    details.appendChild(content);

    return details;
};

