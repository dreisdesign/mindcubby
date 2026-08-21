import"./labs-dropdown-CYE2Sz68.js";const a={title:"3. Components (Wrapped)/Dropdown",component:"labs-dropdown",parameters:{docs:{description:{component:"Wrapped dropdown: each story is a fixed, real-world combo. Always open."}}}},r=()=>{const t=document.createElement("labs-list-item");t.setAttribute("value","Archive");const e=document.createElement("labs-dropdown");return e.setAttribute("slot","actions"),e.setAttribute("only","archive"),e.setAttribute("open",""),t.appendChild(e),t};r.storyName="1: Archive";const s=()=>{const t=document.createElement("labs-list-item");t.setAttribute("value","Delete");const e=document.createElement("labs-dropdown");return e.setAttribute("slot","actions"),e.setAttribute("only","delete"),e.setAttribute("open",""),t.appendChild(e),t};s.storyName="1: Delete";const n=()=>{const t=document.createElement("labs-list-item");t.setAttribute("value","Restore (archived)"),t.setAttribute("archived","");const e=document.createElement("labs-dropdown");return e.setAttribute("slot","actions"),e.setAttribute("only","restore"),e.setAttribute("open",""),t.appendChild(e),t};n.storyName="1: Restore";const o=()=>{const t=document.createElement("labs-list-item");t.setAttribute("value","Archive + Delete");const e=document.createElement("labs-dropdown");return e.setAttribute("slot","actions"),e.setAttribute("only","archive,delete"),e.setAttribute("open",""),t.appendChild(e),t};o.storyName="2: Archive + Delete";const d=()=>{const t=document.createElement("labs-list-item");t.setAttribute("value","Restore + Delete (archived)"),t.setAttribute("archived","");const e=document.createElement("labs-dropdown");return e.setAttribute("slot","actions"),e.setAttribute("only","restore,delete"),e.setAttribute("open",""),t.appendChild(e),t};d.storyName="2: Restore + Delete";r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Archive');
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  dd.setAttribute('only', 'archive');
  dd.setAttribute('open', '');
  item.appendChild(dd);
  return item;
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Delete');
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  dd.setAttribute('only', 'delete');
  dd.setAttribute('open', '');
  item.appendChild(dd);
  return item;
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`() => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Restore (archived)');
  item.setAttribute('archived', '');
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  dd.setAttribute('only', 'restore');
  dd.setAttribute('open', '');
  item.appendChild(dd);
  return item;
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`() => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Archive + Delete');
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  dd.setAttribute('only', 'archive,delete');
  dd.setAttribute('open', '');
  item.appendChild(dd);
  return item;
}`,...o.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`() => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Restore + Delete (archived)');
  item.setAttribute('archived', '');
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  dd.setAttribute('only', 'restore,delete');
  dd.setAttribute('open', '');
  item.appendChild(dd);
  return item;
}`,...d.parameters?.docs?.source}}};const c=["Archive","Delete","Restore","ArchiveDelete","RestoreDelete"];export{r as Archive,o as ArchiveDelete,s as Delete,n as Restore,d as RestoreDelete,c as __namedExportsOrder,a as default};
