import"./labs-overlay-PCtGcMOL.js";import"./iframe-C8oYMbct.js";import"./labs-card-gh7wjDdw.js";import"./preload-helper-PPVm8Dsz.js";const d={title:"2. Components/Overlay",parameters:{docs:{description:{component:"A modal overlay component with backdrop blur and customizable content."}}}},n={name:"Overlay with Card",render:()=>{const e=document.createElement("div");e.innerHTML=`
      <labs-button id="open-overlay-btn" pill>Open Overlay</labs-button>
      <labs-overlay id="card-overlay">
        <labs-card>
          <h2 slot="header">Overlay with Card</h2>
          <p>This overlay contains a card with a header, content, and actions.</p>
          <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px;">
            <labs-button pill variant="secondary" onclick="document.getElementById('card-overlay').close()">Cancel</labs-button>
            <labs-button pill variant="primary" onclick="document.getElementById('card-overlay').close()">Confirm</labs-button>
          </div>
        </labs-card>
      </labs-overlay>
    `;const t=e.querySelector("#open-overlay-btn"),r=e.querySelector("#card-overlay");return t.addEventListener("click",()=>{r.open()}),e}},a={name:"Open by default",render:()=>`
        <labs-overlay open>
          <labs-card>
            <h2 slot="header">Open Overlay</h2>
            <p>This overlay is open by default.</p>
            <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px;">
              <labs-button pill variant="secondary" onclick="this.closest('labs-overlay').close()">Close</labs-button>
            </div>
          </labs-card>
        </labs-overlay>
      `};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  name: 'Overlay with Card',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = \`
      <labs-button id="open-overlay-btn" pill>Open Overlay</labs-button>
      <labs-overlay id="card-overlay">
        <labs-card>
          <h2 slot="header">Overlay with Card</h2>
          <p>This overlay contains a card with a header, content, and actions.</p>
          <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px;">
            <labs-button pill variant="secondary" onclick="document.getElementById('card-overlay').close()">Cancel</labs-button>
            <labs-button pill variant="primary" onclick="document.getElementById('card-overlay').close()">Confirm</labs-button>
          </div>
        </labs-card>
      </labs-overlay>
    \`;
    const openBtn = container.querySelector('#open-overlay-btn');
    const overlay = container.querySelector('#card-overlay');
    openBtn.addEventListener('click', () => {
      overlay.open();
    });
    return container;
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: 'Open by default',
  render: () => {
    return \`
        <labs-overlay open>
          <labs-card>
            <h2 slot="header">Open Overlay</h2>
            <p>This overlay is open by default.</p>
            <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px;">
              <labs-button pill variant="secondary" onclick="this.closest('labs-overlay').close()">Close</labs-button>
            </div>
          </labs-card>
        </labs-overlay>
      \`;
  }
}`,...a.parameters?.docs?.source}}};const i=["OverlayWithCard","OpenOverlay"];export{a as OpenOverlay,n as OverlayWithCard,i as __namedExportsOrder,d as default};
