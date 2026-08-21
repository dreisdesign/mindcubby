import"./labs-expandable-card-DAr409je.js";import"./iframe-DZDCPr1R.js";import"./preload-helper-PPVm8Dsz.js";const m={title:"4. Patterns/Expandable Card - Note Editor",component:"labs-expandable-card",parameters:{docs:{description:{component:`
Real-world usage pattern: Expandable card in a fullscreen note editor.
Demonstrates how to integrate expand/collapse with timestamp tracking and auto-save behavior.
        `}}}},n=()=>{const e=document.createElement("div");e.style.padding="2rem",e.innerHTML=`
    <div style="max-width: 600px; margin: 0 auto;">
      <h3 style="margin: 0 0 1rem 0;">Daily Note</h3>
      
      <labs-expandable-card id="noteCard">
        <span slot="header">Today's Note</span>
        
        <labs-button slot="close" variant="icon" data-expand-toggle aria-label="Toggle fullscreen">
          <labs-icon slot="icon-left" name="expand_content" width="24" height="24"></labs-icon>
        </labs-button>
        
        <div slot="description">Click expand for fullscreen editing mode</div>
        
        <div slot="input">
          <textarea id="noteText" placeholder="Write your thoughts here..." style="width: 100%; min-height: 150px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; resize: vertical;"></textarea>
        </div>
        
        <div slot="actions" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: #666;">
          <span id="timestamp">Last edited —</span>
          <span id="saveStatus"></span>
        </div>
      </labs-expandable-card>
    </div>
  `;const i=e.querySelector("#noteCard"),s=e.querySelector("labs-icon"),o=e.querySelector("#noteText"),r=e.querySelector("#timestamp"),t=e.querySelector("#saveStatus");return i.addEventListener("expanded-changed",a=>{s.setAttribute("name",a.detail.expanded?"collapse_content":"expand_content"),a.detail.expanded&&o.focus()}),o.addEventListener("input",()=>{const d=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});r.textContent=`Last edited ${d}`,t.textContent="Saving...",t.style.opacity="0.7",setTimeout(()=>{t.textContent="Saved",t.style.opacity="1",setTimeout(()=>{t.textContent=""},2e3)},500)}),e};n.storyName="Fullscreen Note Editor";n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '2rem';
  wrapper.innerHTML = \`
    <div style="max-width: 600px; margin: 0 auto;">
      <h3 style="margin: 0 0 1rem 0;">Daily Note</h3>
      
      <labs-expandable-card id="noteCard">
        <span slot="header">Today's Note</span>
        
        <labs-button slot="close" variant="icon" data-expand-toggle aria-label="Toggle fullscreen">
          <labs-icon slot="icon-left" name="expand_content" width="24" height="24"></labs-icon>
        </labs-button>
        
        <div slot="description">Click expand for fullscreen editing mode</div>
        
        <div slot="input">
          <textarea id="noteText" placeholder="Write your thoughts here..." style="width: 100%; min-height: 150px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; resize: vertical;"></textarea>
        </div>
        
        <div slot="actions" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: #666;">
          <span id="timestamp">Last edited —</span>
          <span id="saveStatus"></span>
        </div>
      </labs-expandable-card>
    </div>
  \`;
  const card = wrapper.querySelector('#noteCard');
  const icon = wrapper.querySelector('labs-icon');
  const textarea = wrapper.querySelector('#noteText');
  const timestamp = wrapper.querySelector('#timestamp');
  const saveStatus = wrapper.querySelector('#saveStatus');

  // Icon toggle on expand/collapse
  card.addEventListener('expanded-changed', e => {
    icon.setAttribute('name', e.detail.expanded ? 'collapse_content' : 'expand_content');
    if (e.detail.expanded) {
      textarea.focus();
    }
  });

  // Update timestamp on input
  textarea.addEventListener('input', () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    timestamp.textContent = \`Last edited \${time}\`;
    saveStatus.textContent = 'Saving...';
    saveStatus.style.opacity = '0.7';

    // Simulate auto-save after 500ms
    setTimeout(() => {
      saveStatus.textContent = 'Saved';
      saveStatus.style.opacity = '1';
      setTimeout(() => {
        saveStatus.textContent = '';
      }, 2000);
    }, 500);
  });
  return wrapper;
}`,...n.parameters?.docs?.source}}};const u=["NoteEditorWithTimestamp"];export{n as NoteEditorWithTimestamp,u as __namedExportsOrder,m as default};
