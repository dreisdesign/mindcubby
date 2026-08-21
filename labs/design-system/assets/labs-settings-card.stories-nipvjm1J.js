import"./labs-settings-card-BmY_Lbnm.js";import"./iframe-BTl-QeGS.js";import"./preload-helper-PPVm8Dsz.js";const i={title:"2. Components/Card/Settings",component:"labs-settings-card",argTypes:{showReset:{name:"Reset Button",control:"boolean",description:"Show the Reset All Data button",table:{category:"Attributes"}}},parameters:{docs:{description:{component:"Canonical labs-settings-card story. Use this as a reference for the base settings card component."}}}},t=({showReset:r})=>{const e=document.createElement("labs-settings-card");r?e.removeAttribute("hide-reset"):e.setAttribute("hide-reset","");const n=document.createElement("div");n.slot="header",n.textContent="Settings";const s=document.createElement("div");s.textContent="Settings content goes here.";const o=document.createElement("div");return o.slot="footer",o.textContent="Footer actions",e.appendChild(n),e.appendChild(s),e.appendChild(o),e};t.args={showReset:!0};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`({
  showReset
}) => {
  const el = document.createElement('labs-settings-card');
  if (!showReset) el.setAttribute('hide-reset', '');else el.removeAttribute('hide-reset');
  // Optionally add header, content, and footer slots for demo
  const header = document.createElement('div');
  header.slot = 'header';
  header.textContent = 'Settings';
  const content = document.createElement('div');
  content.textContent = 'Settings content goes here.';
  const footer = document.createElement('div');
  footer.slot = 'footer';
  footer.textContent = 'Footer actions';
  el.appendChild(header);
  el.appendChild(content);
  el.appendChild(footer);
  return el;
}`,...t.parameters?.docs?.source}}};const l=["Default"];export{t as Default,l as __namedExportsOrder,i as default};
