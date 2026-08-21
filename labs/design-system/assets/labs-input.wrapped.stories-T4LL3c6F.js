import"./labs-input-Decn_u9P.js";const t={title:"3. Components (Wrapped)/Input",component:"labs-input"},e={name:"Default",render:()=>`
    <labs-input placeholder="Type here..."></labs-input>
  `},a={name:"With Value",render:()=>`
    <labs-input value="Pre-filled value"></labs-input>
  `},r={name:"Disabled",render:()=>`
    <labs-input value="Can't edit" disabled></labs-input>
  `},n={name:"With Aria Label",render:()=>`
    <labs-input aria-label="Search input" placeholder="Search..."></labs-input>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  name: 'Default',
  render: () => \`
    <labs-input placeholder="Type here..."></labs-input>
  \`
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'With Value',
  render: () => \`
    <labs-input value="Pre-filled value"></labs-input>
  \`
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  name: 'Disabled',
  render: () => \`
    <labs-input value="Can't edit" disabled></labs-input>
  \`
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  name: 'With Aria Label',
  render: () => \`
    <labs-input aria-label="Search input" placeholder="Search..."></labs-input>
  \`
}`,...n.parameters?.docs?.source}}};const l=["Default","WithValue","Disabled","WithAriaLabel"];export{e as Default,r as Disabled,n as WithAriaLabel,a as WithValue,l as __namedExportsOrder,t as default};
