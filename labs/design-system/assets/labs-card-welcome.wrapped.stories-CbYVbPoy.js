import"./labs-card-gh7wjDdw.js";import"./iframe-Dp47ayeH.js";import"./preload-helper-PPVm8Dsz.js";const i={title:"3. Components (Wrapped)/Card/Welcome",component:"labs-card",parameters:{docs:{description:{component:"A wrapped welcome card variant using the canonical labs-card. Shows header, description, actions, and (optionally) an icon."}}}},n=()=>{const t=document.createElement("labs-card");t.setAttribute("variant","welcome"),t.style.maxWidth="420px";const a=document.createElement("span");a.slot="header",a.textContent="Welcome!",t.appendChild(a);const o=document.createElement("div");o.slot="description",o.textContent="Get started by exploring our design system components.",t.appendChild(o);const e=document.createElement("div");e.slot="actions",e.style.display="flex",e.style.gap="10px",e.style.justifyContent="center";const c=document.createElement("labs-button");return c.setAttribute("variant","primary"),c.textContent="Get Started",e.appendChild(c),t.appendChild(e),t};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`() => {
  const card = document.createElement('labs-card');
  card.setAttribute('variant', 'welcome');
  card.style.maxWidth = '420px';
  const header = document.createElement('span');
  header.slot = 'header';
  header.textContent = 'Welcome!';
  card.appendChild(header);

  // Optionally add an icon (uncomment if needed)
  // const icon = document.createElement('labs-icon');
  // icon.setAttribute('name', 'star');
  // icon.setAttribute('slot', 'icon');
  // icon.style.color = 'var(--color-primary, #007bff)';
  // icon.style.fontSize = '2rem';
  // card.appendChild(icon);

  const desc = document.createElement('div');
  desc.slot = 'description';
  desc.textContent = 'Get started by exploring our design system components.';
  card.appendChild(desc);
  const actionsDiv = document.createElement('div');
  actionsDiv.slot = 'actions';
  actionsDiv.style.display = 'flex';
  actionsDiv.style.gap = '10px';
  actionsDiv.style.justifyContent = 'center';
  const getStartedBtn = document.createElement('labs-button');
  getStartedBtn.setAttribute('variant', 'primary');
  getStartedBtn.textContent = 'Get Started';
  actionsDiv.appendChild(getStartedBtn);
  card.appendChild(actionsDiv);
  return card;
}`,...n.parameters?.docs?.source}}};const l=["Default"];export{n as Default,l as __namedExportsOrder,i as default};
