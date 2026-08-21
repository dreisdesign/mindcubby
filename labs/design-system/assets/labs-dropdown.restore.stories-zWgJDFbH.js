var r=Object.freeze,s=Object.defineProperty;var t=(o,d)=>r(s(o,"raw",{value:r(d||o.slice())}));import{x as a}from"./iframe-Dp47ayeH.js";import"./preload-helper-PPVm8Dsz.js";const l={title:"2. Components/Dropdown/Restore Action",component:"labs-dropdown",parameters:{controls:{hideNoControlsWarning:!0},docs:{description:{component:"Shows the Restore and Delete actions for an archived task using <labs-dropdown>."}}}};var n;const e=()=>a(n||(n=t([`
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
