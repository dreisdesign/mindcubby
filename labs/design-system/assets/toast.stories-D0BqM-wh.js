import"./labs-toast-O_M40YTk.js";import"./iframe-C8oYMbct.js";import"./preload-helper-PPVm8Dsz.js";const l={title:"4. Patterns/Toast",tags:["autodocs"],parameters:{viewMode:"docs"}},n={name:"Undo Only",render:()=>`
    <div style="padding:20px;">
      <labs-button id="show-undo" variant="primary" pill>Show Undo Toast</labs-button>
    </div>
  `,play:async({canvasElement:s})=>{const e=(s||document).querySelector("#show-undo");if(!e)return;const o=()=>{let t=document.querySelector("labs-toast");t||(t=document.createElement("labs-toast"),document.body.appendChild(t)),t.show("Item moved to archive",{actionText:"Undo",duration:5e3});const a=()=>{t.removeEventListener("action",a),document.dispatchEvent(new CustomEvent("pattern-undo",{detail:{}}))};t.addEventListener("action",a)};e.removeEventListener("click",o),e.addEventListener("click",o)}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  name: 'Undo Only',
  render: () => \`
    <div style="padding:20px;">
      <labs-button id="show-undo" variant="primary" pill>Show Undo Toast</labs-button>
    </div>
  \`,
  // Use Storybook's play function to attach JS in a way Storybook executes in the canvas
  play: async ({
    canvasElement
  }) => {
    const root = canvasElement || document;
    const btn = root.querySelector('#show-undo');
    if (!btn) return;
    const handler = () => {
      let toast = document.querySelector('labs-toast');
      if (!toast) {
        toast = document.createElement('labs-toast');
        document.body.appendChild(toast);
      }
      toast.show('Item moved to archive', {
        actionText: 'Undo',
        duration: 5000
      });
      const onAction = () => {
        toast.removeEventListener('action', onAction);
        document.dispatchEvent(new CustomEvent('pattern-undo', {
          detail: {}
        }));
      };
      toast.addEventListener('action', onAction);
    };

    // Remove any previous listener to avoid duplicate wiring during hot reloads
    btn.removeEventListener('click', handler);
    btn.addEventListener('click', handler);
  }
}`,...n.parameters?.docs?.source}}};const u=["UndoOnly"];export{n as UndoOnly,u as __namedExportsOrder,l as default};
