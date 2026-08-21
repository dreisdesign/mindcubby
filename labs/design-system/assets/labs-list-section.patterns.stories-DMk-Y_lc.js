import"./labs-list-item-DatCmgQS.js";import"./labs-checkbox-XNLbBo6c.js";import"./labs-dropdown-CYE2Sz68.js";import"./labs-details-BfGlFGjL.js";class e extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.render()}static get observedAttributes(){return["gap"]}attributeChangedCallback(){this.render()}render(){const a=this.getAttribute("gap")||"var(--list-gap, var(--space-sm, 12px))";this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          gap: ${a};
          width: 100%;
        }
      </style>
      <slot></slot>
    `}}customElements.get("labs-list-section")||customElements.define("labs-list-section",e);const d={title:"4. Patterns/List Section/Standardized Layout",parameters:{docs:{description:{component:"Demonstrates modular list grouping using <labs-list-section> for both todo and archived sections, with consistent spacing."}}}},s=()=>`
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
`;s.storyName="Today + Archived Sections";const t=()=>`
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
`;t.storyName="Multi-Day Archive";s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => \`
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
\``,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => \`
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
\``,...t.parameters?.docs?.source}}};const r=["TodayAndArchived","MultiDayArchive"];export{t as MultiDayArchive,s as TodayAndArchived,r as __namedExportsOrder,d as default};
