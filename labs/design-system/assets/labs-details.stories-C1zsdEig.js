import"./labs-list-item-CUKhFGeZ.js";import"./labs-details-D8mf-JWN.js";import"./iframe-BOP8xSmv.js";import"./preload-helper-PPVm8Dsz.js";const s=()=>{const n=document.createElement("labs-details");n.textContent="Archived";const t=document.createElement("labs-list-item");t.setAttribute("variant","task"),t.setAttribute("state","archived");const e=document.createElement("div");e.setAttribute("slot","content"),e.textContent="This is an archived item (50% opacity)",t.appendChild(e);const a=document.createElement("div");return a.setAttribute("slot","content"),a.appendChild(t),n.appendChild(a),n},l={title:"2. Components/Details",component:"labs-details",parameters:{docs:{description:{component:"Canonical details/accordion component. Uses native <details> for accessibility. Slots: summary (header), default (content)."}}},argTypes:{variant:{control:{type:"select"},options:["","secondary"],description:"Visual variant"}},args:{variant:""}},i=({variant:n})=>{const t=document.createElement("labs-details");n&&t.setAttribute("variant",n);const e=document.createElement("span");e.slot="summary",e.innerHTML='<labs-icon name="keyboard_arrow_right"></labs-icon> Expand Me',t.appendChild(e);const a=document.createElement("div");return a.textContent="This is the expandable content. You can put anything here.",t.appendChild(a),t};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => {
  const details = document.createElement('labs-details');
  details.textContent = 'Archived'; // summary text as default slot

  const archivedItem = document.createElement('labs-list-item');
  archivedItem.setAttribute('variant', 'task');
  archivedItem.setAttribute('state', 'archived');
  const content = document.createElement('div');
  content.setAttribute('slot', 'content');
  content.textContent = 'This is an archived item (50% opacity)';
  archivedItem.appendChild(content);

  // Place the archived item in the details content slot
  const contentDiv = document.createElement('div');
  contentDiv.setAttribute('slot', 'content');
  contentDiv.appendChild(archivedItem);
  details.appendChild(contentDiv);
  return details;
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`({
  variant
}) => {
  const details = document.createElement('labs-details');
  if (variant) details.setAttribute('variant', variant);
  const summary = document.createElement('span');
  summary.slot = 'summary';
  summary.innerHTML = '<labs-icon name="keyboard_arrow_right"></labs-icon> Expand Me';
  details.appendChild(summary);
  const content = document.createElement('div');
  content.textContent = 'This is the expandable content. You can put anything here.';
  details.appendChild(content);
  return details;
}`,...i.parameters?.docs?.source}}};const m=["WithArchivedListItem","Default"];export{i as Default,s as WithArchivedListItem,m as __namedExportsOrder,l as default};
