import"./labs-dropdown-Dr0QiVIj.js";import"./labs-list-item-CUKhFGeZ.js";const d={title:"2. Components/Dropdown",component:"labs-dropdown",parameters:{docs:{description:{component:"Canonical dropdown: show/hide Archive, Restore, Delete actions. No state logic."}}},argTypes:{actionCombo:{name:"Actions",control:{type:"radio"},options:["delete","archive","restore","delete,archive","delete,restore"],mapping:{delete:["delete"],archive:["archive"],restore:["restore"],"delete,archive":["delete","archive"],"delete,restore":["delete","restore"]},defaultValue:"delete",description:"Allowed action combinations only"}},args:{actionCombo:"delete"}},e=({actionCombo:t="delete"}={})=>{const o=document.createElement("div");o.style.padding="20px",o.innerHTML="";const n=document.createElement("labs-dropdown");n.setAttribute("open","");const r=Array.isArray(t)?t:t?t.split(","):[];return r.length&&n.setAttribute("only",r.join(",")),o.appendChild(n),o};e.storyName="API / Controls";e.args={actionCombo:"delete"};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`({
  actionCombo = 'delete'
} = {}) => {
  const wrap = document.createElement('div');
  wrap.style.padding = '20px';
  wrap.innerHTML = '';
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('open', '');
  const actions = Array.isArray(actionCombo) ? actionCombo : actionCombo ? actionCombo.split(',') : [];
  if (actions.length) dd.setAttribute('only', actions.join(','));
  wrap.appendChild(dd);
  return wrap;
}`,...e.parameters?.docs?.source}}};const i=["APIControls"];export{e as APIControls,i as __namedExportsOrder,d as default};
