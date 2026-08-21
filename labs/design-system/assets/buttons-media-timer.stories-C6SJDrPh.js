import"./iframe-Dvm2aYCR.js";import"./preload-helper-PPVm8Dsz.js";const b={title:"4. Patterns/Buttons/Timer",argTypes:{variant:{control:{type:"select"},options:["primary","secondary","destructive"],description:"Visual variant for the button"}},parameters:{layout:"centered"}},a=[{label:"Start",icon:"play_circle"},{label:"Pause",icon:"pause_circle"},{label:"Resume",icon:"not_started"}],r={args:{variant:"secondary"},render:({variant:i})=>{const t=document.createElement("labs-button");t.setAttribute("variant",i),t.setAttribute("pill",""),t.setAttribute("size","large"),t.style.width="100%",t.style.justifyContent="flex-start",t.style.margin="0",t.style.position="static",t.id="timer-btn";let e=0;function s(){for(;t.firstChild;)t.removeChild(t.firstChild);const n=document.createElement("labs-icon");n.setAttribute("slot","icon-left"),n.setAttribute("name",a[e].icon),t.appendChild(n),t.appendChild(document.createTextNode(a[e].label))}t.onclick=()=>{e=(e+1)%a.length,s()};const o=new MutationObserver(()=>s());try{o.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]})}catch{}return s(),t}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary'
  },
  render: ({
    variant
  }) => {
    const btn = document.createElement('labs-button');
    btn.setAttribute('variant', variant);
    btn.setAttribute('pill', '');
    btn.setAttribute('size', 'large');
    btn.style.width = '100%';
    btn.style.justifyContent = 'flex-start';
    btn.style.margin = '0';
    btn.style.position = 'static';
    btn.id = 'timer-btn';
    let state = 0;
    function updateLabel() {
      while (btn.firstChild) btn.removeChild(btn.firstChild);
      const icon = document.createElement('labs-icon');
      icon.setAttribute('slot', 'icon-left');
      icon.setAttribute('name', states[state].icon);
      btn.appendChild(icon);
      btn.appendChild(document.createTextNode(states[state].label));
    }
    btn.onclick = () => {
      state = (state + 1) % states.length;
      updateLabel();
    };

    // Keep the visible label in sync with external theme changes
    const observer = new MutationObserver(() => updateLabel());
    try {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    } catch (e) {}
    updateLabel();
    return btn;
  }
}`,...r.parameters?.docs?.source}}};const u=["Timer"];export{r as Timer,u as __namedExportsOrder,b as default};
