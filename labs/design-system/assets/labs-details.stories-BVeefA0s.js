import"./labs-list-item-DatCmgQS.js";import"./iframe-Dvm2aYCR.js";import"./preload-helper-PPVm8Dsz.js";class i extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.shadowRoot.innerHTML||(this.shadowRoot.innerHTML=`
        <style>
          :host { display:block; width:100%; }
          details { width:100%; border:1.5px solid var(--color-on-surface); border-radius:var(--radius-lg); padding:0; box-sizing:border-box; background:var(--color-surface-variant); }
          summary { list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; padding:8px 12px; font-weight:600; }
          summary labs-icon {
            transition: transform 0.2s ease;
            color: var(--color-on-surface);
            font-size: 1.25em;
          }
          details[open] summary labs-icon {
            transform: rotate(90deg);
          }
          .content { padding:8px 12px 12px 12px; }
        </style>
        <details>
          <summary>
            <labs-icon name="keyboard_arrow_right"></labs-icon>
            <span class="summary-text"><slot></slot></span>
          </summary>
          <div class="content"><slot name="content"></slot></div>
        </details>
      `)}}customElements.get("labs-details")||customElements.define("labs-details",i);const s=()=>{const e=document.createElement("labs-details");e.textContent="Archived";const t=document.createElement("labs-list-item");t.setAttribute("variant","task"),t.setAttribute("state","archived");const n=document.createElement("div");n.setAttribute("slot","content"),n.textContent="This is an archived item (50% opacity)",t.appendChild(n);const a=document.createElement("div");return a.setAttribute("slot","content"),a.appendChild(t),e.appendChild(a),e},l={title:"2. Components/Details",component:"labs-details",parameters:{docs:{description:{component:"Canonical details/accordion component. Uses native <details> for accessibility. Slots: summary (header), default (content)."}}},argTypes:{variant:{control:{type:"select"},options:["","secondary"],description:"Visual variant"}},args:{variant:""}},o=({variant:e})=>{const t=document.createElement("labs-details");e&&t.setAttribute("variant",e);const n=document.createElement("span");n.slot="summary",n.innerHTML='<labs-icon name="keyboard_arrow_right"></labs-icon> Expand Me',t.appendChild(n);const a=document.createElement("div");return a.textContent="This is the expandable content. You can put anything here.",t.appendChild(a),t};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => {
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
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`({
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
}`,...o.parameters?.docs?.source}}};const m=["WithArchivedListItem","Default"];export{o as Default,s as WithArchivedListItem,m as __namedExportsOrder,l as default};
