import"./labs-flavor-selector-tLyTdwU5.js";const n={title:"4. Patterns/Settings/Flavor Selector",tags:["autodocs"]},t=()=>{const e=document.createElement("div");return e.innerHTML=`
    <style>
      body { padding: 20px; }
      labs-flavor-selector {
        display: block;
        max-width: 280px;
      }
    </style>
    <labs-flavor-selector></labs-flavor-selector>
  `,e},r=()=>{const e=document.createElement("div");return e.style.padding="20px",e.innerHTML=`
    <labs-flavor-selector></labs-flavor-selector>
  `,document.documentElement.classList.remove("flavor-vanilla","flavor-blueberry","flavor-strawberry"),document.documentElement.classList.add("flavor-blueberry"),e};r.parameters={docs:{description:{story:"Flavor selector with blueberry theme pre-selected"}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.innerHTML = \`
    <style>
      body { padding: 20px; }
      labs-flavor-selector {
        display: block;
        max-width: 280px;
      }
    </style>
    <labs-flavor-selector></labs-flavor-selector>
  \`;
  return container;
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => {
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.innerHTML = \`
    <labs-flavor-selector></labs-flavor-selector>
  \`;

  // Start with blueberry flavor
  document.documentElement.classList.remove('flavor-vanilla', 'flavor-blueberry', 'flavor-strawberry');
  document.documentElement.classList.add('flavor-blueberry');
  return container;
}`,...r.parameters?.docs?.source}}};const o=["Default","WithTheme"];export{t as Default,r as WithTheme,o as __namedExportsOrder,n as default};
