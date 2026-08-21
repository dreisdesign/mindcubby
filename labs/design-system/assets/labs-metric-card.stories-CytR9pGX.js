import"./labs-metric-card-Bw7oTx-k.js";import"./labs-card-CpkpHeMq.js";const o={title:"2. Components/Card/Metric",component:"labs-metric-card",parameters:{docs:{description:{component:"Raw API and attributes for the modular labs-metric-card component. Use this as a technical reference for developers."}}},argTypes:{label:{control:"text",description:"Metric label"},value:{control:"text",description:"Metric value"}},args:{label:"Entries",value:"42"}},e=({label:r,value:a})=>{const t=document.createElement("labs-metric-card");return t.setAttribute("label",r),t.setAttribute("value",a),t};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`({
  label,
  value
}) => {
  const card = document.createElement('labs-metric-card');
  card.setAttribute('label', label);
  card.setAttribute('value', value);
  return card;
}`,...e.parameters?.docs?.source}}};const l=["Default"];export{e as Default,l as __namedExportsOrder,o as default};
