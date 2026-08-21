const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./iframe-Z0sEKzcQ.js","./preload-helper-PPVm8Dsz.js","./iframe-C449oE3-.css"])))=>i.map(i=>d[i]);
import{_ as d}from"./preload-helper-PPVm8Dsz.js";import"./iframe-Z0sEKzcQ.js";import{c as u}from"./ThemeToggle-BmKYicL1.js";const b={title:"1. Foundations/Theme System",parameters:{viewMode:"docs",docs:{description:{component:`
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
        `}}}},r={name:"Interactive Demo",render:()=>{const e=document.createElement("div");return e.innerHTML=`
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

  <div style="background: var(--color-surface); padding: 1.5rem; border-radius: var(--radius-lg, 8px); margin: 1rem 0; border: 1px solid var(--color-primary); transition: all 0.2s;">
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
    `,setTimeout(()=>{u({parent:e});const t=e.querySelector("#iconThemeToggle"),a=e.querySelector("#iconThemeIcon");function l(){const n=document.documentElement.classList.contains("theme-dark");a&&a.setAttribute("name",n?"bedtime_off":"bedtime"),t&&t.setAttribute("aria-label",n?"Switch to light mode":"Switch to dark mode")}t&&(t.addEventListener("click",()=>{const n=document.documentElement.classList.contains("theme-dark"),s=document.documentElement,c=Array.from(s.classList).find(o=>o.startsWith("flavor-")),i=c?c.replace("flavor-",""):"vanilla";d(async()=>{const{applyTheme:o}=await import("./iframe-Z0sEKzcQ.js").then(m=>m.t);return{applyTheme:o}},__vite__mapDeps([0,1,2]),import.meta.url).then(({applyTheme:o})=>{o({flavor:i,theme:n?"light":"dark"}),l()})}),l())},100),e},parameters:{docs:{source:{code:`
// Create themed component with semantic tokens
const themedComponent = document.createElement('div');
themedComponent.style.background = 'var(--color-surface)';
themedComponent.style.color = 'var(--color-on-surface)';
themedComponent.style.border = '1px solid var(--color-primary)';

// Add theme toggle
import { createThemeToggleButton } from '../components/ThemeToggle.js';
createThemeToggleButton({ parent: document.body });
        `}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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

  <div style="background: var(--color-surface); padding: 1.5rem; border-radius: var(--radius-lg, 8px); margin: 1rem 0; border: 1px solid var(--color-primary); transition: all 0.2s;">
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
}`,...r.parameters?.docs?.source}}};const y=["ThemeDemo"];export{r as ThemeDemo,y as __namedExportsOrder,b as default};
