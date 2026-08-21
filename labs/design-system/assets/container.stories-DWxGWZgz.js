import"./labs-container-D4lCdyY3.js";import"./iframe-DZDCPr1R.js";import{i as l}from"./icons-list-ByY2JTY4.js";import"./preload-helper-PPVm8Dsz.js";const u={title:"1. Foundations/Container",parameters:{docs:{description:{component:"Demonstrates the `labs-container` element and its layout sizes: `small` (max-width: 50%), `medium` (max-width: 60%), `large` (max-width: 70%), and `fill` (100vw). All use consistent 2rem padding on desktop, 1rem on mobile."}}},argTypes:{layout:{control:{type:"radio"},options:["small","medium","large","fill"],description:"Choose a container size"},maxWidth:{control:{type:"text"},description:"Override the container max width (e.g. 960px)"},settingsIcon:{control:{type:"select"},options:Object.keys(l)}},args:{layout:"medium",maxWidth:"",settingsIcon:"settings"}},t={name:"Container Variants",render:i=>{const{layout:a,maxWidth:e,settingsIcon:o}=i,n=a==="small"?"small":a==="medium"?"medium":a==="large"?"large":a==="fill"?"fill":"",s=e?`style="--app-container-max:${e};"`:"",r=a==="small"?"max-width: 50%":a==="medium"?"max-width: 60%":a==="large"?"max-width: 70%":a==="fill"?"100vw":"max-width: 60% (default)";return`
      <style>
        html,body { height:100%; margin:0; padding:0; }
        .page { min-height:100vh; background: var(--color-background, #f6f7f9); padding: 24px 0; }
  .demo-card { background: var(--color-surface, #fff); padding: 16px; border-radius: var(--radius-lg, 8px); box-shadow: var(--elevation-1, none); }
      </style>
      <div class="page">
        <labs-container ${n} ${s}>
          <div class="demo-card">
            <h3 style="margin-top:0;">labs-container ${n?`[${n}]`:""} (${r})</h3>
            <p style="margin:0 0 12px 0; color:var(--color-on-surface-variant,#666);">This container uses viewport-based widths on desktop and fills 100vw on mobile. All variants use consistent 2rem padding on desktop, 1rem on mobile.</p>
            <div style="display:flex;gap:8px;align-items:center;">
              <labs-button pill variant="primary">Primary</labs-button>
              <labs-button variant="icon" aria-label="Settings"><labs-icon name="${o}" slot="icon-left"></labs-icon></labs-button>
            </div>
          </div>
        </labs-container>
      </div>
    `}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  name: 'Container Variants',
  render: args => {
    const {
      layout,
      maxWidth,
      settingsIcon
    } = args;
    const attr = layout === 'small' ? 'small' : layout === 'medium' ? 'medium' : layout === 'large' ? 'large' : layout === 'fill' ? 'fill' : '';
    const style = maxWidth ? \`style="--app-container-max:\${maxWidth};"\` : '';
    const widthLabel = layout === 'small' ? 'max-width: 50%' : layout === 'medium' ? 'max-width: 60%' : layout === 'large' ? 'max-width: 70%' : layout === 'fill' ? '100vw' : 'max-width: 60% (default)';
    return \`
      <style>
        html,body { height:100%; margin:0; padding:0; }
        .page { min-height:100vh; background: var(--color-background, #f6f7f9); padding: 24px 0; }
  .demo-card { background: var(--color-surface, #fff); padding: 16px; border-radius: var(--radius-lg, 8px); box-shadow: var(--elevation-1, none); }
      </style>
      <div class="page">
        <labs-container \${attr} \${style}>
          <div class="demo-card">
            <h3 style="margin-top:0;">labs-container \${attr ? \`[\${attr}]\` : ''} (\${widthLabel})</h3>
            <p style="margin:0 0 12px 0; color:var(--color-on-surface-variant,#666);">This container uses viewport-based widths on desktop and fills 100vw on mobile. All variants use consistent 2rem padding on desktop, 1rem on mobile.</p>
            <div style="display:flex;gap:8px;align-items:center;">
              <labs-button pill variant="primary">Primary</labs-button>
              <labs-button variant="icon" aria-label="Settings"><labs-icon name="\${settingsIcon}" slot="icon-left"></labs-icon></labs-button>
            </div>
          </div>
        </labs-container>
      </div>
    \`;
  }
}`,...t.parameters?.docs?.source}}};const g=["Demo"];export{t as Demo,g as __namedExportsOrder,u as default};
