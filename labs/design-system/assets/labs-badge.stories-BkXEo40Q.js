import"./labs-badge-D-r2XBsF.js";const s={title:"2. Components/Badge",component:"labs-badge",argTypes:{variant:{control:{type:"select"},options:["","primary","secondary","success","warning","error"],description:"Badge variant style"},text:{control:"text",description:"Badge text content"}}},t=({variant:a="",text:r="Badge"}={})=>{const e=document.createElement("labs-badge");return a&&e.setAttribute("variant",a),e.setAttribute("text",r),e};t.args={variant:"primary",text:"Badge"};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`({
  variant = '',
  text = 'Badge'
} = {}) => {
  const el = document.createElement('labs-badge');
  if (variant) el.setAttribute('variant', variant);
  el.setAttribute('text', text);
  return el;
}`,...t.parameters?.docs?.source}}};const o=["Default"];export{t as Default,o as __namedExportsOrder,s as default};
