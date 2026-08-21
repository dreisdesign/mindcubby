import"./labs-apps-selector-CRaoXzvY.js";const r={title:"4. Patterns/Settings/Apps Selector",tags:["autodocs"]},t=()=>{const e=document.createElement("div");return e.innerHTML=`
    <style>
      body { padding: 20px; }
      labs-apps-selector {
        display: block;
        max-width: 280px;
      }
    </style>
    <labs-apps-selector></labs-apps-selector>
  `,e},n=()=>{const e=document.createElement("div");return e.style.padding="20px",e.innerHTML=`
    <labs-apps-selector open></labs-apps-selector>
  `,e};n.parameters={docs:{description:{story:"Apps selector with dropdown menu open"}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.innerHTML = \`
    <style>
      body { padding: 20px; }
      labs-apps-selector {
        display: block;
        max-width: 280px;
      }
    </style>
    <labs-apps-selector></labs-apps-selector>
  \`;
  return container;
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.innerHTML = \`
    <labs-apps-selector open></labs-apps-selector>
  \`;
  return container;
}`,...n.parameters?.docs?.source}}};const a=["Default","Open"];export{t as Default,n as Open,a as __namedExportsOrder,r as default};
