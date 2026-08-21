// Story: With Archived List Item in labs-details
export const WithArchivedListItem = () => {
    const details = document.createElement('labs-details');
    details.append('Archived');
    const archivedItem = document.createElement('labs-list-item');
    archivedItem.setAttribute('variant', 'text-only');
    archivedItem.setAttribute('state', 'archived');
    archivedItem.innerHTML = '<span slot="content">Archived item</span>';
    // Place the archived item in the details content slot
    const contentDiv = document.createElement('div');
    contentDiv.setAttribute('slot', 'content');
    contentDiv.appendChild(archivedItem);
    details.appendChild(contentDiv);
    return details;
};
WithArchivedListItem.storyName = 'With Archived List Item';
import '../components/labs-list-item.js';
import '../components/labs-checkbox.js';
import '../components/labs-icon.js';

export default {
    title: '2. Components/List Item',
    component: 'labs-list-item',
    parameters: {
        docs: {
            description: {
                component: 'Canonical labs-list-item story. Shows the raw API, attributes, and slots for the base list item component.'
            }
        }
    },
    argTypes: {
        variant: { control: { type: 'select' }, options: ['text-only', 'timestamp', 'task'], description: 'Variant of the list item' },
        state: { control: { type: 'select' }, options: ['', 'archived'], description: 'State of the list item (e.g., archived)' },
        text: { control: 'text', description: 'Text content for the list item' },
        timestamp: { control: 'text', description: 'Timestamp (ISO string)' },
        checked: {
            control: 'boolean',
            description: 'Checked state (only for task variant)',
            if: { arg: 'variant', eq: 'task' }
        },
    },
    args: {
        variant: 'text-only',
        state: '',
        text: 'Sample item',
        timestamp: '',
        checked: false,
    },
};


export const Default = ({ variant, state, text, timestamp, checked }) => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('variant', variant);
    item.innerHTML = '';
    item.removeAttribute('timestamp');
    item.removeAttribute('checked');
    if (state) item.setAttribute('state', state); else item.removeAttribute('state');

    // TEXT-ONLY variant: match wrapped story
    if (variant === 'text-only') {
        const content = document.createElement('span');
        content.setAttribute('slot', 'content');
        content.textContent = text;
        item.appendChild(content);
    }

    // TIMESTAMP variant: match wrapped story
    if (variant === 'timestamp') {
        if (timestamp) item.setAttribute('timestamp', timestamp);
        const icon = document.createElement('labs-icon');
        icon.setAttribute('slot', 'control');
        icon.setAttribute('name', 'check');
        icon.setAttribute('aria-hidden', 'true');
        item.appendChild(icon);
        const content = document.createElement('div');
        content.setAttribute('slot', 'content');
        content.textContent = text || 'Timestamped item';
        item.appendChild(content);
    }

    // TASK variant: match wrapped story
    if (variant === 'task') {
        if (checked) item.setAttribute('checked', '');
        const checkbox = document.createElement('labs-checkbox');
        checkbox.setAttribute('slot', 'control');
        if (checked) checkbox.setAttribute('checked', '');
        item.appendChild(checkbox);
        const content = document.createElement('div');
        content.setAttribute('slot', 'content');
        content.textContent = text;
        item.appendChild(content);
        const dropdown = document.createElement('labs-dropdown');
        dropdown.setAttribute('slot', 'actions');
        item.appendChild(dropdown);
    }
    return item;
};

export const TextOnly = Default.bind({});
TextOnly.args = {
    variant: 'text-only',
    text: 'Sample item',
    timestamp: '',
    checked: false,
};
TextOnly.storyName = 'Text Only';

export const Timestamp = Default.bind({});
Timestamp.args = {
    variant: 'timestamp',
    text: 'Timestamped item',
    timestamp: new Date().toISOString(),
    checked: false,
};
Timestamp.storyName = 'Timestamp';

export const Task = Default.bind({});
Task.args = {
    variant: 'task',
    text: 'Task item',
    timestamp: '',
    checked: true,
};
Task.storyName = 'Task';
