const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./iframe-CH_1T1kA.js","./preload-helper-PPVm8Dsz.js","./iframe-CmhTq6zs.css"])))=>i.map(i=>d[i]);
import{_ as m}from"./preload-helper-PPVm8Dsz.js";import"./iframe-CH_1T1kA.js";const p={title:"4. Patterns/Buttons/Appearance",argTypes:{variant:{control:{type:"select"},options:["primary","secondary","destructive"],description:"Visual variant for the button"}},parameters:{docs:{description:{component:"A pattern for a theme appearance button (light/dark mode toggle) using Labs Button."}}}},r={args:{variant:"secondary"},render:({variant:i})=>{const t=document.createElement("labs-button");t.setAttribute("variant",i),t.setAttribute("size","large"),t.style.width="100%",t.style.justifyContent="flex-start",t.style.margin="0",t.style.position="static",t.id="appearance-btn";function s(){const e=document.documentElement.classList.contains("theme-dark");for(;t.firstChild;)t.removeChild(t.firstChild);const n=document.createElement("labs-icon");n.setAttribute("slot","icon-left"),n.setAttribute("name",e?"bedtime_off":"bedtime"),t.appendChild(n),t.appendChild(document.createTextNode(e?"Turn on light mode":"Turn on dark mode"))}t.onclick=()=>{const e=document.documentElement.classList.contains("theme-dark"),n=document.documentElement,o=Array.from(n.classList).find(a=>a.startsWith("flavor-")),l=o?o.replace("flavor-",""):"vanilla";m(async()=>{const{applyTheme:a}=await import("./iframe-CH_1T1kA.js").then(d=>d.t);return{applyTheme:a}},__vite__mapDeps([0,1,2]),import.meta.url).then(({applyTheme:a})=>{a({flavor:l,theme:e?"light":"dark"}),s()})};const c=new MutationObserver(()=>s());try{c.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]})}catch{}return s(),t}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary'
  },
  render: ({
    variant
  }) => {
    const btn = document.createElement('labs-button');
    btn.setAttribute('variant', variant);
    btn.setAttribute('size', 'large');
    btn.style.width = '100%';
    btn.style.justifyContent = 'flex-start';
    btn.style.margin = '0';
    btn.style.position = 'static';
    btn.id = 'appearance-btn';
    function updateLabel() {
      const isDark = document.documentElement.classList.contains('theme-dark');
      while (btn.firstChild) btn.removeChild(btn.firstChild);
      const icon = document.createElement('labs-icon');
      icon.setAttribute('slot', 'icon-left');
      icon.setAttribute('name', isDark ? 'bedtime_off' : 'bedtime');
      btn.appendChild(icon);
      btn.appendChild(document.createTextNode(isDark ? 'Turn on light mode' : 'Turn on dark mode'));
    }
    btn.onclick = () => {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const root = document.documentElement;
      const flavorClass = Array.from(root.classList).find(c => c.startsWith('flavor-'));
      const flavor = flavorClass ? flavorClass.replace('flavor-', '') : 'vanilla';
      import('../../utils/theme.js').then(({
        applyTheme
      }) => {
        applyTheme({
          flavor,
          theme: isDark ? 'light' : 'dark'
        });
        updateLabel();
      });
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
}`,...r.parameters?.docs?.source}}};const h=["Appearance"];export{r as Appearance,h as __namedExportsOrder,p as default};
