import '../components/labs-list-section.js';
import '../components/labs-list-item.js';
import '../components/labs-checkbox.js';
import '../components/labs-dropdown.js';
import '../components/labs-details.js';

export default {
  title: '4. Patterns/List Section/Standardized Layout',
  parameters: {
    docs: {
      description: {
        component: 'Demonstrates modular list grouping using <labs-list-section> for both todo and archived sections, with consistent spacing.'
      }
    }
  }
};

export const TodayAndArchived = () => `
  <labs-list-section style="display: flex; flex-direction: column; gap: var(--space-md);">
    <labs-list-item variant="task">
      <labs-checkbox slot="control"></labs-checkbox>
      <span slot="content">Buy groceries</span>
      <labs-dropdown slot="actions"></labs-dropdown>
    </labs-list-item>
    <labs-list-item variant="task" checked>
      <labs-checkbox slot="control" checked></labs-checkbox>
      <span slot="content">Review pull requests</span>
      <labs-dropdown slot="actions"></labs-dropdown>
    </labs-list-item>
    <labs-list-item variant="task">
      <labs-checkbox slot="control"></labs-checkbox>
      <span slot="content">Team standup meeting</span>
      <labs-dropdown slot="actions"></labs-dropdown>
    </labs-list-item>
  </labs-list-section>
  <labs-details archived style="margin-top: var(--space-lg);">
    Archived — 3 tasks
    <div slot="content">
      <labs-list-section style="display: flex; flex-direction: column; gap: var(--space-lg);">
        <labs-list-item variant="task" state="archived">
          <labs-checkbox slot="control" checked disabled></labs-checkbox>
          <span slot="content">Archived: Lunch break</span>
          <labs-dropdown slot="actions" archived></labs-dropdown>
        </labs-list-item>
        <labs-list-item variant="task" state="archived">
          <labs-checkbox slot="control" checked disabled></labs-checkbox>
          <span slot="content">Archived: Code review session</span>
          <labs-dropdown slot="actions" archived></labs-dropdown>
        </labs-list-item>
        <labs-list-item variant="task" state="archived">
          <labs-checkbox slot="control" checked disabled></labs-checkbox>
          <span slot="content">Archived: Write documentation</span>
          <labs-dropdown slot="actions" archived></labs-dropdown>
        </labs-list-item>
      </labs-list-section>
    </div>
  </labs-details>
`;

TodayAndArchived.storyName = 'Today + Archived Sections';

export const MultiDayArchive = () => `
  <div style="max-width: 420px; margin: 0 auto;">
  <labs-details archived>
      Mon, Oct 13, 2025 — 1 task
      <div slot="content">
        <labs-list-section>
          <labs-list-item variant="task" state="archived">
            <labs-checkbox slot="control" checked disabled></labs-checkbox>
            <span slot="content">Fix bugs</span>
            <labs-dropdown slot="actions" archived></labs-dropdown>
          </labs-list-item>
        </labs-list-section>
      </div>
    </labs-details>
  <labs-details archived style="margin-top: var(--space-md);">
      Sun, Oct 12, 2025 — 2 tasks
      <div slot="content">
        <labs-list-section>
          <labs-list-item variant="task" state="archived">
            <labs-checkbox slot="control" checked disabled></labs-checkbox>
            <span slot="content">Design review</span>
            <labs-dropdown slot="actions" archived></labs-dropdown>
          </labs-list-item>
          <labs-list-item variant="task" state="archived">
            <labs-checkbox slot="control" checked disabled></labs-checkbox>
            <span slot="content">Planning session</span>
            <labs-dropdown slot="actions" archived></labs-dropdown>
          </labs-list-item>
        </labs-list-section>
      </div>
    </labs-details>
  </div>
`;

MultiDayArchive.storyName = 'Multi-Day Archive';
