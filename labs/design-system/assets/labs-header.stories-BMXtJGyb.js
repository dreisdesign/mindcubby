class i extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.render()}static get observedAttributes(){return["title","date","subtitle","center","show-subtitle"]}attributeChangedCallback(){this.render()}render(){const r=this.getAttribute("title")||"",e=this.getAttribute("date")||"",s=this.getAttribute("subtitle")||"",a=this.hasAttribute("center"),l=this.hasAttribute("show-subtitle");this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          margin-bottom: var(--space-md, 24px);
        }
        header {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs, 8px);
          align-items: ${a?"center":"flex-start"};
          text-align: ${a?"center":"left"};
        }
        h1 {
          font-size: var(--font-size-h1, 2rem);
          font-weight: var(--font-weight-heading, 700);
          color: var(--color-on-surface, #222);
          margin: 0;
        }
        .subtitle {
          font-size: var(--font-size-h3, 1.125rem);
          font-weight: var(--font-weight-subheading, 500);
          color: var(--color-on-surface-variant, #555);
          margin: 0;
        }
        .date {
          font-size: var(--font-size-body, 1rem);
          color: var(--color-on-surface-variant, #555);
          font-weight: var(--font-weight-body, 400);
        }
        @media (min-width: 640px) {
          header {
            gap: var(--space-sm, 12px);
          }
        }
      </style>
      <header>
        <h1><slot name="title">${r}</slot></h1>
        ${l&&s?`<div class="subtitle"><slot name="subtitle">${s}</slot></div>`:""}
        ${e?`<div class="date"><slot name="date">${e}</slot></div>`:""}
      </header>
    `}}customElements.define("labs-header",i);const c={title:"2. Components/Template/Header",component:"labs-header",argTypes:{title:{control:"text"},date:{control:"text"},subtitle:{control:"text"},center:{control:"boolean"},showSubtitle:{control:"boolean",name:"Show Subtitle"}}},d=({title:n,date:r,subtitle:e,center:s,showSubtitle:a})=>`
  <labs-header
    title="${n}"
    date="${r}"
    subtitle="${e}"${s?" center":""}${a?" show-subtitle":""}
  ></labs-header>
`,t=d.bind({});t.args={title:"Today",date:"October 2, 2025",subtitle:"Your daily summary",center:!0,showSubtitle:!0};const o=()=>`
  <labs-header center show-subtitle>
    <span slot="title">Custom Title via Slot</span>
    <span slot="subtitle">Slot Subtitle</span>
    <span slot="date">2025-10-02</span>
  </labs-header>
`;t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`({
  title,
  date,
  subtitle,
  center,
  showSubtitle
}) => \`
  <labs-header
    title="\${title}"
    date="\${date}"
    subtitle="\${subtitle}"\${center ? ' center' : ''}\${showSubtitle ? ' show-subtitle' : ''}
  ></labs-header>
\``,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`() => \`
  <labs-header center show-subtitle>
    <span slot="title">Custom Title via Slot</span>
    <span slot="subtitle">Slot Subtitle</span>
    <span slot="date">2025-10-02</span>
  </labs-header>
\``,...o.parameters?.docs?.source}}};const u=["Default","SlotDriven"];export{t as Default,o as SlotDriven,u as __namedExportsOrder,c as default};
