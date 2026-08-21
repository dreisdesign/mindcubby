import"./labs-dropdown-CYE2Sz68.js";import"./labs-list-item-DatCmgQS.js";const p={title:"2. Components/Dropdown",component:"labs-dropdown",tags:["autodocs"],argTypes:{open:{control:"boolean"},archived:{control:"boolean"},restored:{control:"boolean"},only:{name:"buttons",description:"Multi-select which menu items to render (archive, delete)",control:{type:"inline-check"},options:["archive","delete"]}},args:{open:!1,archived:!1,restored:!1,only:[]}},n=({open:s=!0,archived:d=!1,restored:a=!1,only:t=[]}={})=>{const e=document.createElement("div");e.style.padding="20px",e.innerHTML="";const r=document.createElement("labs-dropdown");return s&&r.setAttribute("open",""),Array.isArray(t)&&t.length?r.setAttribute("only",t.join(",")):typeof t=="string"&&t&&r.setAttribute("only",t),d&&r.setAttribute("archived",""),a&&r.setAttribute("restored",""),e.appendChild(r),e};n.args={open:!0};const o=({open:s=!1,archived:d=!1,restored:a=!1,only:t=[]}={})=>{const e=document.createElement("div");e.style.padding="8px",e.style.width="40px",e.style.display="flex",e.style.alignItems="center",e.style.justifyContent="center",e.style.boxSizing="border-box",e.innerHTML="";const r=document.createElement("labs-dropdown");return s&&r.setAttribute("open",""),d&&r.setAttribute("archived",""),a&&r.setAttribute("restored",""),Array.isArray(t)&&t.length?r.setAttribute("only",t.join(",")):typeof t=="string"&&t&&r.setAttribute("only",t),e.appendChild(r),e};o.args={only:[]};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`({
  open = true,
  archived = false,
  restored = false,
  only = []
} = {}) => {
  const wrap = document.createElement('div');
  wrap.style.padding = '20px';
  wrap.innerHTML = '';
  const dd = document.createElement('labs-dropdown');
  if (open) dd.setAttribute('open', '');
  if (Array.isArray(only) && only.length) dd.setAttribute('only', only.join(','));else if (typeof only === 'string' && only) dd.setAttribute('only', only);
  if (archived) dd.setAttribute('archived', '');
  if (restored) dd.setAttribute('restored', '');
  wrap.appendChild(dd);
  return wrap;
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`({
  open = false,
  archived = false,
  restored = false,
  only = []
} = {}) => {
  const wrap = document.createElement('div');
  wrap.style.padding = '8px';
  wrap.style.width = '40px';
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'center';
  wrap.style.justifyContent = 'center';
  wrap.style.boxSizing = 'border-box';
  wrap.innerHTML = '';
  const dd = document.createElement('labs-dropdown');
  if (open) dd.setAttribute('open', '');
  if (archived) dd.setAttribute('archived', '');
  if (restored) dd.setAttribute('restored', '');
  if (Array.isArray(only) && only.length) dd.setAttribute('only', only.join(','));else if (typeof only === 'string' && only) dd.setAttribute('only', only);
  wrap.appendChild(dd);
  return wrap;
}`,...o.parameters?.docs?.source}}};const c=["Open","Default"];export{o as Default,n as Open,c as __namedExportsOrder,p as default};
