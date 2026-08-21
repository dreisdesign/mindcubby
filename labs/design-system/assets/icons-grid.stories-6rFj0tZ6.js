import{x as n}from"./iframe-CH_1T1kA.js";import{i}from"./icons-list-BupfDT4a.js";import"./preload-helper-PPVm8Dsz.js";const d={title:"1. Foundations/Icons",parameters:{layout:"fullscreen",docs:{description:{component:"Complete icon library for the Labs Design System. All icons are SVG-based with customizable size and color. Use the controls to test different sizes and colors across all available icons."}}},argTypes:{size:{control:{type:"range",min:16,max:64,step:1},description:"Icon size in pixels"},color:{control:"color",description:"Icon color"}}},r={render:(t={size:32,color:"#374151"})=>{const{size:e=32,color:a="#374151"}=t;return n`
      <style>
        * { box-sizing: border-box; }
        /* Page/container background should follow the theme background token */
        .container { padding: 2rem; background: var(--color-background, #f8fafc); min-height: 100vh; }
        /* Title uses on-background so it remains readable against the page background */
        .title { text-align: center; margin-bottom: 2rem; font-size: 1.5rem; font-weight: 600; color: var(--color-on-background, #1f2937); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; max-width: 1200px; margin: 0 auto; }
  .card { background: var(--color-surface); border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-height: 140px; justify-content: center; transition: all 0.2s ease; word-wrap: break-word; overflow-wrap: break-word; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-color: #3b82f6; }
        /* Icon color follows the provided arg or falls back to the theme on-surface color */
        .icon { display: block; width: ${e}px; height: ${e}px; color: ${a}; }
        /* Name / usage text should use on-surface so it contrasts with the card surface */
  .name { font-size: var(--font-size-sm, 0.875rem); font-weight: 500; color: var(--color-on-surface, #374151); margin-top: 0.5rem; }
  .usage { font-size: var(--font-size-sm, 0.875rem); color: var(--color-on-surface, #6b7280); font-family: monospace; margin-top: 0.25rem; word-break: break-word; hyphens: none; max-width: 100%; overflow-wrap: break-word; white-space: pre-wrap; }
        @media (max-width: 768px) { .grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; } .card { padding: 0.75rem; min-height: 120px; } }
        @media (max-width: 480px) { .grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; } .card { padding: 0.5rem; min-height: 100px; } .usage { font-size: 0.75rem; } .container { padding: 1rem; } }
      </style>
      <div class="container">
        <h1 class="title">Icons (${i.length} total)</h1>
        <div class="grid">
          ${i.map(o=>n`
            <div class="card">
              <labs-icon
                name="${o}"
                class="icon"
                width="${e}"
                height="${e}"
                color="${a}"
              ></labs-icon>
              <div class="name">${o}</div>
              <div class="usage">&lt;labs-icon name="${o}"&gt;</div>
            </div>
          `)}
        </div>
      </div>
    `},args:{size:32,color:"var(--color-on-surface)"},parameters:{docs:{description:{story:"A clean grid layout showcasing all available icons in the Labs Design System."}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: (args = {
    size: 32,
    color: '#374151'
  }) => {
    const {
      size = 32,
      color = '#374151'
    } = args;
    return html\`
      <style>
        * { box-sizing: border-box; }
        /* Page/container background should follow the theme background token */
        .container { padding: 2rem; background: var(--color-background, #f8fafc); min-height: 100vh; }
        /* Title uses on-background so it remains readable against the page background */
        .title { text-align: center; margin-bottom: 2rem; font-size: 1.5rem; font-weight: 600; color: var(--color-on-background, #1f2937); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; max-width: 1200px; margin: 0 auto; }
  .card { background: var(--color-surface); border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-height: 140px; justify-content: center; transition: all 0.2s ease; word-wrap: break-word; overflow-wrap: break-word; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-color: #3b82f6; }
        /* Icon color follows the provided arg or falls back to the theme on-surface color */
        .icon { display: block; width: \${size}px; height: \${size}px; color: \${color}; }
        /* Name / usage text should use on-surface so it contrasts with the card surface */
  .name { font-size: var(--font-size-sm, 0.875rem); font-weight: 500; color: var(--color-on-surface, #374151); margin-top: 0.5rem; }
  .usage { font-size: var(--font-size-sm, 0.875rem); color: var(--color-on-surface, #6b7280); font-family: monospace; margin-top: 0.25rem; word-break: break-word; hyphens: none; max-width: 100%; overflow-wrap: break-word; white-space: pre-wrap; }
        @media (max-width: 768px) { .grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; } .card { padding: 0.75rem; min-height: 120px; } }
        @media (max-width: 480px) { .grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; } .card { padding: 0.5rem; min-height: 100px; } .usage { font-size: 0.75rem; } .container { padding: 1rem; } }
      </style>
      <div class="container">
        <h1 class="title">Icons (\${iconsList.length} total)</h1>
        <div class="grid">
          \${iconsList.map(icon => html\`
            <div class="card">
              <labs-icon
                name="\${icon}"
                class="icon"
                width="\${size}"
                height="\${size}"
                color="\${color}"
              ></labs-icon>
              <div class="name">\${icon}</div>
              <div class="usage">&lt;labs-icon name="\${icon}"&gt;</div>
            </div>
          \`)}
        </div>
      </div>
    \`;
  },
  args: {
    size: 32,
    color: 'var(--color-on-surface)'
  },
  parameters: {
    docs: {
      description: {
        story: 'A clean grid layout showcasing all available icons in the Labs Design System.'
      }
    }
  }
}`,...r.parameters?.docs?.source}}};const m=["IconsGrid"];export{r as IconsGrid,m as __namedExportsOrder,d as default};
