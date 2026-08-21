

import '../components/labs-checkbox.js';
import '../components/labs-dropdown.js';
import '../components/labs-list-item.js';

export default {
  title: '4. Patterns/List Item/Task Pattern',
  component: 'labs-list-item',
  parameters: {
    controls: { hideNoControlsWarning: true },
    docs: {
      description: {
        component: 'Demonstrates Today-List task row patterns: active, archived, and past, with unified dropdown actions.'
      }
    }
  }
};

export const ActiveToday = () => `
  <labs-list-item variant="task">
    <labs-checkbox slot="control"></labs-checkbox>
    <span slot="content">Active task (today)</span>
    <labs-dropdown slot="actions"></labs-dropdown>
  </labs-list-item>
`;

export const ArchivedToday = () => `
  <labs-list-item variant="task" state="archived">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Archived task (today)</span>
    <labs-dropdown slot="actions" archived></labs-dropdown>
  </labs-list-item>
`;

export const PastDay = () => `
  <labs-list-item variant="task">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Task from past day</span>
    <labs-dropdown slot="actions" only="restore,delete"></labs-dropdown>
  </labs-list-item>
`;

ActiveToday.storyName = 'Active (Today)';
ArchivedToday.storyName = 'Archived (Today)';
PastDay.storyName = 'Past Day';
