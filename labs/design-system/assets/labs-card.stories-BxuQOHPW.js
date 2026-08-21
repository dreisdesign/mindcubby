import"./labs-input-DtIZJppn.js";const d={title:"2. Components/Card/Card (Canonical)",tags:["autodocs"],parameters:{docs:{description:{component:"The canonical, slot-driven card component. All variants and patterns should be built from this baseline.\n\n**Custom properties:**\n- `--labs-card-max-width`\n- `--labs-card-min-width`\n- `--labs-card-padding`\n- `--labs-card-radius`\n- `--labs-card-shadow`\n- `--color-surface`\n- `--color-on-surface`\n- `--color-on-surface-muted`\n- `--font-size-h3` (default: 1.25rem, used for header)\n- `--font-size-base` (default: 1rem, used for description and input text)"}}},argTypes:{header:{control:"text",defaultValue:"Card Title",description:"Title/Header slot"},description:{control:"text",defaultValue:"This is a description for the canonical card.",description:"Description slot"},showDescription:{control:"boolean",defaultValue:!0,description:"Show description"},showClose:{control:"boolean",defaultValue:!0,description:"Show close icon"},showInput:{control:"boolean",defaultValue:!0,description:"Show input field"},showActions:{control:"boolean",defaultValue:!0,description:"Show action buttons"}}},o=n=>{const s=document.createElement("div");s.style.padding="20px";const a=document.createElement("labs-card");a.style.maxWidth="520px";const i=document.createElement("span");if(i.slot="header",i.textContent=n.header,a.appendChild(i),n.showDescription&&n.description){const t=document.createElement("span");t.slot="description",t.textContent=n.description,a.appendChild(t)}if(n.showClose){const t=document.createElement("labs-button");t.slot="close",t.setAttribute("variant","icon"),t.setAttribute("aria-label","Close");const e=document.createElement("labs-icon");e.setAttribute("name","close"),e.setAttribute("slot","icon-left"),e.setAttribute("width","24"),e.setAttribute("height","24"),t.appendChild(e),a.appendChild(t)}if(n.showInput){const t=document.createElement("div");t.slot="input",t.className="input-row";const e=document.createElement("labs-input");e.setAttribute("placeholder","Type here..."),t.appendChild(e),a.appendChild(t)}if(n.showActions){const t=document.createElement("div");t.slot="actions",t.style.display="flex",t.style.gap="10px",t.style.justifyContent="flex-end";const e=document.createElement("labs-button");e.setAttribute("variant","secondary"),e.textContent="Cancel";const c=document.createElement("labs-button");c.setAttribute("variant","primary"),c.textContent="Save",t.appendChild(e),t.appendChild(c),a.appendChild(t)}return s.appendChild(a),s};o.args={header:"Card Title",description:"This is a description for the canonical card.",showDescription:!0,showClose:!0,showInput:!0,showActions:!0};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`args => {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '20px';

  // Create the card
  const card = document.createElement('labs-card');
  card.style.maxWidth = '520px';

  // Header
  const headerSpan = document.createElement('span');
  headerSpan.slot = 'header';
  headerSpan.textContent = args.header;
  card.appendChild(headerSpan);

  // Description (toggle)
  if (args.showDescription && args.description) {
    const descSpan = document.createElement('span');
    descSpan.slot = 'description';
    descSpan.textContent = args.description;
    card.appendChild(descSpan);
  }

  // Close icon
  if (args.showClose) {
    const closeBtn = document.createElement('labs-button');
    closeBtn.slot = 'close';
    closeBtn.setAttribute('variant', 'icon');
    closeBtn.setAttribute('aria-label', 'Close');
    const icon = document.createElement('labs-icon');
    icon.setAttribute('name', 'close');
    icon.setAttribute('slot', 'icon-left');
    icon.setAttribute('width', '24');
    icon.setAttribute('height', '24');
    closeBtn.appendChild(icon);
    card.appendChild(closeBtn);
  }

  // Input
  if (args.showInput) {
    const inputDiv = document.createElement('div');
    inputDiv.slot = 'input';
    inputDiv.className = 'input-row';
    const input = document.createElement('labs-input');
    input.setAttribute('placeholder', 'Type here...');
    inputDiv.appendChild(input);
    card.appendChild(inputDiv);
  }

  // Actions
  if (args.showActions) {
    const actionsDiv = document.createElement('div');
    actionsDiv.slot = 'actions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '10px';
    actionsDiv.style.justifyContent = 'flex-end';
    const cancelBtn = document.createElement('labs-button');
    cancelBtn.setAttribute('variant', 'secondary');
    cancelBtn.textContent = 'Cancel';
    const saveBtn = document.createElement('labs-button');
    saveBtn.setAttribute('variant', 'primary');
    saveBtn.textContent = 'Save';
    actionsDiv.appendChild(cancelBtn);
    actionsDiv.appendChild(saveBtn);
    card.appendChild(actionsDiv);
  }
  wrapper.appendChild(card);
  return wrapper;
}`,...o.parameters?.docs?.source}}};const l=["Default"];export{o as Default,l as __namedExportsOrder,d as default};
