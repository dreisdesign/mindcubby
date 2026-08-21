import"./labs-list-item-CUKhFGeZ.js";import"./labs-checkbox-XNLbBo6c.js";import"./labs-dropdown-Dr0QiVIj.js";import"./labs-toast-O_M40YTk.js";import"./iframe-DZDCPr1R.js";import{i as A}from"./icons-list-ByY2JTY4.js";import"./preload-helper-PPVm8Dsz.js";function C(e,n){const t=Number(e),r=String(n).padStart(2,"0"),o=t>=12?"PM":"AM";let s=t%12;return s===0&&(s=12),`${s.toString().padStart(2,"0")}:${r} ${o}`}function k(e){if(e==null||e==="")return"";const n=typeof e=="number"?e:Number(e);let t;if(isNaN(n)?t=new Date(String(e)):t=new Date(n),isNaN(t.getTime()))return String(e);const r=new Date,o=r.toISOString().slice(0,10),s=t.toISOString().slice(0,10),d=C(t.getHours(),String(t.getMinutes()).padStart(2,"0"));if(s===o)return`Today ${d}`;const i=new Date(r);i.setDate(r.getDate()-1);const a=i.toISOString().slice(0,10);if(s===a)return`Yesterday ${d}`;const g={year:"numeric",month:"short",day:"numeric"};return`${t.toLocaleDateString(void 0,g)} ${d}`}const F={title:"3. Components (Wrapped)/List Item"},l=({text:e="Buy groceries",checked:n=!1})=>{const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="16px",t.style.width="100%",t.style.maxWidth="600px",t.style.margin="0 auto";const r=document.createElement("labs-list-item"),o=document.createElement("labs-checkbox");o.setAttribute("slot","control"),n&&o.setAttribute("checked","");const s=document.createElement("div");s.setAttribute("slot","content"),s.textContent=e;const d=document.createElement("labs-dropdown");d.setAttribute("slot","actions"),r.appendChild(o),r.appendChild(s),r.appendChild(d);const i=document.createElement("labs-toast");return t.appendChild(r),t.appendChild(i),r.addEventListener("toggle",a=>{console.log("Task toggled:",a.detail)}),r.addEventListener("archive",a=>{console.log("Task archived:",a.detail),i.show("Task archived",{duration:3e3})}),r.addEventListener("remove",a=>{console.log("Task removed:",a.detail),i.show("Task removed",{actionText:"Undo",duration:4e3}),i.addEventListener("action",()=>{t.contains(r)||t.insertBefore(r,i)},{once:!0})}),r.addEventListener("restore",a=>{console.log("Task restored:",a.detail),i.show("Task restored",{duration:3e3})}),t};l.argTypes={text:{control:"text",description:"Task text content"},checked:{control:"boolean",description:"Checked state"}};l.args={text:"Buy groceries",checked:!1};const h=()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="12px",e.style.width="100%",e.style.maxWidth="600px",e.style.margin="0 auto",[{text:"Morning workout",checked:!0},{text:"Review pull requests",checked:!1},{text:"Team standup meeting",checked:!1},{text:"Lunch break",checked:!1},{text:"Code review session",checked:!1}].forEach(({text:t,checked:r})=>{const o=document.createElement("labs-list-item"),s=document.createElement("labs-checkbox");s.setAttribute("slot","control"),r&&s.setAttribute("checked","");const d=document.createElement("div");d.setAttribute("slot","content"),d.textContent=t;const i=document.createElement("labs-dropdown");i.setAttribute("slot","actions"),o.appendChild(s),o.appendChild(d),o.appendChild(i),e.appendChild(o)}),e},p=({text:e="Simple text item"})=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="16px",n.style.width="100%",n.style.maxWidth="600px",n.style.margin="0 auto";const t=document.createElement("labs-list-item");t.setAttribute("variant","text-only");const r=document.createElement("span");return r.setAttribute("slot","content"),r.textContent=e,t.appendChild(r),n.appendChild(t),n};p.argTypes={text:{control:"text",description:"Text content for the list item"}};p.args={text:"Simple text item"};const y=()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexDirection="column",e.style.gap="12px",e.style.width="100%",e.style.maxWidth="600px",e.style.margin="0 auto",["First text item","Second text item","Third text item","Fourth text item","Fifth text item"].forEach(t=>{const r=document.createElement("labs-list-item");r.setAttribute("variant","text-only");const o=document.createElement("span");o.setAttribute("slot","content"),o.textContent=t,r.appendChild(o),e.appendChild(r)}),e},m=({icon:e="check"})=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="16px",n.style.width="100%",n.style.maxWidth="600px",n.style.margin="0 auto";const t=document.createElement("labs-list-item");t.setAttribute("variant","timestamp");const r=new Date;t.setAttribute("timestamp",r.toISOString());const o=document.createElement("labs-icon");o.setAttribute("slot","control"),o.setAttribute("name",e||"check"),o.setAttribute("aria-hidden","true");const s=document.createElement("div");return s.setAttribute("slot","content"),s.textContent=k(r),t.appendChild(o),t.appendChild(s),n.appendChild(t),n};m.argTypes={icon:{control:{type:"select"},options:A,description:"Icon name from labs-icon library"}};m.args={icon:"check"};const w=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="12px",e.style.width="100%",e.style.maxWidth="600px",e.style.margin="0 auto";for(let n=0;n<5;n++){const t=document.createElement("labs-list-item");t.setAttribute("variant","timestamp");const r=new Date(Date.now()-n*6e4);t.setAttribute("timestamp",r.toISOString());const o=document.createElement("labs-icon");o.setAttribute("slot","control"),o.setAttribute("name","check"),o.setAttribute("aria-hidden","true");const s=document.createElement("div");s.setAttribute("slot","content"),s.textContent=k(r),t.appendChild(o),t.appendChild(s),e.appendChild(t)}return e},b=()=>{const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.gap="12px",e.style.width="100%",e.style.maxWidth="600px",e.style.margin="0 auto",e.style.padding="20px";const n=document.createElement("div");n.style.fontSize="0.9em",n.style.color="var(--color-on-surface-variant, #666)",n.style.marginBottom="12px",n.textContent="Drag items to reorder (try dragging one item over another)",e.appendChild(n);let t=[{id:"1",text:"Buy groceries"},{id:"2",text:"Write documentation"},{id:"3",text:"Review pull requests"},{id:"4",text:"Fix bug in labs-button"},{id:"5",text:"Update design tokens"}];const r=localStorage.getItem("drag-drop-order");if(r)try{t=JSON.parse(r)}catch(d){console.error("Failed to load saved order:",d)}let o=null;const s=()=>{e.querySelectorAll("labs-list-item").forEach(i=>i.remove()),t.forEach(i=>{const a=document.createElement("labs-list-item");a.setAttribute("data-id",i.id),a.draggable=!0,a.style.userSelect="none";const g=document.createElement("labs-checkbox");g.setAttribute("slot","control");const x=document.createElement("div");x.setAttribute("slot","content"),x.textContent=i.text,a.appendChild(g),a.appendChild(x),e.appendChild(a),a.addEventListener("dragstart",c=>{o=a,a.setAttribute("dragging",""),c.dataTransfer.effectAllowed="move",c.dataTransfer.setData("text/plain",i.id),console.log("Started dragging:",i.id,i.text)}),a.addEventListener("dragend",c=>{a.removeAttribute("dragging"),a.removeAttribute("drag-over"),o=null,console.log("Ended drag:",i.id)}),a.addEventListener("dragover",c=>{c.dataTransfer.types.includes("text/plain")&&(c.preventDefault(),c.dataTransfer.dropEffect="move",a!==o&&a.setAttribute("drag-over",""))}),a.addEventListener("dragleave",c=>{a.removeAttribute("drag-over")}),a.addEventListener("drop",c=>{if(c.preventDefault(),a.removeAttribute("drag-over"),o&&o!==a){const v=c.dataTransfer.getData("text/plain");console.log("Dropped:",v,"onto:",i.id);const f=t.findIndex(u=>u.id===v),E=t.findIndex(u=>u.id===i.id);if(f!==-1&&E!==-1){const[u]=t.splice(f,1);t.splice(E,0,u),localStorage.setItem("drag-drop-order",JSON.stringify(t)),s()}}})})};return s(),e};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`({
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
}`,...l.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`() => {
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
}`,...h.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`({
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
}`,...p.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`() => {
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
}`,...y.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`({
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
}`,...m.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`() => {
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
}`,...w.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '12px';
  wrapper.style.width = '100%';
  wrapper.style.maxWidth = '600px';
  wrapper.style.margin = '0 auto';
  wrapper.style.padding = '20px';
  const instruction = document.createElement('div');
  instruction.style.fontSize = '0.9em';
  instruction.style.color = 'var(--color-on-surface-variant, #666)';
  instruction.style.marginBottom = '12px';
  instruction.textContent = 'Drag items to reorder (try dragging one item over another)';
  wrapper.appendChild(instruction);
  let items = [{
    id: '1',
    text: 'Buy groceries'
  }, {
    id: '2',
    text: 'Write documentation'
  }, {
    id: '3',
    text: 'Review pull requests'
  }, {
    id: '4',
    text: 'Fix bug in labs-button'
  }, {
    id: '5',
    text: 'Update design tokens'
  }];

  // Load saved order from localStorage
  const savedOrder = localStorage.getItem('drag-drop-order');
  if (savedOrder) {
    try {
      const order = JSON.parse(savedOrder);
      items = order;
    } catch (e) {
      console.error('Failed to load saved order:', e);
    }
  }
  let draggedElement = null;
  const renderItems = () => {
    // Remove all item elements (keep instruction)
    const itemElements = wrapper.querySelectorAll('labs-list-item');
    itemElements.forEach(el => el.remove());

    // Render items in current order
    items.forEach(data => {
      const item = document.createElement('labs-list-item');
      item.setAttribute('data-id', data.id);
      item.draggable = true;
      item.style.userSelect = 'none';
      const checkbox = document.createElement('labs-checkbox');
      checkbox.setAttribute('slot', 'control');
      const content = document.createElement('div');
      content.setAttribute('slot', 'content');
      content.textContent = data.text;
      item.appendChild(checkbox);
      item.appendChild(content);
      wrapper.appendChild(item);

      // Native drag events on the custom element
      item.addEventListener('dragstart', e => {
        draggedElement = item;
        item.setAttribute('dragging', '');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', data.id);
        console.log('Started dragging:', data.id, data.text);
      });
      item.addEventListener('dragend', e => {
        item.removeAttribute('dragging');
        item.removeAttribute('drag-over');
        draggedElement = null;
        console.log('Ended drag:', data.id);
      });
      item.addEventListener('dragover', e => {
        if (e.dataTransfer.types.includes('text/plain')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (item !== draggedElement) {
            item.setAttribute('drag-over', '');
          }
        }
      });
      item.addEventListener('dragleave', e => {
        item.removeAttribute('drag-over');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.removeAttribute('drag-over');
        if (draggedElement && draggedElement !== item) {
          const draggedId = e.dataTransfer.getData('text/plain');
          console.log('Dropped:', draggedId, 'onto:', data.id);

          // Find indices and reorder
          const draggedIndex = items.findIndex(i => i.id === draggedId);
          const targetIndex = items.findIndex(i => i.id === data.id);
          if (draggedIndex !== -1 && targetIndex !== -1) {
            // Remove dragged item
            const [movedItem] = items.splice(draggedIndex, 1);
            // Insert at target position
            items.splice(targetIndex, 0, movedItem);

            // Save to localStorage
            localStorage.setItem('drag-drop-order', JSON.stringify(items));

            // Re-render
            renderItems();
          }
        }
      });
    });
  };
  renderItems();
  return wrapper;
}`,...b.parameters?.docs?.source}}};const M=["Task","TaskMultiple","TextOnly","TextOnlyMultiple","Timestamp","TimestampMultiple","DragDropReorderable"];export{b as DragDropReorderable,l as Task,h as TaskMultiple,p as TextOnly,y as TextOnlyMultiple,m as Timestamp,w as TimestampMultiple,M as __namedExportsOrder,F as default};
