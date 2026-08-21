import"./labs-dropdown-CYE2Sz68.js";import"./labs-list-item-DatCmgQS.js";const d={title:"4. Patterns/Dropdown - Contextual",component:"labs-dropdown",parameters:{docs:{description:{component:"Dropdown in real-world contexts: in list (active, archived, restored). All stories use a real labs-list-item. Actions are determined by state."}}}},r=()=>{const e=document.createElement("labs-list-item");e.setAttribute("value","Active item");const t=document.createElement("labs-dropdown");return t.setAttribute("slot","actions"),t.setAttribute("only","archive,delete"),e.appendChild(t),e};r.storyName="In List (Active)";const s=()=>{const e=document.createElement("labs-list-item");e.setAttribute("value","Archived item"),e.setAttribute("archived","");const t=document.createElement("labs-dropdown");return t.setAttribute("slot","actions"),t.setAttribute("only","restore,delete"),e.appendChild(t),e};s.storyName="In List (Archived)";const n=()=>{const e=document.createElement("labs-list-item");e.setAttribute("value","Restored item"),e.setAttribute("restored","");const t=document.createElement("labs-dropdown");return t.setAttribute("slot","actions"),t.setAttribute("only","archive,delete"),e.appendChild(t),e};n.storyName="In List (Restored)";r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Active item');
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  dd.setAttribute('only', 'archive,delete');
  item.appendChild(dd);
  return item;
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Archived item');
  item.setAttribute('archived', '');
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  dd.setAttribute('only', 'restore,delete');
  item.appendChild(dd);
  return item;
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`() => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Restored item');
  item.setAttribute('restored', '');
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  dd.setAttribute('only', 'archive,delete');
  item.appendChild(dd);
  return item;
}`,...n.parameters?.docs?.source}}};const a=["InListActive","InListArchived","InListRestored"];export{r as InListActive,s as InListArchived,n as InListRestored,a as __namedExportsOrder,d as default};
