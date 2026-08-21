var r=Object.freeze,d=Object.defineProperty;var t=(o,s)=>r(d(o,"raw",{value:r(s||o.slice())}));import{h as a}from"./iframe-DJ9y7Ft9.js";import"./preload-helper-PPVm8Dsz.js";const l={title:"2. Components/Dropdown/Restore Action",component:"labs-dropdown",parameters:{controls:{hideNoControlsWarning:!0},docs:{description:{component:"Shows the Restore and Delete actions for an archived task using <labs-dropdown>."}}}};var n;const e=()=>a(n||(n=t([`
  <labs-dropdown archived slot="actions"></labs-dropdown>
  <script>
    const dropdown = document.querySelector('labs-dropdown[archived]');
    dropdown.addEventListener('restore', () => alert('Restore event fired'));
    dropdown.addEventListener('remove', () => alert('Delete event fired'));
  <\/script>
`])));e.storyName="Restore Action (Archived)";e.parameters={docs:{source:{code:'<labs-dropdown archived slot="actions"></labs-dropdown>'}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`() => html\`
  <labs-dropdown archived slot="actions"></labs-dropdown>
  <script>
    const dropdown = document.querySelector('labs-dropdown[archived]');
    dropdown.addEventListener('restore', () => alert('Restore event fired'));
    dropdown.addEventListener('remove', () => alert('Delete event fired'));
  <\/script>
\``,...e.parameters?.docs?.source}}};const m=["RestoreMenu"];export{e as RestoreMenu,m as __namedExportsOrder,l as default};
