import { html } from 'lit-html';

export default {
    title: '2. Components/Dropdown/Restore Action',
    component: 'labs-dropdown',
    parameters: {
        controls: { hideNoControlsWarning: true },
        docs: {
            description: {
                component: 'Shows the Restore and Delete actions for an archived task using <labs-dropdown>.'
            }
        }
    }
};

export const RestoreMenu = () => html`
  <labs-dropdown archived slot="actions"></labs-dropdown>
  <script>
    const dropdown = document.querySelector('labs-dropdown[archived]');
    dropdown.addEventListener('restore', () => alert('Restore event fired'));
    dropdown.addEventListener('remove', () => alert('Delete event fired'));
  </script>
`;
RestoreMenu.storyName = 'Restore Action (Archived)';
RestoreMenu.parameters = {
    docs: {
        source: {
            code: `<labs-dropdown archived slot="actions"></labs-dropdown>`
        }
    }
};
