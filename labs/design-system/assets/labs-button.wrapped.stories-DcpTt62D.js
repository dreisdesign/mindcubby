import"./iframe-DZDCPr1R.js";import"./preload-helper-PPVm8Dsz.js";const t={name:"Restore",render:()=>`
    <labs-button pill variant="secondary">
      <labs-icon slot="icon-left" name="history"></labs-icon>
      Restore
    </labs-button>
  `},d={title:"3. Components (Wrapped)/Button",component:"labs-button"},a={name:"Add",render:()=>`
    <labs-button pill variant="primary">
      <labs-icon slot="icon-left" name="add"></labs-icon>
      Add
    </labs-button>
  `},o={name:"Reset all data",render:()=>`
    <labs-button variant="destructive" size="large" style="gap:10px;">
      <labs-icon slot="icon-left" name="delete" width="20" height="20" color="var(--color-on-error)"></labs-icon>
      Reset All Data
    </labs-button>
  `},s={name:"Animation - Success",render:()=>`
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="success-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="check"></labs-icon>
        Success Animation
      </labs-button>
    </div>
  `,play:async({canvasElement:e})=>{const n=e.querySelector("#success-btn");n&&n.addEventListener("click",()=>{n.animate("success",600)})}},i={name:"Animation - Created",render:()=>`
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="created-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Created Animation
      </labs-button>
    </div>
  `,play:async({canvasElement:e})=>{const n=e.querySelector("#created-btn");n&&n.addEventListener("click",()=>{n.animate("created",600)})}},r={name:"Animation - Pulse",render:()=>`
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="pulse-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="notifications_active"></labs-icon>
        Pulse Animation
      </labs-button>
    </div>
  `,play:async({canvasElement:e})=>{const n=e.querySelector("#pulse-btn");n&&n.addEventListener("click",()=>{n.animate("pulse",600)})}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  name: 'Restore',
  render: () => \`
    <labs-button pill variant="secondary">
      <labs-icon slot="icon-left" name="history"></labs-icon>
      Restore
    </labs-button>
  \`
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'Add',
  render: () => \`
    <labs-button pill variant="primary">
      <labs-icon slot="icon-left" name="add"></labs-icon>
      Add
    </labs-button>
  \`
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: 'Reset all data',
  render: () => \`
    <labs-button variant="destructive" size="large" style="gap:10px;">
      <labs-icon slot="icon-left" name="delete" width="20" height="20" color="var(--color-on-error)"></labs-icon>
      Reset All Data
    </labs-button>
  \`
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: 'Animation - Success',
  render: () => \`
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="success-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="check"></labs-icon>
        Success Animation
      </labs-button>
    </div>
  \`,
  play: async ({
    canvasElement
  }) => {
    const btn = canvasElement.querySelector('#success-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.animate('success', 600);
      });
    }
  }
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: 'Animation - Created',
  render: () => \`
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="created-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="add"></labs-icon>
        Created Animation
      </labs-button>
    </div>
  \`,
  play: async ({
    canvasElement
  }) => {
    const btn = canvasElement.querySelector('#created-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.animate('created', 600);
      });
    }
  }
}`,...i.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  name: 'Animation - Pulse',
  render: () => \`
    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
      <p style="font-size: 0.9em; color: var(--color-on-surface-variant, #666);">Click button to trigger animation</p>
      <labs-button id="pulse-btn" pill variant="primary">
        <labs-icon slot="icon-left" name="notifications_active"></labs-icon>
        Pulse Animation
      </labs-button>
    </div>
  \`,
  play: async ({
    canvasElement
  }) => {
    const btn = canvasElement.querySelector('#pulse-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.animate('pulse', 600);
      });
    }
  }
}`,...r.parameters?.docs?.source}}};const m=["Restore","Add","ResetAllData","AnimationSuccess","AnimationCreated","AnimationPulse"];export{a as Add,i as AnimationCreated,r as AnimationPulse,s as AnimationSuccess,o as ResetAllData,t as Restore,m as __namedExportsOrder,d as default};
