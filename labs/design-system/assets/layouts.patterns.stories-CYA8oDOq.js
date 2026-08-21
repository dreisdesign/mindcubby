import"./labs-container-D4lCdyY3.js";import"./labs-card-gh7wjDdw.js";import"./iframe-DZDCPr1R.js";import"./preload-helper-PPVm8Dsz.js";const x={title:"4. Patterns/Layouts - Vertical Fill",parameters:{docs:{description:{component:`
**Vertical Fill Pattern: Cascading flex-grow through component hierarchy**

When building fullscreen editors, detail panels, or modal forms, you need content to expand and fill all available vertical space. This pattern shows how to achieve that by cascading \`display: flex\`, \`flex-direction: column\`, and \`flex: 1; flex-grow: 1\` through each level of nesting.

**The Pattern:**
\`\`\`
Container (flex: 1, flex-direction: column)
  ↓
Display Area (flex: 1)
  ↓
Card (flex: 1, height: 100%)
  ↓
Input Slot (flex: 1, overflow: auto)
  ↓
Textarea (flex: 1, resize: none)
\`\`\`

Each level must:
1. Have \`display: flex\`
2. Have \`flex-direction: column\`
3. Have \`flex: 1\` (or \`flex-grow: 1\`)
4. Have \`min-height: 0\` (for Firefox compatibility)

**Why This Works:**
- Flex containers don't know their final size until rendered
- \`min-height: 0\` allows flex items to shrink below content size
- Each level explicitly tells children to grow
- No scrollbars or content overflow

**When to Use:**
- Fullscreen note editors
- Modal forms with expandable textareas
- Detail panels with scrollable content
- Any "focus mode" UI where input should fill space
        `}}}},r=()=>{const e=document.createElement("div");e.style.width="100vw",e.style.height="100vh",e.style.display="flex",e.style.flexDirection="column",e.innerHTML=`
    <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
      <!-- Header -->
      <div style="padding: 1rem; border-bottom: 1px solid #eee; flex-shrink: 0;">
        <h2 style="margin: 0; font-size: 1.5rem;">Fullscreen Editor</h2>
        <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.875rem;">Click the expand button to see this pattern in action</p>
      </div>

      <!-- Main Content Area (fills remaining space) -->
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 1rem; overflow: auto;">
        
        <!-- Card fills the flex space -->
        <labs-card style="flex: 1; display: flex; flex-direction: column; height: 100%; min-height: 0;">
          <span slot="header">Document Title</span>
          
          <div slot="description">This textarea fills all available vertical space. Try typing to see it stay visible.</div>
          
          <!-- Input slot with flex -->
          <div slot="input" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
            <textarea id="editor" placeholder="Start typing... The textarea will fill all available space." style="width: 100%; flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; resize: none; min-height: 0;"></textarea>
          </div>
          
          <!-- Footer with word count -->
          <div slot="actions" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: #666; flex-shrink: 0;">
            <span id="wordCount">0 words</span>
            <div style="display: flex; gap: 8px;">
              <labs-button pill variant="secondary">Cancel</labs-button>
              <labs-button pill variant="primary">Save</labs-button>
            </div>
          </div>
        </labs-card>

      </div>
    </div>
  `;const o=e.querySelector("#editor"),l=e.querySelector("#wordCount");return o.addEventListener("input",()=>{const a=o.value.trim().split(/\s+/).filter(d=>d).length;l.textContent=`${a} words`}),setTimeout(()=>o.focus(),100),e};r.storyName="Fullscreen Editor Layout";const n=()=>{const e=document.createElement("div");return e.style.padding="2rem",e.innerHTML=`
    <div style="max-width: 800px; margin: 0 auto;">
      <h3 style="margin: 0 0 1rem 0;">❌ Without Flex Cascading (Problem)</h3>
      <p style="color: #d32f2f; margin: 0 0 1rem 0; font-size: 0.875rem; background: #ffebee; padding: 8px 12px; border-radius: 4px;">
        Notice: Content overflows or textarea doesn't grow. Scrollbars appear unexpectedly.
      </p>

      <div style="height: 400px; border: 2px solid #d32f2f; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
        <!-- Missing flex: 1 at container level -->
        <div style="padding: 1rem; border-bottom: 1px solid #eee;">
          <h4 style="margin: 0;">Form Title</h4>
        </div>

        <!-- Card NOT using flex -->
        <labs-card>
          <span slot="header">Document</span>
          
          <!-- Input slot WITHOUT flex -->
          <div slot="input">
            <textarea placeholder="This textarea won't grow properly..." style="width: 100%; height: 200px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;"></textarea>
          </div>
        </labs-card>
      </div>

      <p style="color: #666; margin: 1rem 0 0 0; font-size: 0.875rem;">
        <strong>Issues:</strong> Fixed height (200px) doesn't adapt to container. Content overflows. Scrollbars appear inside textarea.
      </p>
    </div>
  `,e};n.storyName="Anti-Pattern (Fixed Height)";const t=()=>{const e=document.createElement("div");return e.style.padding="2rem",e.innerHTML=`
    <div style="max-width: 800px; margin: 0 auto;">
      <h3 style="margin: 0 0 1rem 0;">✅ With Flex Cascading (Correct)</h3>
      <p style="color: #388e3c; margin: 0 0 1rem 0; font-size: 0.875rem; background: #e8f5e9; padding: 8px 12px; border-radius: 4px;">
        Notice: Textarea expands to fill container. No unexpected scrollbars. Clean, responsive layout.
      </p>

      <div style="height: 400px; border: 2px solid #388e3c; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
        <!-- Flex at container level -->
        <div style="padding: 1rem; border-bottom: 1px solid #eee; flex-shrink: 0;">
          <h4 style="margin: 0;">Form Title</h4>
        </div>

        <!-- Card WITH flex cascading -->
        <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 1rem; overflow: auto;">
          <labs-card style="flex: 1; display: flex; flex-direction: column; height: 100%; min-height: 0;">
            <span slot="header">Document</span>
            
            <!-- Input slot WITH flex -->
            <div slot="input" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
              <textarea placeholder="This textarea fills all available space!" style="width: 100%; flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; resize: none; min-height: 0;"></textarea>
            </div>
          </labs-card>
        </div>
      </div>

      <p style="color: #666; margin: 1rem 0 0 0; font-size: 0.875rem;">
        <strong>Benefits:</strong> Textarea adapts to container size. No fixed heights. Scales responsively. Clean appearance.
      </p>
    </div>
  `,e};t.storyName="Correct Pattern (Flex Cascading)";const i=()=>{const e=document.createElement("div");return e.style.padding="2rem",e.innerHTML=`
    <div style="max-width: 900px; margin: 0 auto;">
      <h2 style="margin: 0 0 2rem 0;">Key Principles for Vertical Fill</h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Principle 1 -->
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #1976d2; font-size: 1.1rem;">1. Flex Containers</h3>
          <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.6;">
            Every parent that should grow must have:
          </p>
          <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 0.8rem; margin: 12px 0 0 0; overflow: auto;">
<code>display: flex;
flex-direction: column;</code>
          </pre>
        </div>

        <!-- Principle 2 -->
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #1976d2; font-size: 1.1rem;">2. Flex Growth</h3>
          <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.6;">
            Growable elements need:
          </p>
          <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 0.8rem; margin: 12px 0 0 0; overflow: auto;">
<code>flex: 1;
flex-grow: 1;
min-height: 0;</code>
          </pre>
        </div>

        <!-- Principle 3 -->
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #388e3c; font-size: 1.1rem;">3. Min-Height: 0</h3>
          <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.6;">
            Required for Firefox compatibility. Allows flex items to shrink below their content size.
          </p>
          <p style="margin: 0.75rem 0 0 0; color: #d32f2f; font-size: 0.8rem; font-style: italic;">
            Without it: Flex children won't shrink properly.
          </p>
        </div>

        <!-- Principle 4 -->
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #388e3c; font-size: 1.1rem;">4. Fixed Headers/Footers</h3>
          <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.6;">
            Elements that shouldn't grow need:
          </p>
          <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 0.8rem; margin: 12px 0 0 0; overflow: auto;">
<code>flex-shrink: 0;</code>
          </pre>
        </div>
      </div>

      <div style="margin-top: 2rem; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; background: #fafafa;">
        <h3 style="margin: 0 0 1rem 0;">The Complete Pattern</h3>
        <pre style="background: #fff; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; line-height: 1.5; overflow: auto; border: 1px solid #ddd;">
<code style="color: #1976d2;">/* Container */</code>
<code>.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}</code>

<code style="color: #1976d2; margin-top: 1rem;">/* Growable content area */</code>
<code>.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
}</code>

<code style="color: #1976d2; margin-top: 1rem;">/* Input that fills space */</code>
<code>textarea {
  flex: 1;
  min-height: 0;
  resize: none;
}</code>

<code style="color: #1976d2; margin-top: 1rem;">/* Fixed header/footer */</code>
<code>.header {
  flex-shrink: 0;
}</code>
        </pre>
      </div>
    </div>
  `,e};i.storyName="Key Principles Guide";r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100vw';
  wrapper.style.height = '100vh';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.innerHTML = \`
    <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
      <!-- Header -->
      <div style="padding: 1rem; border-bottom: 1px solid #eee; flex-shrink: 0;">
        <h2 style="margin: 0; font-size: 1.5rem;">Fullscreen Editor</h2>
        <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.875rem;">Click the expand button to see this pattern in action</p>
      </div>

      <!-- Main Content Area (fills remaining space) -->
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 1rem; overflow: auto;">
        
        <!-- Card fills the flex space -->
        <labs-card style="flex: 1; display: flex; flex-direction: column; height: 100%; min-height: 0;">
          <span slot="header">Document Title</span>
          
          <div slot="description">This textarea fills all available vertical space. Try typing to see it stay visible.</div>
          
          <!-- Input slot with flex -->
          <div slot="input" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
            <textarea id="editor" placeholder="Start typing... The textarea will fill all available space." style="width: 100%; flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; resize: none; min-height: 0;"></textarea>
          </div>
          
          <!-- Footer with word count -->
          <div slot="actions" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: #666; flex-shrink: 0;">
            <span id="wordCount">0 words</span>
            <div style="display: flex; gap: 8px;">
              <labs-button pill variant="secondary">Cancel</labs-button>
              <labs-button pill variant="primary">Save</labs-button>
            </div>
          </div>
        </labs-card>

      </div>
    </div>
  \`;
  const textarea = wrapper.querySelector('#editor');
  const wordCount = wrapper.querySelector('#wordCount');
  textarea.addEventListener('input', () => {
    const words = textarea.value.trim().split(/\\s+/).filter(w => w).length;
    wordCount.textContent = \`\${words} words\`;
  });

  // Focus textarea on load
  setTimeout(() => textarea.focus(), 100);
  return wrapper;
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '2rem';
  wrapper.innerHTML = \`
    <div style="max-width: 800px; margin: 0 auto;">
      <h3 style="margin: 0 0 1rem 0;">❌ Without Flex Cascading (Problem)</h3>
      <p style="color: #d32f2f; margin: 0 0 1rem 0; font-size: 0.875rem; background: #ffebee; padding: 8px 12px; border-radius: 4px;">
        Notice: Content overflows or textarea doesn't grow. Scrollbars appear unexpectedly.
      </p>

      <div style="height: 400px; border: 2px solid #d32f2f; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
        <!-- Missing flex: 1 at container level -->
        <div style="padding: 1rem; border-bottom: 1px solid #eee;">
          <h4 style="margin: 0;">Form Title</h4>
        </div>

        <!-- Card NOT using flex -->
        <labs-card>
          <span slot="header">Document</span>
          
          <!-- Input slot WITHOUT flex -->
          <div slot="input">
            <textarea placeholder="This textarea won't grow properly..." style="width: 100%; height: 200px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace;"></textarea>
          </div>
        </labs-card>
      </div>

      <p style="color: #666; margin: 1rem 0 0 0; font-size: 0.875rem;">
        <strong>Issues:</strong> Fixed height (200px) doesn't adapt to container. Content overflows. Scrollbars appear inside textarea.
      </p>
    </div>
  \`;
  return wrapper;
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '2rem';
  wrapper.innerHTML = \`
    <div style="max-width: 800px; margin: 0 auto;">
      <h3 style="margin: 0 0 1rem 0;">✅ With Flex Cascading (Correct)</h3>
      <p style="color: #388e3c; margin: 0 0 1rem 0; font-size: 0.875rem; background: #e8f5e9; padding: 8px 12px; border-radius: 4px;">
        Notice: Textarea expands to fill container. No unexpected scrollbars. Clean, responsive layout.
      </p>

      <div style="height: 400px; border: 2px solid #388e3c; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
        <!-- Flex at container level -->
        <div style="padding: 1rem; border-bottom: 1px solid #eee; flex-shrink: 0;">
          <h4 style="margin: 0;">Form Title</h4>
        </div>

        <!-- Card WITH flex cascading -->
        <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 1rem; overflow: auto;">
          <labs-card style="flex: 1; display: flex; flex-direction: column; height: 100%; min-height: 0;">
            <span slot="header">Document</span>
            
            <!-- Input slot WITH flex -->
            <div slot="input" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
              <textarea placeholder="This textarea fills all available space!" style="width: 100%; flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; resize: none; min-height: 0;"></textarea>
            </div>
          </labs-card>
        </div>
      </div>

      <p style="color: #666; margin: 1rem 0 0 0; font-size: 0.875rem;">
        <strong>Benefits:</strong> Textarea adapts to container size. No fixed heights. Scales responsively. Clean appearance.
      </p>
    </div>
  \`;
  return wrapper;
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`() => {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '2rem';
  wrapper.innerHTML = \`
    <div style="max-width: 900px; margin: 0 auto;">
      <h2 style="margin: 0 0 2rem 0;">Key Principles for Vertical Fill</h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Principle 1 -->
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #1976d2; font-size: 1.1rem;">1. Flex Containers</h3>
          <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.6;">
            Every parent that should grow must have:
          </p>
          <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 0.8rem; margin: 12px 0 0 0; overflow: auto;">
<code>display: flex;
flex-direction: column;</code>
          </pre>
        </div>

        <!-- Principle 2 -->
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #1976d2; font-size: 1.1rem;">2. Flex Growth</h3>
          <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.6;">
            Growable elements need:
          </p>
          <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 0.8rem; margin: 12px 0 0 0; overflow: auto;">
<code>flex: 1;
flex-grow: 1;
min-height: 0;</code>
          </pre>
        </div>

        <!-- Principle 3 -->
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #388e3c; font-size: 1.1rem;">3. Min-Height: 0</h3>
          <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.6;">
            Required for Firefox compatibility. Allows flex items to shrink below their content size.
          </p>
          <p style="margin: 0.75rem 0 0 0; color: #d32f2f; font-size: 0.8rem; font-style: italic;">
            Without it: Flex children won't shrink properly.
          </p>
        </div>

        <!-- Principle 4 -->
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; color: #388e3c; font-size: 1.1rem;">4. Fixed Headers/Footers</h3>
          <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.6;">
            Elements that shouldn't grow need:
          </p>
          <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 0.8rem; margin: 12px 0 0 0; overflow: auto;">
<code>flex-shrink: 0;</code>
          </pre>
        </div>
      </div>

      <div style="margin-top: 2rem; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; background: #fafafa;">
        <h3 style="margin: 0 0 1rem 0;">The Complete Pattern</h3>
        <pre style="background: #fff; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; line-height: 1.5; overflow: auto; border: 1px solid #ddd;">
<code style="color: #1976d2;">/* Container */</code>
<code>.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}</code>

<code style="color: #1976d2; margin-top: 1rem;">/* Growable content area */</code>
<code>.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
}</code>

<code style="color: #1976d2; margin-top: 1rem;">/* Input that fills space */</code>
<code>textarea {
  flex: 1;
  min-height: 0;
  resize: none;
}</code>

<code style="color: #1976d2; margin-top: 1rem;">/* Fixed header/footer */</code>
<code>.header {
  flex-shrink: 0;
}</code>
        </pre>
      </div>
    </div>
  \`;
  return wrapper;
}`,...i.parameters?.docs?.source}}};const f=["FullscreenEditor","ComparisonWrong","ComparisonRight","KeyPrinciples"];export{t as ComparisonRight,n as ComparisonWrong,r as FullscreenEditor,i as KeyPrinciples,f as __namedExportsOrder,x as default};
