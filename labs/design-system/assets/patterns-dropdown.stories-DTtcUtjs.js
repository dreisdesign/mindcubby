import"./labs-dropdown-CYE2Sz68.js";import"./labs-list-item-DatCmgQS.js";const u={title:"4. Patterns/Dropdown",component:"labs-dropdown",tags:["autodocs"],argTypes:{only:{name:"Only Menu Items",description:"Multi-select which menu items to render (archive, delete)",control:{type:"inline-check"},options:["archive","delete"]}},args:{only:["archive","delete"]}},o=({open:d=!1,archived:s=!0,restored:n=!1,only:e=["archive","delete"]}={})=>{const i=document.createElement("div");i.style.padding="20px",i.innerHTML="";const t=document.createElement("labs-list-item");t.setAttribute("value","Archived item"),s?t.setAttribute("archived",""):t.removeAttribute("archived"),n?t.setAttribute("restored",""):t.removeAttribute("restored");const r=document.createElement("labs-dropdown");return r.setAttribute("slot","actions"),d&&r.setAttribute("open",""),Array.isArray(e)&&e.length?r.setAttribute("only",e.join(",")):typeof e=="string"&&e&&r.setAttribute("only",e),t.appendChild(r),i.appendChild(t),i},a=({open:d=!1,archived:s=!1,restored:n=!1,only:e=["archive"]}={})=>{const i=document.createElement("div");i.style.padding="20px",i.innerHTML="";const t=document.createElement("labs-list-item");t.setAttribute("value","Item with dropdown"),s?t.setAttribute("archived",""):t.removeAttribute("archived"),n?t.setAttribute("restored",""):t.removeAttribute("restored");const r=document.createElement("labs-dropdown");return r.setAttribute("slot","actions"),d&&r.setAttribute("open",""),Array.isArray(e)&&e.length?r.setAttribute("only",e.join(",")):typeof e=="string"&&e&&r.setAttribute("only",e),t.appendChild(r),i.appendChild(t),i},l=({open:d=!1,only:s=["delete"]}={})=>{const n=document.createElement("div");n.style.padding="20px",n.innerHTML="";const e=document.createElement("labs-dropdown");return e.setAttribute("only","delete"),d&&e.setAttribute("open",""),n.appendChild(e),n},c=({open:d=!1,only:s=["archive","delete"]}={})=>{const n=document.createElement("div");n.style.padding="20px",n.innerHTML="";const e=document.createElement("labs-dropdown");return e.setAttribute("only","archive,delete"),d&&e.setAttribute("open",""),n.appendChild(e),n};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`({
  open = false,
  archived = true,
  restored = false,
  only = ['archive', 'delete']
} = {}) => {
  const wrap = document.createElement('div');
  wrap.style.padding = '20px';
  wrap.innerHTML = '';
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Archived item');
  if (archived) item.setAttribute('archived', '');else item.removeAttribute('archived');
  if (restored) item.setAttribute('restored', '');else item.removeAttribute('restored');
  // add dropdown into the actions slot for the archived list-item
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  if (open) dd.setAttribute('open', '');
  if (Array.isArray(only) && only.length) dd.setAttribute('only', only.join(','));else if (typeof only === 'string' && only) dd.setAttribute('only', only);
  item.appendChild(dd);
  wrap.appendChild(item);
  return wrap;
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`({
  open = false,
  archived = false,
  restored = false,
  only = ['archive']
} = {}) => {
  const wrap = document.createElement('div');
  wrap.style.padding = '20px';
  wrap.innerHTML = '';
  const item = document.createElement('labs-list-item');
  item.setAttribute('value', 'Item with dropdown');
  if (archived) item.setAttribute('archived', '');else item.removeAttribute('archived');
  if (restored) item.setAttribute('restored', '');else item.removeAttribute('restored');
  // Insert dropdown into the actions slot of the list item
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('slot', 'actions');
  if (open) dd.setAttribute('open', '');
  if (Array.isArray(only) && only.length) dd.setAttribute('only', only.join(','));else if (typeof only === 'string' && only) dd.setAttribute('only', only);
  item.appendChild(dd);
  wrap.appendChild(item);
  return wrap;
}`,...a.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`({
  open = false,
  only = ['delete']
} = {}) => {
  const wrap = document.createElement('div');
  wrap.style.padding = '20px';
  wrap.innerHTML = '';
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('only', 'delete');
  if (open) dd.setAttribute('open', '');
  wrap.appendChild(dd);
  return wrap;
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`({
  open = false,
  only = ['archive', 'delete']
} = {}) => {
  const wrap = document.createElement('div');
  wrap.style.padding = '20px';
  wrap.innerHTML = '';
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('only', 'archive,delete');
  if (open) dd.setAttribute('open', '');
  wrap.appendChild(dd);
  return wrap;
}`,...c.parameters?.docs?.source}}};const A=["InListArchive","InList","DeleteOnly","ArchiveAndDelete"];export{c as ArchiveAndDelete,l as DeleteOnly,a as InList,o as InListArchive,A as __namedExportsOrder,u as default};
