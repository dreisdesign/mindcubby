import"./labs-toast-n1SbVlpY.js";const i={title:"2. Components/Toast",tags:["autodocs"],args:{open:!1,variant:"primary"},argTypes:{open:{control:{type:"boolean"},description:"Open toast on render"},variant:{control:{type:"select"},options:["primary","secondary","destructive"],description:"Button style variant for the Toast action button",defaultValue:"primary"}}},s={render:({variant:e})=>{const t=document.createElement("div"),n=document.createElement("labs-toast");n.setAttribute("variant",e),document.body.appendChild(n);const o=document.createElement("labs-button");return o.setAttribute("variant",e),o.setAttribute("pill",""),o.textContent="Show undo toast",o.addEventListener("click",()=>{n.setAttribute("variant",e),n.show("Item deleted",{actionText:"Undo",duration:4e3}),n.addEventListener("action",a=>{const r=document.createElement("p");r.textContent=`Action clicked: ${a.detail.message}`,t.appendChild(r)},{once:!0}),n.addEventListener("dismiss",()=>{const a=document.createElement("p");a.textContent="Toast dismissed",t.appendChild(a)},{once:!0})}),t.appendChild(o),t},play:async({args:e})=>{if(!e.open)return;let t=document.querySelector("labs-toast");t||(t=document.createElement("labs-toast"),document.body.appendChild(t)),t.setAttribute("variant",e.variant||"primary"),t.show("Item deleted",{actionText:"Undo",duration:4e3})}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: ({
    variant
  }) => {
    const root = document.createElement('div');
    const toast = document.createElement('labs-toast');
    toast.setAttribute('variant', variant);
    // ensure single instance in document body for demo
    document.body.appendChild(toast);
    const btn = document.createElement('labs-button');
    btn.setAttribute('variant', variant);
    btn.setAttribute('pill', '');
    btn.textContent = 'Show undo toast';
    btn.addEventListener('click', () => {
      toast.setAttribute('variant', variant);
      toast.show('Item deleted', {
        actionText: 'Undo',
        duration: 4000
      });
      toast.addEventListener('action', e => {
        const p = document.createElement('p');
        p.textContent = \`Action clicked: \${e.detail.message}\`;
        root.appendChild(p);
      }, {
        once: true
      });
      toast.addEventListener('dismiss', () => {
        const p = document.createElement('p');
        p.textContent = 'Toast dismissed';
        root.appendChild(p);
      }, {
        once: true
      });
    });
    root.appendChild(btn);
    return root;
  },
  play: async ({
    args
  }) => {
    if (!args.open) return;
    let toast = document.querySelector('labs-toast');
    if (!toast) {
      toast = document.createElement('labs-toast');
      document.body.appendChild(toast);
    }
    toast.setAttribute('variant', args.variant || 'primary');
    toast.show('Item deleted', {
      actionText: 'Undo',
      duration: 4000
    });
  }
}`,...s.parameters?.docs?.source}}};const c=["Default"];export{s as Default,c as __namedExportsOrder,i as default};
