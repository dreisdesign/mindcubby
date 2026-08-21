const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./iframe-Dvm2aYCR.js","./preload-helper-PPVm8Dsz.js","./iframe-CmhTq6zs.css"])))=>i.map(i=>d[i]);
import{_ as u}from"./preload-helper-PPVm8Dsz.js";import{a as h}from"./iframe-Dvm2aYCR.js";function g({parent:a=document.body}={}){const r=a.querySelector(".labs-theme-toggle");r&&r.remove();const e=document.createElement("labs-button");e.className="labs-theme-toggle",e.setAttribute("variant","secondary"),e.setAttribute("size","large"),e.style.margin="1rem",e.style.position="fixed",e.style.top="1rem",e.style.right="1rem",e.style.zIndex=1e3;function l(){const o=document.documentElement.classList.contains("theme-dark");Array.from(e.childNodes).forEach(c=>e.removeChild(c));const n=document.createElement("labs-icon");n.setAttribute("slot","icon-left"),n.setAttribute("name",o?"bedtime_off":"bedtime"),e.appendChild(n),e.getAttribute("data-collapse")==="small"?e.setAttribute("aria-label",o?"Turn on light mode":"Turn on dark mode"):e.appendChild(document.createTextNode(o?"Turn on light mode":"Turn on dark mode"))}e.onclick=()=>{const o=document.documentElement.classList.contains("theme-dark"),n=document.documentElement,t=Array.from(n.classList).find(d=>d.startsWith("flavor-")),c=t?t.replace("flavor-",""):"vanilla";h({flavor:c,theme:o?"light":"dark"}),l()};const s=new MutationObserver(()=>l());try{s.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]})}catch{}function i(){try{window.matchMedia("(max-width: 700px)").matches?e.setAttribute("data-collapse","small"):e.removeAttribute("data-collapse")}catch{}}return(function(){const n=window.matchMedia("(max-width: 700px)");function t(){n.matches?(e.setAttribute("variant","icon"),e.setAttribute("size","medium")):(e.setAttribute("variant","secondary"),e.setAttribute("size","large")),l()}try{n.addEventListener?n.addEventListener("change",t):n.addListener(t)}catch{}t()})(),i(),window.addEventListener("resize",i),l(),a.appendChild(e),e}const y={title:"1. Foundations/Theme System",parameters:{viewMode:"docs",docs:{description:{component:`
# Light/Dark Theme System

The Labs Design System provides a unified light/dark theme system that works consistently across both production apps and Storybook documentation.

## How It Works

### Theme Classes
- **\`.theme-light\`** - Applied to root element for light theme
- **\`.theme-dark\`** - Applied to root element for dark theme
- **Automatic switching** - Theme toggle button handles class management

### Semantic Tokens
All components use semantic color tokens that automatically adapt to the active theme:
- \`--color-background\` - Main background color
- \`--color-surface\` - Card/elevated surface color
- \`--color-on-background\` - Text on background
- \`--color-on-surface\` - Text on surfaces
- \`--color-primary\` - Brand/accent color
- \`--color-on-primary\` - Text on primary color

### Implementation Example

\`\`\`javascript
// Apply theme programmatically
import { applyTheme } from '../utils/theme.js';

// Switch to dark mode
applyTheme({ theme: 'dark' });

// Switch to light mode
applyTheme({ theme: 'light' });
\`\`\`

### Theme Toggle Button
Use the reusable theme toggle component in your apps:

\`\`\`javascript
import { createThemeToggleButton } from '../components/ThemeToggle.js';

// Add theme toggle to your app
createThemeToggleButton({ parent: document.body });
\`\`\`

## Features

✅ **Unified System** - Same token structure in apps and Storybook
✅ **Automatic Persistence** - User preference saved in localStorage
✅ **System Preference** - Respects \`prefers-color-scheme\` by default
✅ **Semantic Tokens** - All components use theme-aware color tokens
✅ **Component Integration** - Theme toggle uses design system button
✅ **Accessibility** - WCAG AA contrast ratios maintained in both themes

## Testing Themes

Use the theme toggle button below or the Storybook toolbar to test the theme system. All components should smoothly transition between light and dark modes.
        `}}}},m={name:"Interactive Demo",render:()=>{const a=document.createElement("div");return a.innerHTML=`
      <div style="padding: 2rem; background: var(--color-background); color: var(--color-on-background); transition: all 0.2s;">
        <h2 style="color: var(--color-on-background);">Theme System Demo</h2>
        <p style="color: var(--color-on-background);">This demo shows how components adapt to theme changes. Try both theme toggle buttons!</p>

        <div style="display: flex; gap: 1rem; margin: 2rem 0; flex-wrap: wrap; align-items: center;">
          <labs-button pill variant="primary">Primary Button</labs-button>
          <labs-button pill variant="secondary">
            <labs-icon slot="icon-left" name="settings"></labs-icon>
            Secondary with Icon
          </labs-button>
          <labs-button pill variant="destructive">Destructive Button</labs-button>

          <!-- Icon-only theme toggle (like in Pad app) -->
          <labs-button id="iconThemeToggle" variant="icon" aria-label="Toggle theme (icon only)">
            <labs-icon id="iconThemeIcon" slot="icon-left" name="bedtime"></labs-icon>
          </labs-button>
        </div>

        <div style="background: var(--color-surface); padding: 1.5rem; border-radius: 8px; margin: 1rem 0; border: 1px solid var(--color-primary); transition: all 0.2s;">
          <h3 style="color: var(--color-on-surface); margin-top: 0;">Surface Component</h3>
          <p style="color: var(--color-on-surface);">This surface uses semantic tokens and adapts automatically to theme changes.</p>
          <labs-button pill variant="primary">Surface Button</labs-button>
        </div>

        <div style="margin-top: 2rem;">
          <h3 style="color: var(--color-on-background);">Theme Toggle Patterns</h3>
          <ul style="color: var(--color-on-background);">
            <li><strong>Full Toggle:</strong> Button with icon and text (top-right floating button)</li>
            <li><strong>Icon-Only:</strong> Compact button with just bedtime/bedtime_off icon (like in Pad app)</li>
            <li><strong>Both:</strong> Use semantic tokens and respond to theme changes automatically</li>
          </ul>

          <h3 style="color: var(--color-on-background);">Color Tokens in Action</h3>
          <ul style="color: var(--color-on-background);">
            <li><code>background: var(--color-background)</code></li>
            <li><code>color: var(--color-on-background)</code></li>
            <li><code>surface: var(--color-surface)</code></li>
            <li><code>surface text: var(--color-on-surface)</code></li>
          </ul>
        </div>
      </div>
    `,setTimeout(()=>{g({parent:a});const r=a.querySelector("#iconThemeToggle"),e=a.querySelector("#iconThemeIcon");function l(){const s=document.documentElement.classList.contains("theme-dark");e&&e.setAttribute("name",s?"bedtime_off":"bedtime"),r&&r.setAttribute("aria-label",s?"Switch to light mode":"Switch to dark mode")}r&&(r.addEventListener("click",()=>{const s=document.documentElement.classList.contains("theme-dark"),i=document.documentElement,o=Array.from(i.classList).find(t=>t.startsWith("flavor-")),n=o?o.replace("flavor-",""):"vanilla";u(async()=>{const{applyTheme:t}=await import("./iframe-Dvm2aYCR.js").then(c=>c.t);return{applyTheme:t}},__vite__mapDeps([0,1,2]),import.meta.url).then(({applyTheme:t})=>{t({flavor:n,theme:s?"light":"dark"}),l()})}),l())},100),a},parameters:{docs:{source:{code:`
// Create themed component with semantic tokens
const themedComponent = document.createElement('div');
themedComponent.style.background = 'var(--color-surface)';
themedComponent.style.color = 'var(--color-on-surface)';
themedComponent.style.border = '1px solid var(--color-primary)';

// Add theme toggle
import { createThemeToggleButton } from '../components/ThemeToggle.js';
createThemeToggleButton({ parent: document.body });
        `}}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: 'Interactive Demo',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = \`
      <div style="padding: 2rem; background: var(--color-background); color: var(--color-on-background); transition: all 0.2s;">
        <h2 style="color: var(--color-on-background);">Theme System Demo</h2>
        <p style="color: var(--color-on-background);">This demo shows how components adapt to theme changes. Try both theme toggle buttons!</p>

        <div style="display: flex; gap: 1rem; margin: 2rem 0; flex-wrap: wrap; align-items: center;">
          <labs-button pill variant="primary">Primary Button</labs-button>
          <labs-button pill variant="secondary">
            <labs-icon slot="icon-left" name="settings"></labs-icon>
            Secondary with Icon
          </labs-button>
          <labs-button pill variant="destructive">Destructive Button</labs-button>

          <!-- Icon-only theme toggle (like in Pad app) -->
          <labs-button id="iconThemeToggle" variant="icon" aria-label="Toggle theme (icon only)">
            <labs-icon id="iconThemeIcon" slot="icon-left" name="bedtime"></labs-icon>
          </labs-button>
        </div>

        <div style="background: var(--color-surface); padding: 1.5rem; border-radius: 8px; margin: 1rem 0; border: 1px solid var(--color-primary); transition: all 0.2s;">
          <h3 style="color: var(--color-on-surface); margin-top: 0;">Surface Component</h3>
          <p style="color: var(--color-on-surface);">This surface uses semantic tokens and adapts automatically to theme changes.</p>
          <labs-button pill variant="primary">Surface Button</labs-button>
        </div>

        <div style="margin-top: 2rem;">
          <h3 style="color: var(--color-on-background);">Theme Toggle Patterns</h3>
          <ul style="color: var(--color-on-background);">
            <li><strong>Full Toggle:</strong> Button with icon and text (top-right floating button)</li>
            <li><strong>Icon-Only:</strong> Compact button with just bedtime/bedtime_off icon (like in Pad app)</li>
            <li><strong>Both:</strong> Use semantic tokens and respond to theme changes automatically</li>
          </ul>

          <h3 style="color: var(--color-on-background);">Color Tokens in Action</h3>
          <ul style="color: var(--color-on-background);">
            <li><code>background: var(--color-background)</code></li>
            <li><code>color: var(--color-on-background)</code></li>
            <li><code>surface: var(--color-surface)</code></li>
            <li><code>surface text: var(--color-on-surface)</code></li>
          </ul>
        </div>
      </div>
    \`;

    // Add theme toggle after a brief delay
    setTimeout(() => {
      createThemeToggleButton({
        parent: container
      });

      // Setup icon-only theme toggle (like in Pad app)
      const iconToggle = container.querySelector('#iconThemeToggle');
      const iconThemeIcon = container.querySelector('#iconThemeIcon');
      function updateIconToggle() {
        const isDark = document.documentElement.classList.contains('theme-dark');
        if (iconThemeIcon) {
          iconThemeIcon.setAttribute('name', isDark ? 'bedtime_off' : 'bedtime');
        }
        if (iconToggle) {
          iconToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }
      }
      if (iconToggle) {
        iconToggle.addEventListener('click', () => {
          const isDark = document.documentElement.classList.contains('theme-dark');
          const root = document.documentElement;
          const flavorClass = Array.from(root.classList).find(c => c.startsWith('flavor-'));
          const flavor = flavorClass ? flavorClass.replace('flavor-', '') : 'vanilla';

          // Use the same applyTheme utility as the main toggle
          import('../utils/theme.js').then(({
            applyTheme
          }) => {
            applyTheme({
              flavor,
              theme: isDark ? 'light' : 'dark'
            });
            updateIconToggle();
          });
        });
        updateIconToggle();
      }
    }, 100);
    return container;
  },
  parameters: {
    docs: {
      source: {
        code: \`
// Create themed component with semantic tokens
const themedComponent = document.createElement('div');
themedComponent.style.background = 'var(--color-surface)';
themedComponent.style.color = 'var(--color-on-surface)';
themedComponent.style.border = '1px solid var(--color-primary)';

// Add theme toggle
import { createThemeToggleButton } from '../components/ThemeToggle.js';
createThemeToggleButton({ parent: document.body });
        \`
      }
    }
  }
}`,...m.parameters?.docs?.source}}};const v=["ThemeDemo"];export{m as ThemeDemo,v as __namedExportsOrder,y as default};
