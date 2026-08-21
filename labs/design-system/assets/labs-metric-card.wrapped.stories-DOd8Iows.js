import"./iframe-BlSllhYp.js";import"./labs-metric-card-Bw7oTx-k.js";import"./preload-helper-PPVm8Dsz.js";import"./labs-card-CpkpHeMq.js";const n={title:"3. Components (Wrapped)/Card/Metric",parameters:{docs:{description:{component:"A modular, encapsulated card for displaying a metric label and value. Use this for dashboard/statistics displays."}}},argTypes:{label:{control:"text",description:"Metric label"},value:{control:"text",description:"Metric value"}},args:{label:"Entries",value:"42"}},e=({label:r,value:a})=>{const t=document.createElement("labs-metric-card");return t.setAttribute("label",r),t.setAttribute("value",a),t};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`({
  label,
  value
}) => {
  const card = document.createElement('labs-metric-card');
  card.setAttribute('label', label);
  card.setAttribute('value', value);
  return card;
}`,...e.parameters?.docs?.source}}};const i=["Default"];export{e as Default,i as __namedExportsOrder,n as default};
