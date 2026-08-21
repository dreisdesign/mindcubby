import"./labs-input-Decn_u9P.js";const p={title:"2. Components/Input/Text"},e=()=>{const t=document.createElement("div"),n=document.createElement("labs-input");return n.setAttribute("placeholder","Add item..."),n.addEventListener("submit",a=>{const d=document.createElement("p");d.textContent=`Submitted: ${a.detail.value}`,t.appendChild(d)}),t.appendChild(n),t};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`() => {
  const el = document.createElement('div');
  const input = document.createElement('labs-input');
  input.setAttribute('placeholder', 'Add item...');
  input.addEventListener('submit', e => {
    const p = document.createElement('p');
    p.textContent = \`Submitted: \${e.detail.value}\`;
    el.appendChild(p);
  });
  el.appendChild(input);
  return el;
}`,...e.parameters?.docs?.source}}};const o=["Default"];export{e as Default,o as __namedExportsOrder,p as default};
