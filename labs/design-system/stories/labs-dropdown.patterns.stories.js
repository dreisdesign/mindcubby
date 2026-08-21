import '../components/labs-dropdown.js';
import '../components/labs-list-item.js';

export default {
    title: '4. Patterns/Dropdown - Contextual',
    component: 'labs-dropdown',
    parameters: {
        docs: {
            description: {
                component: 'Dropdown in real-world contexts: in list (active, archived, restored). All stories use a real labs-list-item. Actions are determined by state.'
            }
        }
    }
};




export const InListActive = () => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('value', 'Active item');
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('slot', 'actions');
    dd.setAttribute('only', 'archive,delete');
    item.appendChild(dd);
    return item;
};
InListActive.storyName = 'In List (Active)';



export const InListArchived = () => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('value', 'Archived item');
    item.setAttribute('archived', '');
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('slot', 'actions');
    dd.setAttribute('only', 'restore,delete');
    item.appendChild(dd);
    return item;
};
InListArchived.storyName = 'In List (Archived)';




export const InListRestored = () => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('value', 'Restored item');
    item.setAttribute('restored', '');
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('slot', 'actions');
    dd.setAttribute('only', 'archive,delete');
    item.appendChild(dd);
    return item;
};
InListRestored.storyName = 'In List (Restored)';


// Docs/Usage removed; use autodocs
