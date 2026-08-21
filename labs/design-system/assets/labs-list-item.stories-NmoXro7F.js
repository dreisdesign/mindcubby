import"./labs-list-item-CUKhFGeZ.js";import"./labs-checkbox-XNLbBo6c.js";import"./iframe-DZDCPr1R.js";import"./preload-helper-PPVm8Dsz.js";const d=()=>{const n=document.createElement("labs-details");n.append("Archived");const i=document.createElement("labs-list-item");i.setAttribute("variant","text-only"),i.setAttribute("state","archived"),i.innerHTML='<span slot="content">Archived item</span>';const o=document.createElement("div");return o.setAttribute("slot","content"),o.appendChild(i),n.appendChild(o),n};d.storyName="With Archived List Item";const x={title:"2. Components/List Item",component:"labs-list-item",parameters:{docs:{description:{component:"Canonical labs-list-item story. Shows the raw API, attributes, and slots for the base list item component."}}},argTypes:{variant:{control:{type:"select"},options:["text-only","timestamp","task"],description:"Variant of the list item"},state:{control:{type:"select"},options:["","archived"],description:"State of the list item (e.g., archived)"},text:{control:"text",description:"Text content for the list item"},timestamp:{control:"text",description:"Timestamp (ISO string)"},checked:{control:"boolean",description:"Checked state (only for task variant)",if:{arg:"variant",eq:"task"}}},args:{variant:"text-only",state:"",text:"Sample item",timestamp:"",checked:!1}},a=({variant:n,state:i,text:o,timestamp:l,checked:p})=>{const t=document.createElement("labs-list-item");if(t.setAttribute("variant",n),t.innerHTML="",t.removeAttribute("timestamp"),t.removeAttribute("checked"),i?t.setAttribute("state",i):t.removeAttribute("state"),n==="text-only"){const e=document.createElement("span");e.setAttribute("slot","content"),e.textContent=o,t.appendChild(e)}if(n==="timestamp"){l&&t.setAttribute("timestamp",l);const e=document.createElement("labs-icon");e.setAttribute("slot","control"),e.setAttribute("name","check"),e.setAttribute("aria-hidden","true"),t.appendChild(e);const c=document.createElement("div");c.setAttribute("slot","content"),c.textContent=o||"Timestamped item",t.appendChild(c)}if(n==="task"){p&&t.setAttribute("checked","");const e=document.createElement("labs-checkbox");e.setAttribute("slot","control"),p&&e.setAttribute("checked",""),t.appendChild(e);const c=document.createElement("div");c.setAttribute("slot","content"),c.textContent=o,t.appendChild(c);const u=document.createElement("labs-dropdown");u.setAttribute("slot","actions"),t.appendChild(u)}return t},s=a.bind({});s.args={variant:"text-only",text:"Sample item",timestamp:"",checked:!1};s.storyName="Text Only";const r=a.bind({});r.args={variant:"timestamp",text:"Timestamped item",timestamp:new Date().toISOString(),checked:!1};r.storyName="Timestamp";const m=a.bind({});m.args={variant:"task",text:"Task item",timestamp:"",checked:!0};m.storyName="Task";d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`() => {
  const details = document.createElement('labs-details');
  details.append('Archived');
  const archivedItem = document.createElement('labs-list-item');
  archivedItem.setAttribute('variant', 'text-only');
  archivedItem.setAttribute('state', 'archived');
  archivedItem.innerHTML = '<span slot="content">Archived item</span>';
  // Place the archived item in the details content slot
  const contentDiv = document.createElement('div');
  contentDiv.setAttribute('slot', 'content');
  contentDiv.appendChild(archivedItem);
  details.appendChild(contentDiv);
  return details;
}`,...d.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`({
  variant,
  state,
  text,
  timestamp,
  checked
}) => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('variant', variant);
  item.innerHTML = '';
  item.removeAttribute('timestamp');
  item.removeAttribute('checked');
  if (state) item.setAttribute('state', state);else item.removeAttribute('state');

  // TEXT-ONLY variant: match wrapped story
  if (variant === 'text-only') {
    const content = document.createElement('span');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    item.appendChild(content);
  }

  // TIMESTAMP variant: match wrapped story
  if (variant === 'timestamp') {
    if (timestamp) item.setAttribute('timestamp', timestamp);
    const icon = document.createElement('labs-icon');
    icon.setAttribute('slot', 'control');
    icon.setAttribute('name', 'check');
    icon.setAttribute('aria-hidden', 'true');
    item.appendChild(icon);
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text || 'Timestamped item';
    item.appendChild(content);
  }

  // TASK variant: match wrapped story
  if (variant === 'task') {
    if (checked) item.setAttribute('checked', '');
    const checkbox = document.createElement('labs-checkbox');
    checkbox.setAttribute('slot', 'control');
    if (checked) checkbox.setAttribute('checked', '');
    item.appendChild(checkbox);
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    item.appendChild(content);
    const dropdown = document.createElement('labs-dropdown');
    dropdown.setAttribute('slot', 'actions');
    item.appendChild(dropdown);
  }
  return item;
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`({
  variant,
  state,
  text,
  timestamp,
  checked
}) => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('variant', variant);
  item.innerHTML = '';
  item.removeAttribute('timestamp');
  item.removeAttribute('checked');
  if (state) item.setAttribute('state', state);else item.removeAttribute('state');

  // TEXT-ONLY variant: match wrapped story
  if (variant === 'text-only') {
    const content = document.createElement('span');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    item.appendChild(content);
  }

  // TIMESTAMP variant: match wrapped story
  if (variant === 'timestamp') {
    if (timestamp) item.setAttribute('timestamp', timestamp);
    const icon = document.createElement('labs-icon');
    icon.setAttribute('slot', 'control');
    icon.setAttribute('name', 'check');
    icon.setAttribute('aria-hidden', 'true');
    item.appendChild(icon);
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text || 'Timestamped item';
    item.appendChild(content);
  }

  // TASK variant: match wrapped story
  if (variant === 'task') {
    if (checked) item.setAttribute('checked', '');
    const checkbox = document.createElement('labs-checkbox');
    checkbox.setAttribute('slot', 'control');
    if (checked) checkbox.setAttribute('checked', '');
    item.appendChild(checkbox);
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    item.appendChild(content);
    const dropdown = document.createElement('labs-dropdown');
    dropdown.setAttribute('slot', 'actions');
    item.appendChild(dropdown);
  }
  return item;
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`({
  variant,
  state,
  text,
  timestamp,
  checked
}) => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('variant', variant);
  item.innerHTML = '';
  item.removeAttribute('timestamp');
  item.removeAttribute('checked');
  if (state) item.setAttribute('state', state);else item.removeAttribute('state');

  // TEXT-ONLY variant: match wrapped story
  if (variant === 'text-only') {
    const content = document.createElement('span');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    item.appendChild(content);
  }

  // TIMESTAMP variant: match wrapped story
  if (variant === 'timestamp') {
    if (timestamp) item.setAttribute('timestamp', timestamp);
    const icon = document.createElement('labs-icon');
    icon.setAttribute('slot', 'control');
    icon.setAttribute('name', 'check');
    icon.setAttribute('aria-hidden', 'true');
    item.appendChild(icon);
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text || 'Timestamped item';
    item.appendChild(content);
  }

  // TASK variant: match wrapped story
  if (variant === 'task') {
    if (checked) item.setAttribute('checked', '');
    const checkbox = document.createElement('labs-checkbox');
    checkbox.setAttribute('slot', 'control');
    if (checked) checkbox.setAttribute('checked', '');
    item.appendChild(checkbox);
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    item.appendChild(content);
    const dropdown = document.createElement('labs-dropdown');
    dropdown.setAttribute('slot', 'actions');
    item.appendChild(dropdown);
  }
  return item;
}`,...r.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`({
  variant,
  state,
  text,
  timestamp,
  checked
}) => {
  const item = document.createElement('labs-list-item');
  item.setAttribute('variant', variant);
  item.innerHTML = '';
  item.removeAttribute('timestamp');
  item.removeAttribute('checked');
  if (state) item.setAttribute('state', state);else item.removeAttribute('state');

  // TEXT-ONLY variant: match wrapped story
  if (variant === 'text-only') {
    const content = document.createElement('span');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    item.appendChild(content);
  }

  // TIMESTAMP variant: match wrapped story
  if (variant === 'timestamp') {
    if (timestamp) item.setAttribute('timestamp', timestamp);
    const icon = document.createElement('labs-icon');
    icon.setAttribute('slot', 'control');
    icon.setAttribute('name', 'check');
    icon.setAttribute('aria-hidden', 'true');
    item.appendChild(icon);
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text || 'Timestamped item';
    item.appendChild(content);
  }

  // TASK variant: match wrapped story
  if (variant === 'task') {
    if (checked) item.setAttribute('checked', '');
    const checkbox = document.createElement('labs-checkbox');
    checkbox.setAttribute('slot', 'control');
    if (checked) checkbox.setAttribute('checked', '');
    item.appendChild(checkbox);
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    item.appendChild(content);
    const dropdown = document.createElement('labs-dropdown');
    dropdown.setAttribute('slot', 'actions');
    item.appendChild(dropdown);
  }
  return item;
}`,...m.parameters?.docs?.source}}};const k=["WithArchivedListItem","Default","TextOnly","Timestamp","Task"];export{a as Default,m as Task,s as TextOnly,r as Timestamp,d as WithArchivedListItem,k as __namedExportsOrder,x as default};
