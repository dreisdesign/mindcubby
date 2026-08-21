import"./iframe-BOP8xSmv.js";import{i as d}from"./icons-list-ByY2JTY4.js";import"./preload-helper-PPVm8Dsz.js";const b=document.createElement("style");b.innerHTML=`
  .labs-autodocs-surface {
    background: none !important;
    box-shadow: none !important;
  }
`;document.head.appendChild(b);const u={title:"2. Components/Button",component:"labs-button",tags:["autodocs"],parameters:{docs:{description:{component:"Modular, theme-agnostic Labs Button web component. Uses CSS custom properties for all styling."}}},argTypes:{variant:{control:{type:"select"},options:["primary","secondary","destructive","transparent"],description:"Button variant style"},size:{control:{type:"inline-radio"},options:["small","medium","large"],description:"Button size variant",table:{defaultValue:{summary:"medium"}}},disabled:{control:{type:"boolean"},description:"Disable the button"},text:{control:{type:"text"},description:"Button text content"},leftIcon:{control:{type:"select"},options:d,description:"Left icon name (optional)"},rightIcon:{control:{type:"select"},options:d,description:"Right icon name (optional)"}},args:{variant:"primary",size:"medium",disabled:!1,text:"Button",leftIcon:"",rightIcon:"",pill:!0}},e={name:"Default",render:n=>`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button
        variant="${n.variant}"
        ${n.disabled?"disabled":""}
        ${n.size?`size="${n.size}"`:""}
        ${n.pill?"pill":""}
      >
        ${n.leftIcon?`<labs-icon slot="icon-left" name="${n.leftIcon}"></labs-icon>`:""}
        ${n.text}
        ${n.rightIcon?`<labs-icon slot="icon-right" name="${n.rightIcon}"></labs-icon>`:""}
      </labs-button>
    </div>
  `},a={name:"Primary",args:{variant:"primary",size:"medium",disabled:!1,pill:!1,text:"Primary"},render:n=>`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${n.variant}"
        ${n.disabled?"disabled":""}
        ${n.size?`size="${n.size}"`:""}
        ${n.pill?"pill":""}
      >${n.text}</labs-button>
    </div>
  `},t={name:"Secondary",args:{variant:"secondary",size:"medium",disabled:!1,pill:!1,text:"Secondary"},render:n=>`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${n.variant}"
        ${n.disabled?"disabled":""}
        ${n.size?`size="${n.size}"`:""}
        ${n.pill?"pill":""}
      >${n.text}</labs-button>
    </div>
  `},i={name:"With Left Icon",args:{variant:"primary",size:"medium",disabled:!1,pill:!1,text:"With Left Icon"},render:n=>`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${n.variant}"
        ${n.disabled?"disabled":""}
        ${n.size?`size="${n.size}"`:""}
        ${n.pill?"pill":""}
      >
        <labs-icon slot="icon-left" name="add"></labs-icon>
        ${n.text}
      </labs-button>
    </div>
  `},s={name:"With Right Icon",args:{variant:"primary",size:"medium",disabled:!1,pill:!1,text:"With Right Icon"},render:n=>`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${n.variant}"
        ${n.disabled?"disabled":""}
        ${n.size?`size="${n.size}"`:""}
        ${n.pill?"pill":""}
      >
        ${n.text}
        <labs-icon slot="icon-right" name="edit"></labs-icon>
      </labs-button>
    </div>
  `},r={name:"Destructive",args:{variant:"destructive",size:"medium",disabled:!1,pill:!1,text:"Destructive"},render:n=>`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${n.variant}"
        ${n.disabled?"disabled":""}
        ${n.size?`size="${n.size}"`:""}
        ${n.pill?"pill":""}
      >${n.text}</labs-button>
    </div>
  `},o={name:"Transparent",args:{variant:"transparent",size:"medium",disabled:!1,pill:!1,text:"Transparent"},render:n=>`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="${n.variant}"
        ${n.disabled?"disabled":""}
        ${n.size?`size="${n.size}"`:""}
        ${n.pill?"pill":""}
      >${n.text}</labs-button>
    </div>
  `},l={name:"Pill",render:()=>`
    <div style="display:flex;gap:12px;padding:8px;background:transparent;align-items:center;">
      <labs-button pill variant="primary" size="medium">Primary</labs-button>
      <labs-button pill variant="secondary" size="medium">Secondary</labs-button>
      <labs-button pill variant="destructive" size="medium">Destructive</labs-button>
      <labs-button pill variant="transparent" size="medium">Transparent</labs-button>
      <labs-button pill variant="primary" size="medium"><labs-icon slot="icon-left" name="add"></labs-icon>Add</labs-button>
    </div>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  name: 'Default',
  render: args => \`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button
        variant="\${args.variant}"
        \${args.disabled ? 'disabled' : ''}
        \${args.size ? \`size="\${args.size}"\` : ''}
        \${args.pill ? 'pill' : ''}
      >
        \${args.leftIcon ? \`<labs-icon slot="icon-left" name="\${args.leftIcon}"></labs-icon>\` : ''}
        \${args.text}
        \${args.rightIcon ? \`<labs-icon slot="icon-right" name="\${args.rightIcon}"></labs-icon>\` : ''}
      </labs-button>
    </div>
  \`
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'Primary',
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'Primary'
  },
  render: args => \`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="\${args.variant}"
        \${args.disabled ? 'disabled' : ''}
        \${args.size ? \`size="\${args.size}"\` : ''}
        \${args.pill ? 'pill' : ''}
      >\${args.text}</labs-button>
    </div>
  \`
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  name: 'Secondary',
  args: {
    variant: 'secondary',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'Secondary'
  },
  render: args => \`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="\${args.variant}"
        \${args.disabled ? 'disabled' : ''}
        \${args.size ? \`size="\${args.size}"\` : ''}
        \${args.pill ? 'pill' : ''}
      >\${args.text}</labs-button>
    </div>
  \`
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: 'With Left Icon',
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'With Left Icon'
  },
  render: args => \`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="\${args.variant}"
        \${args.disabled ? 'disabled' : ''}
        \${args.size ? \`size="\${args.size}"\` : ''}
        \${args.pill ? 'pill' : ''}
      >
        <labs-icon slot="icon-left" name="add"></labs-icon>
        \${args.text}
      </labs-button>
    </div>
  \`
}`,...i.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: 'With Right Icon',
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'With Right Icon'
  },
  render: args => \`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="\${args.variant}"
        \${args.disabled ? 'disabled' : ''}
        \${args.size ? \`size="\${args.size}"\` : ''}
        \${args.pill ? 'pill' : ''}
      >
        \${args.text}
        <labs-icon slot="icon-right" name="edit"></labs-icon>
      </labs-button>
    </div>
  \`
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  name: 'Destructive',
  args: {
    variant: 'destructive',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'Destructive'
  },
  render: args => \`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="\${args.variant}"
        \${args.disabled ? 'disabled' : ''}
        \${args.size ? \`size="\${args.size}"\` : ''}
        \${args.pill ? 'pill' : ''}
      >\${args.text}</labs-button>
    </div>
  \`
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: 'Transparent',
  args: {
    variant: 'transparent',
    size: 'medium',
    disabled: false,
    pill: false,
    text: 'Transparent'
  },
  render: args => \`
    <div style="background: none; box-shadow: none; padding: 0; border: none;">
      <labs-button 
        variant="\${args.variant}"
        \${args.disabled ? 'disabled' : ''}
        \${args.size ? \`size="\${args.size}"\` : ''}
        \${args.pill ? 'pill' : ''}
      >\${args.text}</labs-button>
    </div>
  \`
}`,...o.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: 'Pill',
  render: () => \`
    <div style="display:flex;gap:12px;padding:8px;background:transparent;align-items:center;">
      <labs-button pill variant="primary" size="medium">Primary</labs-button>
      <labs-button pill variant="secondary" size="medium">Secondary</labs-button>
      <labs-button pill variant="destructive" size="medium">Destructive</labs-button>
      <labs-button pill variant="transparent" size="medium">Transparent</labs-button>
      <labs-button pill variant="primary" size="medium"><labs-icon slot="icon-left" name="add"></labs-icon>Add</labs-button>
    </div>
  \`
}`,...l.parameters?.docs?.source}}};const v=["Default","Primary","Secondary","WithLeftIcon","WithRightIcon","Destructive","Transparent","Pill"];export{e as Default,r as Destructive,l as Pill,a as Primary,t as Secondary,o as Transparent,i as WithLeftIcon,s as WithRightIcon,v as __namedExportsOrder,u as default};
