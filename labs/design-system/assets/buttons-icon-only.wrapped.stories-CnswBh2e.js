import{x as r}from"./iframe-Z0sEKzcQ.js";import{i as b}from"./icons-list-BupfDT4a.js";import"./preload-helper-PPVm8Dsz.js";const a={"On Surface":"var(--color-on-surface)","On Primary":"var(--color-on-primary)",Primary:"var(--color-primary)",Error:"var(--color-error)","On Error":"var(--color-on-error)","Settings Icon":"var(--settings-icon-color)"},f={title:"3. Components (Wrapped)/Button/Icon Only",argTypes:{icon:{options:b,control:{type:"select"},description:"Icon name"},colorVariant:{options:Object.keys(a),control:{type:"select"},description:"Icon color variant"},ariaLabel:{control:"text",description:"Aria label for accessibility"},label:{control:"boolean",description:"Show label below the icon (for footer-like usage)"},animation:{control:"boolean",description:"Enable icon hover animation"}},parameters:{docs:{description:{component:"A wrapped demo for icon-only button actions. Used for theme, delete, settings, close, etc. Supports animation and accessibility."}}}},o=({icon:e="settings",colorVariant:i="On Surface",ariaLabel:n="Settings",animation:l=!0,label:s=!1})=>{const c=`
    labs-button[variant="icon"] labs-icon {
      transition: transform 0.4s cubic-bezier(.4,2,.6,1);
      transform: rotate(0deg);
    }
    labs-button[variant="icon"]:hover labs-icon {
      transform: ${l?"rotate(90deg)":"rotate(0deg)"};
    }
    .footer-label {
      display: block;
      margin-top: 4px;
      font-size: 0.78rem;
      color: var(--color-on-surface-variant);
      text-align: center;
    }
  `,t=a[i]||"var(--color-on-surface)";return r`
    <style>${c}</style>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <labs-button variant="icon" aria-label="${n}">
        <labs-icon name="${e}" width="24" height="24" slot="icon-left" color="${t}" style="color: ${t};"></labs-icon>
      </labs-button>
      ${s?r`<span class="footer-label">${n}</span>`:""}
    </div>
  `};o.args={icon:"settings",colorVariant:"On Surface",ariaLabel:"Settings",animation:!0,label:!1};o.storyName="Icon Only";o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`({
  icon = 'settings',
  colorVariant = 'On Surface',
  ariaLabel = 'Settings',
  animation = true,
  label = false
}) => {
  const style = \`
    labs-button[variant="icon"] labs-icon {
      transition: transform 0.4s cubic-bezier(.4,2,.6,1);
      transform: rotate(0deg);
    }
    labs-button[variant="icon"]:hover labs-icon {
      transform: \${animation ? 'rotate(90deg)' : 'rotate(0deg)'};
    }
    .footer-label {
      display: block;
      margin-top: 4px;
      font-size: 0.78rem;
      color: var(--color-on-surface-variant);
      text-align: center;
    }
  \`;
  const color = colorVariants[colorVariant] || 'var(--color-on-surface)';
  return html\`
    <style>\${style}</style>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <labs-button variant="icon" aria-label="\${ariaLabel}">
        <labs-icon name="\${icon}" width="24" height="24" slot="icon-left" color="\${color}" style="color: \${color};"></labs-icon>
      </labs-button>
      \${label ? html\`<span class="footer-label">\${ariaLabel}</span>\` : ''}
    </div>
  \`;
}`,...o.parameters?.docs?.source}}};const u=["IconOnly"];export{o as IconOnly,u as __namedExportsOrder,f as default};
