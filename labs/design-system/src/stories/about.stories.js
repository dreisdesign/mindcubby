import { createThemeToggleButton } from '../components/ThemeToggle.js';

export default {
  title: '0. About',
  parameters: {
    viewMode: 'docs',
    docs: {
      description: {
        story: `
          Unified About page for Labs and Smoothie Design System.
        `,
      },
    },
  },
};

export const About = () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <h1>Labs Design System &amp; Smoothie Philosophy</h1>
    <p>
      <strong>Labs</strong> is a production-ready design system and suite of productivity apps built with vanilla JavaScript, Web Components, and CSS custom properties.<br>
      All 30+ components are fully modular, themeable, and use Shadow DOM for encapsulation. <strong>Status: v2.4.9 • Production-Ready &amp; Robust</strong><br>
      Supports three theme flavors (Vanilla, Blueberry, Strawberry) with light/dark modes and WCAG AA color contrast compliance.
    </p>
    <hr />
    <h2>Key Features</h2>
    <ul>
      <li><strong>Component Library:</strong> 30+ modular Web Components including Button, Card, Dropdown, List-Item, Header, Footer, Input, Overlay, Toast, Settings, and more.</li>
      <li><strong>Design System:</strong> Canonical two-layer token architecture, semantic color system, wrapped component patterns, and Storybook documentation (nested: Canonical, Wrapped, Patterns).</li>
      <li><strong>Apps:</strong> Six production apps — Focus Timer, Daily Tracker, Daily Note, Today List, Pad (drawing), Labs Homepage — all using the design system.</li>
      <li><strong>Technical Stack:</strong> Vanilla Web Components, Storybook v9+, Vite, Vitest, GitHub Pages | <strong>Design System v2.4.9</strong>.</li>
      <li><strong>Development Workflow:</strong> <code>npm run menu</code> for guided local dev or <code>npm run rp</code> for quick preview. HMR enabled, auto icon generation &amp; sync, pre-commit path fixes.</li>
      <li><strong>2025 Q3/Q4 Architecture:</strong> Dropdown Portal System (navigation-aware, no clipping), Mobile-First Container System (responsive tokens), Modular Component Refactors (Badge, Card, Input, Settings, Overlays), Storybook organization improvements.</li>
    </ul>
    <hr />
    <h2>Smoothie Design System Philosophy</h2>
    <p><strong>Think of Labs as a smoothie bar.</strong> Each component is a smoothie recipe, each prop is an ingredient, and each variant is a signature menu item. This metaphor helps us design modular, scalable UI that's easy to understand and combine.</p>
    <h3>Quick Example</h3>
    <pre style="background: var(--color-surface-variant); padding: 1rem; border-radius: 0.5rem; overflow-x: auto;"><code>&lt;labs-button variant="primary" fullwidth&gt;Save&lt;/labs-button&gt;
