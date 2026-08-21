
import '../components/labs-dropdown.js';

export default {
    title: '3. Components (Wrapped)/Dropdown',
    component: 'labs-dropdown',
    parameters: {
        docs: {
            description: {
                component: 'Wrapped dropdown: each story is a fixed, real-world combo. Always open.'
            }
        }
    }
};





// Archive
export const Archive = () => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('value', 'Archive');
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('slot', 'actions');
    dd.setAttribute('only', 'archive');
    dd.setAttribute('open', '');
    item.appendChild(dd);
    return item;
};
Archive.storyName = '1: Archive';

// Delete
export const Delete = () => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('value', 'Delete');
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('slot', 'actions');
    dd.setAttribute('only', 'delete');
    dd.setAttribute('open', '');
    item.appendChild(dd);
    return item;
};
Delete.storyName = '1: Delete';

// Restore
export const Restore = () => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('value', 'Restore (archived)');
    item.setAttribute('archived', '');
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('slot', 'actions');
    dd.setAttribute('only', 'restore');
    dd.setAttribute('open', '');
    item.appendChild(dd);
    return item;
};
Restore.storyName = '1: Restore';

// Archive + Delete
export const ArchiveDelete = () => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('value', 'Archive + Delete');
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('slot', 'actions');
    dd.setAttribute('only', 'archive,delete');
    dd.setAttribute('open', '');
    item.appendChild(dd);
    return item;
};
ArchiveDelete.storyName = '2: Archive + Delete';

// Restore + Delete
export const RestoreDelete = () => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('value', 'Restore + Delete (archived)');
    item.setAttribute('archived', '');
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('slot', 'actions');
    dd.setAttribute('only', 'restore,delete');
    dd.setAttribute('open', '');
    item.appendChild(dd);
    return item;
};
RestoreDelete.storyName = '2: Restore + Delete';
