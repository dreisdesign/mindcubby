import"./labs-list-item-DatCmgQS.js";import"./labs-checkbox-XNLbBo6c.js";import"./labs-dropdown-CYE2Sz68.js";import"./labs-toast-CKxwLR35.js";import"./iframe-Dvm2aYCR.js";import{i as y}from"./icons-list-BupfDT4a.js";import"./preload-helper-PPVm8Dsz.js";function b(t,r){const e=Number(t),n=String(r).padStart(2,"0"),o=e>=12?"PM":"AM";let a=e%12;return a===0&&(a=12),`${a.toString().padStart(2,"0")}:${n} ${o}`}function x(t){if(t==null||t==="")return"";const r=typeof t=="number"?t:Number(t);let e;if(isNaN(r)?e=new Date(String(t)):e=new Date(r),isNaN(e.getTime()))return String(t);const n=new Date,o=n.toISOString().slice(0,10),a=e.toISOString().slice(0,10),i=b(e.getHours(),String(e.getMinutes()).padStart(2,"0"));if(a===o)return`Today ${i}`;const s=new Date(n);s.setDate(n.getDate()-1);const c=s.toISOString().slice(0,10);if(a===c)return`Yesterday ${i}`;const w={year:"numeric",month:"short",day:"numeric"};return`${e.toLocaleDateString(void 0,w)} ${i}`}const S={title:"3. Components (Wrapped)/List Item"},l=({text:t="Buy groceries",checked:r=!1})=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="16px",e.style.width="100%",e.style.maxWidth="600px",e.style.margin="0 auto";const n=document.createElement("labs-list-item"),o=document.createElement("labs-checkbox");o.setAttribute("slot","control"),r&&o.setAttribute("checked","");const a=document.createElement("div");a.setAttribute("slot","content"),a.textContent=t;const i=document.createElement("labs-dropdown");i.setAttribute("slot","actions"),n.appendChild(o),n.appendChild(a),n.appendChild(i);const s=document.createElement("labs-toast");return e.appendChild(n),e.appendChild(s),n.addEventListener("toggle",c=>{console.log("Task toggled:",c.detail)}),n.addEventListener("archive",c=>{console.log("Task archived:",c.detail),s.show("Task archived",{duration:3e3})}),n.addEventListener("remove",c=>{console.log("Task removed:",c.detail),s.show("Task removed",{actionText:"Undo",duration:4e3}),s.addEventListener("action",()=>{e.contains(n)||e.insertBefore(n,s)},{once:!0})}),n.addEventListener("restore",c=>{console.log("Task restored:",c.detail),s.show("Task restored",{duration:3e3})}),e};l.argTypes={text:{control:"text",description:"Task text content"},checked:{control:"boolean",description:"Checked state"}};l.args={text:"Buy groceries",checked:!1};const m=()=>{const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="12px",t.style.width="100%",t.style.maxWidth="600px",t.style.margin="0 auto",[{text:"Morning workout",checked:!0},{text:"Review pull requests",checked:!1},{text:"Team standup meeting",checked:!1},{text:"Lunch break",checked:!1},{text:"Code review session",checked:!1}].forEach(({text:e,checked:n})=>{const o=document.createElement("labs-list-item"),a=document.createElement("labs-checkbox");a.setAttribute("slot","control"),n&&a.setAttribute("checked","");const i=document.createElement("div");i.setAttribute("slot","content"),i.textContent=e;const s=document.createElement("labs-dropdown");s.setAttribute("slot","actions"),o.appendChild(a),o.appendChild(i),o.appendChild(s),t.appendChild(o)}),t},p=({text:t="Simple text item"})=>{const r=document.createElement("div");r.style.display="flex",r.style.flexDirection="column",r.style.gap="16px",r.style.width="100%",r.style.maxWidth="600px",r.style.margin="0 auto";const e=document.createElement("labs-list-item");e.setAttribute("variant","text-only");const n=document.createElement("span");return n.setAttribute("slot","content"),n.textContent=t,e.appendChild(n),r.appendChild(e),r};p.argTypes={text:{control:"text",description:"Text content for the list item"}};p.args={text:"Simple text item"};const u=()=>{const t=document.createElement("div");return t.style.display="flex",t.style.flexDirection="column",t.style.gap="12px",t.style.width="100%",t.style.maxWidth="600px",t.style.margin="0 auto",["First text item","Second text item","Third text item","Fourth text item","Fifth text item"].forEach(e=>{const n=document.createElement("labs-list-item");n.setAttribute("variant","text-only");const o=document.createElement("span");o.setAttribute("slot","content"),o.textContent=e,n.appendChild(o),t.appendChild(n)}),t},d=({icon:t="check"})=>{const r=document.createElement("div");r.style.display="flex",r.style.flexDirection="column",r.style.gap="16px",r.style.width="100%",r.style.maxWidth="600px",r.style.margin="0 auto";const e=document.createElement("labs-list-item");e.setAttribute("variant","timestamp");const n=new Date;e.setAttribute("timestamp",n.toISOString());const o=document.createElement("labs-icon");o.setAttribute("slot","control"),o.setAttribute("name",t||"check"),o.setAttribute("aria-hidden","true");const a=document.createElement("div");return a.setAttribute("slot","content"),a.textContent=x(n),e.appendChild(o),e.appendChild(a),r.appendChild(e),r};d.argTypes={icon:{control:{type:"select"},options:y,description:"Icon name from labs-icon library"}};d.args={icon:"check"};const h=()=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="12px",t.style.width="100%",t.style.maxWidth="600px",t.style.margin="0 auto";for(let r=0;r<5;r++){const e=document.createElement("labs-list-item");e.setAttribute("variant","timestamp");const n=new Date(Date.now()-r*6e4);e.setAttribute("timestamp",n.toISOString());const o=document.createElement("labs-icon");o.setAttribute("slot","control"),o.setAttribute("name","check"),o.setAttribute("aria-hidden","true");const a=document.createElement("div");a.setAttribute("slot","content"),a.textContent=x(n),e.appendChild(o),e.appendChild(a),t.appendChild(e)}return t};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`({
  text = 'Buy groceries',
  checked = false
}) => {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '16px';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '0 auto';
  const item = document.createElement('labs-list-item');
  const checkbox = document.createElement('labs-checkbox');
  checkbox.setAttribute('slot', 'control');
  if (checked) checkbox.setAttribute('checked', '');
  const content = document.createElement('div');
  content.setAttribute('slot', 'content');
  content.textContent = text;
  const dropdown = document.createElement('labs-dropdown');
  dropdown.setAttribute('slot', 'actions');
  item.appendChild(checkbox);
  item.appendChild(content);
  item.appendChild(dropdown);
  const toast = document.createElement('labs-toast');
  wrapper.appendChild(item);
  wrapper.appendChild(toast);
  item.addEventListener('toggle', e => {
    console.log('Task toggled:', e.detail);
  });
  item.addEventListener('archive', e => {
    console.log('Task archived:', e.detail);
    toast.show('Task archived', {
      duration: 3000
    });
  });
  item.addEventListener('remove', e => {
    console.log('Task removed:', e.detail);
    toast.show('Task removed', {
      actionText: 'Undo',
      duration: 4000
    });
    toast.addEventListener('action', () => {
      if (!wrapper.contains(item)) wrapper.insertBefore(item, toast);
    }, {
      once: true
    });
  });
  item.addEventListener('restore', e => {
    console.log('Task restored:', e.detail);
    toast.show('Task restored', {
      duration: 3000
    });
  });
  return wrapper;
}`,...l.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '12px';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '0 auto';
  const tasks = [{
    text: 'Morning workout',
    checked: true
  }, {
    text: 'Review pull requests',
    checked: false
  }, {
    text: 'Team standup meeting',
    checked: false
  }, {
    text: 'Lunch break',
    checked: false
  }, {
    text: 'Code review session',
    checked: false
  }];
  tasks.forEach(({
    text,
    checked
  }) => {
    const item = document.createElement('labs-list-item');
    const checkbox = document.createElement('labs-checkbox');
    checkbox.setAttribute('slot', 'control');
    if (checked) checkbox.setAttribute('checked', '');
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = text;
    const dropdown = document.createElement('labs-dropdown');
    dropdown.setAttribute('slot', 'actions');
    item.appendChild(checkbox);
    item.appendChild(content);
    item.appendChild(dropdown);
    wrapper.appendChild(item);
  });
  return wrapper;
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`({
  text = 'Simple text item'
}) => {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '16px';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '0 auto';
  const item = document.createElement('labs-list-item');
  item.setAttribute('variant', 'text-only');
  const span = document.createElement('span');
  span.setAttribute('slot', 'content');
  span.textContent = text;
  item.appendChild(span);
  wrapper.appendChild(item);
  return wrapper;
}`,...p.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '12px';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '0 auto';
  const items = ['First text item', 'Second text item', 'Third text item', 'Fourth text item', 'Fifth text item'];
  items.forEach(text => {
    const item = document.createElement('labs-list-item');
    item.setAttribute('variant', 'text-only');
    const span = document.createElement('span');
    span.setAttribute('slot', 'content');
    span.textContent = text;
    item.appendChild(span);
    wrapper.appendChild(item);
  });
  return wrapper;
}`,...u.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`({
  icon = 'check'
}) => {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '16px';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '0 auto';
  const item = document.createElement('labs-list-item');
  item.setAttribute('variant', 'timestamp');
  const now = new Date();
  item.setAttribute('timestamp', now.toISOString());
  const iconEl = document.createElement('labs-icon');
  iconEl.setAttribute('slot', 'control');
  iconEl.setAttribute('name', icon || 'check');
  iconEl.setAttribute('aria-hidden', 'true');
  const content = document.createElement('div');
  content.setAttribute('slot', 'content');
  content.textContent = formatHuman(now);
  item.appendChild(iconEl);
  item.appendChild(content);
  wrapper.appendChild(item);
  return wrapper;
}`,...d.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '12px';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '0 auto';
  for (let i = 0; i < 5; i++) {
    const item = document.createElement('labs-list-item');
    item.setAttribute('variant', 'timestamp');
    const now = new Date(Date.now() - i * 60000); // Each item 1 min apart
    item.setAttribute('timestamp', now.toISOString());
    const iconEl = document.createElement('labs-icon');
    iconEl.setAttribute('slot', 'control');
    iconEl.setAttribute('name', 'check');
    iconEl.setAttribute('aria-hidden', 'true');
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = formatHuman(now);
    item.appendChild(iconEl);
    item.appendChild(content);
    wrapper.appendChild(item);
  }
  return wrapper;
}`,...h.parameters?.docs?.source}}};const D=["Task","TaskMultiple","TextOnly","TextOnlyMultiple","Timestamp","TimestampMultiple"];export{l as Task,m as TaskMultiple,p as TextOnly,u as TextOnlyMultiple,d as Timestamp,h as TimestampMultiple,D as __namedExportsOrder,S as default};
