import"./labs-toast-n1SbVlpY.js";const s={title:"3. Components (Wrapped)/Toast",tags:["autodocs"],argTypes:{variant:{control:{type:"select"},options:["primary","secondary","destructive"],description:"Button style variant for the Toast action button",defaultValue:"primary"}},args:{variant:"primary"}},o={render:({variant:n})=>{const t=document.createElement("labs-toast");t.setAttribute("variant",n),t.style.position="static",t.style.transform="none",t.style.margin="24px auto",t.style.display="block";function e(){t._container&&t._message&&t._actionBtn&&(t._message.textContent="Toast visible for demo",t._actionBtn.textContent="Undo",t._container.classList.add("show"),t._container.style.position="static",t._container.style.transform="none",t._container.style.margin="0 auto")}return e(),setTimeout(e,0),t}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: ({
    variant
  }) => {
    const toast = document.createElement('labs-toast');
    toast.setAttribute('variant', variant);
    // Style override for Storybook docs/demo: static position, no transform
    toast.style.position = 'static';
    toast.style.transform = 'none';
    toast.style.margin = '24px auto';
    toast.style.display = 'block';
    function showAndStyle() {
      if (toast._container && toast._message && toast._actionBtn) {
        toast._message.textContent = 'Toast visible for demo';
        toast._actionBtn.textContent = 'Undo';
        toast._container.classList.add('show');
        toast._container.style.position = 'static';
        toast._container.style.transform = 'none';
        toast._container.style.margin = '0 auto';
      }
    }
    showAndStyle();
    setTimeout(showAndStyle, 0);
    return toast;
  }
}`,...o.parameters?.docs?.source},description:{story:`Wrapped Toast: Preconfigured, logic-free, reusable toast overlay.
Usage: Place <labs-toast> once in your app (usually near <body>), then call .show() from anywhere.
This story demonstrates the default appearance and slot structure only.`,...o.parameters?.docs?.description}}};const r=["Default"];export{o as Default,r as __namedExportsOrder,s as default};
