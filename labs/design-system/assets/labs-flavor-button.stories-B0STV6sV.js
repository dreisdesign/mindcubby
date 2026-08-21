class y extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._observer=null,this.render=this.render.bind(this),this.render()}static get observedAttributes(){return["label"]}connectedCallback(){const r=document.documentElement;this._observer=new MutationObserver(s=>{for(const t of s)if(t.attributeName==="class"){this.render();break}}),this._observer.observe(r,{attributes:!0,attributeFilter:["class"]})}disconnectedCallback(){this._observer&&(this._observer.disconnect(),this._observer=null)}attributeChangedCallback(){this.render()}getFlavorName(){const r=[...document.documentElement.classList].find(t=>t.startsWith("flavor-"));return r?r.split("-").slice(1).join("-").split("-").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" "):null}render(){const r=this.getFlavorName(),s=this.getAttribute("label"),t=this.getAttribute("variant")||"secondary",u=r||s||"Flavor";this.shadowRoot.innerHTML=`
      <style>
        :host { display: block; }
        labs-button { width: 100%; box-sizing: border-box; }
      </style>
    <labs-button variant="${t}" size="large" style="gap:10px; justify-content:flex-start;">
        <labs-icon name="colors" slot="icon-left" width="20" height="20"></labs-icon>
        ${u}
      </labs-button>
    `;const i=this.shadowRoot.querySelector("labs-button");i&&i.addEventListener("click",v=>{v.preventDefault();const a=["vanilla","blueberry","strawberry"],n=document.documentElement,b=document.body,d=[...n.classList].find(e=>e&&e.startsWith("flavor-")),m=d?d.split("-").slice(1).join("-"):null,h=Math.max(0,a.indexOf(m)),l=a[(h+1)%a.length];for(const e of a)n.classList.remove(`flavor-${e}`),b.classList.remove(`flavor-${e}`);n.classList.add(`flavor-${l}`),b.classList.add(`flavor-${l}`);try{localStorage.setItem("tracker-flavor",l);const e=[...n.classList].find(p=>p.startsWith("theme-")),f=e?e.replace("theme-",""):"light";localStorage.setItem("tracker-theme",f)}catch{}this.render(),this.dispatchEvent(new CustomEvent("cycle-flavor",{detail:{flavor:l},bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("click",{bubbles:!0,composed:!0}))})}}customElements.define("labs-flavor-button",y);const w={title:"4. Patterns/Buttons/Flavor",argTypes:{variant:{control:{type:"select"},options:["primary","secondary","destructive","icon"]},flavor:{control:"text"}}},o=({flavor:c="blueberry",variant:r="secondary"})=>{const s=document.createElement("div");s.style.maxWidth="360px",s.innerHTML=`<labs-flavor-button variant="${r}"></labs-flavor-button>`;const t=document.documentElement;return t.classList.remove("flavor-vanilla","flavor-blueberry","flavor-strawberry"),t.classList.add(`flavor-${c.toLowerCase()}`),s};o.args={flavor:"blueberry",variant:"secondary"};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`({
  flavor = 'blueberry',
  variant = 'secondary'
}) => {
  const wrap = document.createElement('div');
  wrap.style.maxWidth = '360px';
  wrap.innerHTML = \`<labs-flavor-button variant="\${variant}"></labs-flavor-button>\`;
  // Set initial flavor based on the story arg. The component will handle subsequent cycles.
  const root = document.documentElement;
  root.classList.remove('flavor-vanilla', 'flavor-blueberry', 'flavor-strawberry');
  root.classList.add(\`flavor-\${flavor.toLowerCase()}\`);
  return wrap;
}`,...o.parameters?.docs?.source}}};const L=["Flavor"];export{o as Flavor,L as __namedExportsOrder,w as default};
