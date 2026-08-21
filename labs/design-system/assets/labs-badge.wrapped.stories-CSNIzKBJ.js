import"./labs-badge-Cyx4uBIU.js";const c={title:"3. Components (Wrapped)/Badge",component:"labs-badge",argTypes:{text:{control:"text",description:"Badge text content"}}},r={name:"Success",args:{text:"Success"},render:e=>`
    <labs-badge variant="success" text="${e.text}"></labs-badge>
  `},a={name:"Warning",args:{text:"Warning"},render:e=>`
    <labs-badge variant="warning" text="${e.text}"></labs-badge>
  `},s={name:"Error",args:{text:"Error"},render:e=>`
    <labs-badge variant="error" text="${e.text}"></labs-badge>
  `},t={name:"Secondary",args:{text:"Secondary"},render:e=>`
    <labs-badge variant="secondary" text="${e.text}"></labs-badge>
  `},n={name:"Primary (Default)",args:{text:"Primary"},render:e=>`
    <labs-badge text="${e.text}"></labs-badge>
  `};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  name: 'Success',
  args: {
    text: 'Success'
  },
  render: args => \`
    <labs-badge variant="success" text="\${args.text}"></labs-badge>
  \`
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'Warning',
  args: {
    text: 'Warning'
  },
  render: args => \`
    <labs-badge variant="warning" text="\${args.text}"></labs-badge>
  \`
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: 'Error',
  args: {
    text: 'Error'
  },
  render: args => \`
    <labs-badge variant="error" text="\${args.text}"></labs-badge>
  \`
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  name: 'Secondary',
  args: {
    text: 'Secondary'
  },
  render: args => \`
    <labs-badge variant="secondary" text="\${args.text}"></labs-badge>
  \`
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  name: 'Primary (Default)',
  args: {
    text: 'Primary'
  },
  render: args => \`
    <labs-badge text="\${args.text}"></labs-badge>
  \`
}`,...n.parameters?.docs?.source}}};const d=["Success","Warning","Error","Secondary","Primary"];export{s as Error,n as Primary,t as Secondary,r as Success,a as Warning,d as __namedExportsOrder,c as default};
