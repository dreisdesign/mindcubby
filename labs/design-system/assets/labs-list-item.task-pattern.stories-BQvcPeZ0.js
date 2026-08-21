import{x as o}from"./iframe-BlSllhYp.js";import"./preload-helper-PPVm8Dsz.js";const r={title:"Components/List Item/Task Pattern",component:"labs-list-item",parameters:{controls:{hideNoControlsWarning:!0},docs:{description:{component:"Demonstrates Today-List task row patterns: active, archived, and past, with unified dropdown actions."}}}},s=()=>o`
  <labs-list-item variant="task">
    <labs-checkbox slot="control"></labs-checkbox>
    <span slot="content">Active task (today)</span>
    <labs-dropdown slot="actions"></labs-dropdown>
  </labs-list-item>
`,t=()=>o`
  <labs-list-item variant="task" state="archived">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Archived task (today)</span>
    <labs-dropdown slot="actions" archived></labs-dropdown>
  </labs-list-item>
`,a=()=>o`
  <labs-list-item variant="task">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Task from past day</span>
    <labs-dropdown slot="actions" only="restore,delete"></labs-dropdown>
  </labs-list-item>
`;s.storyName="Active (Today)";t.storyName="Archived (Today)";a.storyName="Past Day";s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => html\`
  <labs-list-item variant="task">
    <labs-checkbox slot="control"></labs-checkbox>
    <span slot="content">Active task (today)</span>
    <labs-dropdown slot="actions"></labs-dropdown>
  </labs-list-item>
\``,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => html\`
  <labs-list-item variant="task" state="archived">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Archived task (today)</span>
    <labs-dropdown slot="actions" archived></labs-dropdown>
  </labs-list-item>
\``,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => html\`
  <labs-list-item variant="task">
    <labs-checkbox slot="control" disabled></labs-checkbox>
    <span slot="content">Task from past day</span>
    <labs-dropdown slot="actions" only="restore,delete"></labs-dropdown>
  </labs-list-item>
\``,...a.parameters?.docs?.source}}};const l=["ActiveToday","ArchivedToday","PastDay"];export{s as ActiveToday,t as ArchivedToday,a as PastDay,l as __namedExportsOrder,r as default};
