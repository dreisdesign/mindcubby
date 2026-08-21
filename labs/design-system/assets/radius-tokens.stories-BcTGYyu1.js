const d=[{name:"--radius-none",value:"0"},{name:"--radius-sm",value:"2px"},{name:"--radius-md",value:"4px"},{name:"--radius-lg",value:"8px"},{name:"--radius-xl",value:"16px"},{name:"--radius-full",value:"9999px"}],s=[{name:"--radius-card",value:"var(--radius-lg)",usage:"Cards, Details, Metric Card"},{name:"--radius-modal",value:"var(--radius-xl)",usage:"Modals, Overlays"},{name:"--radius-button",value:"var(--radius-full)",usage:"Buttons, Icon Buttons"},{name:"--radius-badge",value:"var(--radius-full)",usage:"Badges, Pills"},{name:"--radius-input",value:"var(--radius-md)",usage:"Inputs, Text Fields"}],n={title:"0. Tokens / Common / Border Radius"},e=()=>`
    <style>
      .radius-demo-section {
        margin-bottom: 2.5rem;
      }
      .radius-demo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1.5rem;
        margin: 1.5rem 0 0.5rem 0;
      }
      .radius-demo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }
      .radius-swatch {
        width: 64px;
        height: 64px;
        background: var(--color-surface, #fff);
        border: 1.5px solid var(--color-outline, #DDD);
        box-shadow: 0 2px 8px #0001;
        transition: border-radius 0.2s;
      }
      .radius-label {
        font-size: 0.85rem;
        color: var(--color-on-surface, #222);
        text-align: center;
        word-break: break-all;
      }
      .radius-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 2.5rem;
        font-size: 0.98rem;
      }
      .radius-table th, .radius-table td {
        border: 1px solid #e0e0e0;
        padding: 0.5rem 0.75rem;
        text-align: left;
      }
      .radius-table th {
        background: #f8f8fa;
        color: #333;
        font-weight: 600;
      }
      .radius-table code {
        font-size: 0.97em;
        background: #f3f3f3;
        padding: 1px 4px;
        border-radius: 3px;
      }
      .radius-table .usage {
        color: #666;
        font-size: 0.93em;
      }
    </style>
    <div class="radius-demo-section">
      <h3>Base Radius Tokens</h3>
      <div class="radius-demo-grid">
        ${d.map(a=>`
          <div class="radius-demo">
            <div class="radius-swatch" style="border-radius: var(${a.name});"></div>
            <div class="radius-label">${a.name}</div>
          </div>
        `).join("")}
      </div>
    </div>
    <div class="radius-demo-section">
      <h3>Semantic Radius Tokens</h3>
      <div class="radius-demo-grid">
        ${s.map(a=>`
          <div class="radius-demo">
            <div class="radius-swatch" style="border-radius: var(${a.name});"></div>
            <div class="radius-label">${a.name}<br><span style="font-size:0.8em;opacity:0.7;">${a.usage}</span></div>
          </div>
        `).join("")}
      </div>
    </div>
    <table class="radius-table">
      <thead>
        <tr><th>Token</th><th>Resolved Value</th><th>Semantic Usage</th></tr>
      </thead>
      <tbody>
        ${d.map(a=>`
          <tr><td><code>${a.name}</code></td><td><code>${a.value}</code></td><td class="usage">—</td></tr>
        `).join("")}
        ${s.map(a=>`
          <tr><td><code>${a.name}</code></td><td><code>${a.value}</code></td><td class="usage">${a.usage}</td></tr>
        `).join("")}
      </tbody>
    </table>
    `;e.storyName="All Border Radius Tokens";e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`() => {
  return \`
    <style>
      .radius-demo-section {
        margin-bottom: 2.5rem;
      }
      .radius-demo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1.5rem;
        margin: 1.5rem 0 0.5rem 0;
      }
      .radius-demo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }
      .radius-swatch {
        width: 64px;
        height: 64px;
        background: var(--color-surface, #fff);
        border: 1.5px solid var(--color-outline, #DDD);
        box-shadow: 0 2px 8px #0001;
        transition: border-radius 0.2s;
      }
      .radius-label {
        font-size: 0.85rem;
        color: var(--color-on-surface, #222);
        text-align: center;
        word-break: break-all;
      }
      .radius-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 2.5rem;
        font-size: 0.98rem;
      }
      .radius-table th, .radius-table td {
        border: 1px solid #e0e0e0;
        padding: 0.5rem 0.75rem;
        text-align: left;
      }
      .radius-table th {
        background: #f8f8fa;
        color: #333;
        font-weight: 600;
      }
      .radius-table code {
        font-size: 0.97em;
        background: #f3f3f3;
        padding: 1px 4px;
        border-radius: 3px;
      }
      .radius-table .usage {
        color: #666;
        font-size: 0.93em;
      }
    </style>
    <div class="radius-demo-section">
      <h3>Base Radius Tokens</h3>
      <div class="radius-demo-grid">
        \${baseRadiusTokens.map(token => \`
          <div class="radius-demo">
            <div class="radius-swatch" style="border-radius: var(\${token.name});"></div>
            <div class="radius-label">\${token.name}</div>
          </div>
        \`).join('')}
      </div>
    </div>
    <div class="radius-demo-section">
      <h3>Semantic Radius Tokens</h3>
      <div class="radius-demo-grid">
        \${semanticRadiusTokens.map(token => \`
          <div class="radius-demo">
            <div class="radius-swatch" style="border-radius: var(\${token.name});"></div>
            <div class="radius-label">\${token.name}<br><span style="font-size:0.8em;opacity:0.7;">\${token.usage}</span></div>
          </div>
        \`).join('')}
      </div>
    </div>
    <table class="radius-table">
      <thead>
        <tr><th>Token</th><th>Resolved Value</th><th>Semantic Usage</th></tr>
      </thead>
      <tbody>
        \${baseRadiusTokens.map(token => \`
          <tr><td><code>\${token.name}</code></td><td><code>\${token.value}</code></td><td class="usage">—</td></tr>
        \`).join('')}
        \${semanticRadiusTokens.map(token => \`
          <tr><td><code>\${token.name}</code></td><td><code>\${token.value}</code></td><td class="usage">\${token.usage}</td></tr>
        \`).join('')}
      </tbody>
    </table>
    \`;
}`,...e.parameters?.docs?.source}}};const r=["AllBorderRadiusTokens"];export{e as AllBorderRadiusTokens,r as __namedExportsOrder,n as default};
