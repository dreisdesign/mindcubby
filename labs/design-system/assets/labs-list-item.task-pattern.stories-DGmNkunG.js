import"./labs-checkbox-XNLbBo6c.js";import"./labs-dropdown-Dr0QiVIj.js";import"./labs-list-item-CUKhFGeZ.js";const r={title:"4. Patterns/List Item/Task Pattern",component:"labs-list-item",parameters:{controls:{hideNoControlsWarning:!0},docs:{description:{component:"Demonstrates Today-List task row patterns: active, archived, and past, with unified dropdown actions."}}}},s=()=>`
  <labs-list-item variant="task">
    <labs-checkbox slot="control"></labs-checkbox>
    <span slot="content">Active task (today)</span>
    <labs-dropdown slot="actions"></labs-dropdown>
  </labs-list-item>
`,t=()=>`
  <labs-list-item variant="task" state="archived">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Archived task (today)</span>
    <labs-dropdown slot="actions" archived></labs-dropdown>
  </labs-list-item>
`,a=()=>`
  <labs-list-item variant="task">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Task from past day</span>
    <labs-dropdown slot="actions" only="restore,delete"></labs-dropdown>
  </labs-list-item>
`;s.storyName="Active (Today)";t.storyName="Archived (Today)";a.storyName="Past Day";s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => \`
  <labs-list-item variant="task">
    <labs-checkbox slot="control"></labs-checkbox>
    <span slot="content">Active task (today)</span>
    <labs-dropdown slot="actions"></labs-dropdown>
  </labs-list-item>
\``,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => \`
  <labs-list-item variant="task" state="archived">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Archived task (today)</span>
    <labs-dropdown slot="actions" archived></labs-dropdown>
  </labs-list-item>
\``,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => \`
  <labs-list-item variant="task">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Task from past day</span>
    <labs-dropdown slot="actions" only="restore,delete"></labs-dropdown>
  </labs-list-item>
\``,...a.parameters?.docs?.source}}};const l=["ActiveToday","ArchivedToday","PastDay"];export{s as ActiveToday,t as ArchivedToday,a as PastDay,l as __namedExportsOrder,r as default};
