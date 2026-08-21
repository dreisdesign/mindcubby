import"./labs-dropdown-CYE2Sz68.js";const d={title:"3. Components (Wrapped)/Dropdown",parameters:{docs:{description:{component:"Preconfigured, reusable dropdown menu variants for common actions (archive, delete, both). Use these as drop-in menu actions in list items, cards, etc."}}},argTypes:{open:{control:"boolean",description:"Open state"}},args:{open:!1}},r=({open:t=!1}={})=>{const e=document.createElement("labs-dropdown");return e.setAttribute("only","archive"),t&&e.setAttribute("open",""),e};r.storyName="Archive Only";const n=({open:t=!1}={})=>{const e=document.createElement("labs-dropdown");return e.setAttribute("only","delete"),t&&e.setAttribute("open",""),e};n.storyName="Delete Only";const o=({open:t=!1}={})=>{const e=document.createElement("labs-dropdown");return e.setAttribute("only","archive,delete"),t&&e.setAttribute("open",""),e};o.storyName="Archive + Delete";r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`({
  open = false
} = {}) => {
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('only', 'archive');
  if (open) dd.setAttribute('open', '');
  return dd;
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`({
  open = false
} = {}) => {
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('only', 'delete');
  if (open) dd.setAttribute('open', '');
  return dd;
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`({
  open = false
} = {}) => {
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('only', 'archive,delete');
  if (open) dd.setAttribute('open', '');
  return dd;
}`,...o.parameters?.docs?.source}}};const a=["ArchiveOnly","DeleteOnly","ArchiveAndDelete"];export{o as ArchiveAndDelete,r as ArchiveOnly,n as DeleteOnly,a as __namedExportsOrder,d as default};
