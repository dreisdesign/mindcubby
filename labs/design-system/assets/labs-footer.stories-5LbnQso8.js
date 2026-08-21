import"./labs-footer-Ch46fT0C.js";import"./iframe-DwCuIgL2.js";import"./preload-helper-PPVm8Dsz.js";const i={title:"2. Components/Template/Footer",component:"labs-footer",parameters:{docs:{description:{component:"Canonical `labs-footer` component. Use this for all base layout footers. Fully modular, token-driven, and theme-aware."}}}},t=()=>`
  <labs-footer>
    <div slot="center">
      <labs-button pill size="large" variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Add
      </labs-button>
    </div>
    <div slot="right" style="display:flex;align-items:center;gap:8px;">
      <labs-button variant="icon" aria-label="Settings" size="large" style="padding-right:12px;">
        <labs-icon slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>
`,a=()=>`
  <labs-footer full-width>
    <div slot="center">
      <labs-button pill size="large" variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Add
      </labs-button>
    </div>
    <div slot="right" style="display:flex;align-items:center;gap:8px;">
      <labs-button variant="icon" aria-label="Settings" size="large" style="padding-right:12px;">
        <labs-icon slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>
`;t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => \`
  <labs-footer>
    <div slot="center">
      <labs-button pill size="large" variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Add
      </labs-button>
    </div>
    <div slot="right" style="display:flex;align-items:center;gap:8px;">
      <labs-button variant="icon" aria-label="Settings" size="large" style="padding-right:12px;">
        <labs-icon slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>
\``,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`() => \`
  <labs-footer full-width>
    <div slot="center">
      <labs-button pill size="large" variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Add
      </labs-button>
    </div>
    <div slot="right" style="display:flex;align-items:center;gap:8px;">
      <labs-button variant="icon" aria-label="Settings" size="large" style="padding-right:12px;">
        <labs-icon slot="icon-left" name="settings" width="28" height="28"></labs-icon>
      </labs-button>
    </div>
  </labs-footer>
\``,...a.parameters?.docs?.source}}};const s=["Default","FullWidth"];export{t as Default,a as FullWidth,s as __namedExportsOrder,i as default};