&lt;labs-card variant="metric"&gt;42 items tracked&lt;/labs-card&gt;
&lt;labs-dropdown archived slot="actions"&gt;&lt;/labs-dropdown&gt;</code></pre>
    <h3>The Smoothie Config Table</h3>
    <table border="1" cellpadding="4">
      <thead>
        <tr>
          <th>Option Type</th>
          <th>Control</th>
          <th>Vanilla</th>
          <th>Blueberry</th>
          <th>Strawberry</th>
          <th>Custom</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Single Select</td><td>Size</td><td>Large</td><td>Medium</td><td>Medium</td><td>Choose</td></tr>
        <tr><td>Single Select</td><td>Flavor</td><td>Vanilla</td><td>Blueberry</td><td>Strawberry</td><td>Choose</td></tr>
        <tr><td>Toggle</td><td>Theme</td><td>Light</td><td>Light</td><td>Light</td><td>Light/Dark</td></tr>
        <tr><td>Single Select</td><td>Primary Color</td><td>#6B5C4B</td><td>#2E2B74</td><td>#800800</td><td>Choose</td></tr>
        <tr><td>Single Select</td><td>Background</td><td>#F5F1E7</td><td>#DBD7FF</td><td>#FFD3D2</td><td>Choose</td></tr>
      </tbody>
    </table>
    <p style="font-size:0.95em;">Each column is a flavor preset. Each row is an ingredient (option/prop). "Custom" lets you mix any combination, including theme.</p>
    <ul>
      <li><strong>Smoothie = Component Recipe:</strong> Presets like "Tropical", "Berry", or "Power" map to pre-configured component variants.</li>
      <li><strong>Ingredients = Options/Props:</strong> Each option (size, fruit, veg, etc.) is a prop or control you can mix and match.</li>
      <li><strong>Custom = Full Control:</strong> Mix and match any options to create your own "Custom Smoothie" (component config).</li>
    </ul>
    <strong>Why Smoothie?</strong>
    <ul>
      <li>Modular: Every option is an ingredient, every combo is valid</li>
      <li>Scalable: Easy to add new presets or ingredients</li>
      <li>Universal: Works for any component, not just buttons</li>
    </ul>
    <hr />
    <strong>Mapping to UI Components</strong>
    <ul>
      <li>Each preset = a ready-to-use component variant (e.g., <code>&lt;labs-button variant="tropical" /&gt;</code>)</li>
      <li>Each ingredient = a prop, attribute, or Storybook control</li>
      <li>Custom = full control panel for designers/devs to mix their own</li>
    </ul>
    <hr />
    <h2>Quick Links</h2>
    <ul>
      <li><a href="https://dreisdesign.github.io/labs/" target="_blank">Labs Homepage</a></li>
      <li><a href="https://dreisdesign.github.io/labs/design-system/" target="_blank">Design System Storybook</a></li>
      <li><a href="https://dreisdesign.github.io/labs/timer/" target="_blank">Timer App</a></li>
      <li><a href="https://dreisdesign.github.io/labs/tracker/" target="_blank">Tracker App</a></li>
      <li><a href="https://dreisdesign.github.io/labs/note/" target="_blank">Note App</a></li>
      <li><a href="https://dreisdesign.github.io/labs/pad/" target="_blank">Pad App</a></li>
      <li><a href="https://dreisdesign.github.io/labs/today-list/" target="_blank">Today List</a></li>
    </ul>
    <hr />
    <h2>Documentation &amp; Contribution</h2>
    <ul>
      <li><a href="../README.md" target="_blank">Main README</a> — Project overview and quick start</li>
      <li><a href="../DOCUMENTATION.md" target="_blank">Documentation Index</a> — Complete navigation guide</li>
      <li><a href="../STORYBOOK_SITEMAP.md" target="_blank">Storybook Sitemap</a> — Auto-generated component story index</li>
      <li><a href="../design-system/README.md" target="_blank">Design System README</a> — Component library overview &amp; status</li>
      <li><a href="../design-system/smoothie.md" target="_blank">Smoothie Philosophy</a> — Design system metaphor &amp; concepts</li>
      <li><a href="../design-system/COMPONENT-USAGE.md" target="_blank">Component Usage Guide</a> — Patterns &amp; best practices</li>
      <li><a href="../design-system/ROADMAP.md" target="_blank">Design System Roadmap</a> — Planned features &amp; enhancements</li>
      <li><a href="../CONTRIBUTING.md" target="_blank">Contributing Guide</a> — How to contribute &amp; commit standards</li>
      <li><a href="../CHANGELOG.md" target="_blank">Changelog</a> — Repository version history</li>
      <li><a href="../design-system/CHANGELOG.md" target="_blank">Design System Changelog</a> — Design system version history</li>
      <li><a href="../todo-index.md" target="_blank">Global TODO Index</a> — Project-wide task tracking</li>
    </ul>
    <hr />
    <i>Designed by Dan Reis in Somerville — Last updated October 2025</i>
  `;
  setTimeout(() => {
    createThemeToggleButton({ parent: container });
  }, 0);
  return container;
};
