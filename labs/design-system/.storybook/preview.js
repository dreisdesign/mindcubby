import "../src/styles/main.css";
// Load shared layout tokens (breakpoints / grid caps) so stories share consistent polaroid sizing
import "../src/styles/tokens/grid.css";
import "../src/components/labs-button/labs-button.js";
import "../src/components/labs-icon.js";
import { applyTheme } from '../src/utils/theme.js';

// Suppress Lit dev mode and multiple version warnings in Storybook preview
window.litDisableDevModeWarning = true;

const origWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Lit is in dev mode') ||
      args[0].includes('Multiple versions of Lit loaded'))
  ) {
    return;
  }
  origWarn.apply(console, args);
};

// Helper: sync flavor/theme classes on the document root
function syncFlavorTheme(globals) {
  try {
    const root = document.documentElement;
    root.className = root.className
      .split(/\s+/)
      .filter(c => !/^flavor-/.test(c) && !/^theme-/.test(c))
      .join(' ');
    // Parse URL globals if present
    const params = new URLSearchParams(window.location.search || '');
    const raw = params.get('globals');
    let urlGlobals = {};
    if (raw) {
      const decoded = decodeURIComponent(raw);
      const parts = decoded.split(/[,;|&]/).map(s => s.trim()).filter(Boolean);
      parts.forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) urlGlobals[k.trim()] = v.trim();
      });
    }
    const flavor = urlGlobals.flavor || (globals && globals.flavor) || 'vanilla';
    const theme = urlGlobals.theme || (globals && globals.theme) || 'light';
    root.classList.add(`flavor-${flavor}`);
    root.classList.add(`theme-${theme}`);
    try { root.setAttribute('data-color-scheme', theme); } catch (e) { }
    try { document.body.style.background = 'var(--color-background)'; } catch (e) { }
  } catch (e) { /* ignore */ }
}

// Fallback: apply theme/flavor from URL globals on load
function initFromUrlGlobals() {
  if (typeof window === 'undefined' || !window.location) return;
  const params = new URLSearchParams(window.location.search || '');
  const raw = params.get('globals');
  if (!raw) return;
  try {
    const decoded = decodeURIComponent(raw || '');
    const parts = decoded.split(/[,;|&]/).map(s => s.trim()).filter(Boolean);
    const opts = {};
    parts.forEach(p => {
      const [k, v] = p.split(':');
      if (k && v) opts[k.trim()] = v.trim();
    });
    const payload = {};
    if (opts.flavor) payload.flavor = opts.flavor;
    if (opts.theme) payload.theme = opts.theme;
    if (payload.flavor || payload.theme) {
      try { applyTheme(payload); } catch (e) { }
      try { document.body.style.background = 'var(--color-background)'; } catch (e) { }
    }
  } catch (e) { /* ignore */ }
}

if (typeof window !== 'undefined') {
  initFromUrlGlobals();
  if (window.__STORYBOOK_ADDONS_CHANNEL__) {
    window.__STORYBOOK_ADDONS_CHANNEL__.on('globalsUpdated', ({ globals }) => {
      syncFlavorTheme(globals);
    });
    window.__STORYBOOK_ADDONS_CHANNEL__.on('storyRendered', () => {
      let globals = undefined;
      try {
        // Modern approach: get globals from channel events
        if (window.__STORYBOOK_ADDONS_CHANNEL__) {
          const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
          if (channel._globalsStore) {
            globals = channel._globalsStore.getAll();
          }
        }
      } catch (e) { /* ignore */ }
      syncFlavorTheme(globals);
    });
  }
}

const preview = {
  globalTypes: {
    flavor: {
      name: 'Flavor',
      description: 'Smoothie flavor (theme token set)',
      defaultValue: 'vanilla',
      toolbar: {
        icon: 'arrowdown',
        items: [
          { value: 'vanilla', title: 'vanilla' },
          { value: 'blueberry', title: 'blueberry' },
          { value: 'strawberry', title: 'strawberry' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
    theme: {
      name: 'Theme',
      description: 'UI theme (light/dark)',
      defaultValue: 'light',
      toolbar: {
        icon: 'sun',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    // Enable docs for all stories
    docs: {
      autodocs: 'tag',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      // Disable persisted controls (no save popup)
      persistLocal: false,
    },

    // Configure Storybook UI theme and layout
    layout: 'centered',

    // Configure backgrounds using Storybook v9+ API (options + initialGlobals)
    backgrounds: {
      disable: true,
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },

    // Configure Storybook interface options
    options: {
      // Controls panel on the right
      panelPosition: 'right',
      // Alphabetical grouping: sort by title (group/subgroup) then story name.
      // About story will appear first alphabetically so it loads by default
      storySort: (a, b) => {
        const aTitle = a.title || '';
        const bTitle = b.title || '';
        const titleCmp = aTitle.localeCompare(bTitle, undefined, { numeric: true, sensitivity: 'base' });
        if (titleCmp !== 0) return titleCmp;
        const aName = a.name || '';
        const bName = b.name || '';
        return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
      },
    },
  },

  decorators: [
    (Story, context) => {
      // Robust flavor/theme sync: always remove all flavor-* and theme-* classes, then apply the correct ones from URL globals or Storybook globals
      syncFlavorTheme(context.globals);
      return Story();
    },
    // Docs decorator: wrap autodocs examples in a small surface container so autodocs that
    // render plain markup get a themed surface (respecting var(--color-surface) and theme class)
    (Story, context) => {
      try {
        // Only apply for docs view / autodocs - guard by viewMode or docs parameters
        const isDocs = context.viewMode === 'docs' || (context.parameters && context.parameters.docs);
        if (!isDocs) return Story();

        const node = Story();


        // If the story already returns a DOM node, return it directly (it's already themed/structured)
        if (typeof Node !== 'undefined' && node instanceof Node) {
          return node;
        }

        // Detect lit TemplateResult more robustly by constructor name or by shape (strings/values/_$litType$).
        // Return it unchanged so Storybook can render it — don't coerce to string (which causes [object Object]).
        if (
          node && (
            (node.constructor && node.constructor.name === 'TemplateResult') ||
            (typeof node === 'object' && (Object.prototype.hasOwnProperty.call(node, 'strings') || Object.prototype.hasOwnProperty.call(node, 'values') || Object.prototype.hasOwnProperty.call(node, '_$litType$')))
          )
        ) {
          return node;
        }

        // If the story returns an array of renderable pieces (TemplateResults or Nodes or strings), return it directly.
        if (Array.isArray(node) && node.length > 0 && node.every(n => (
          typeof n === 'string' || (typeof Node !== 'undefined' && n instanceof Node) || (n && n.constructor && n.constructor.name === 'TemplateResult')
        ))) {
          return node;
        }

        // For string or other non-node outputs, wrap in a themed surface container.
        const container = document.createElement('div');
        container.className = 'labs-autodocs-surface';
        container.style.display = 'inline-block';
        container.style.padding = '1rem';
        container.style.borderRadius = '8px';
        // container.style.background = 'var(--color-surface)';
        container.style.color = 'var(--color-on-surface)';
        container.style.boxSizing = 'border-box';

        if (typeof node === 'string') {
          container.innerHTML = node;
        } else if (typeof node === 'object') {
          // For objects that reach here, attempt a sensible stringification for visibility in docs
          try {
            container.textContent = JSON.stringify(node, null, 2);
          } catch (e) {
            container.textContent = String(node);
          }
        } else {
          container.textContent = String(node);
        }

        return container;
      } catch (e) {
        return Story();
      }
    },
  ],
};

export default preview;
