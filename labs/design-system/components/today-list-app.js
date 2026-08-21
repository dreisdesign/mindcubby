// Dynamic import these browser-only dependencies so Node requiring this file
// doesn't attempt to load web-component modules (which rely on HTMLElement).
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  import('./labs-input.js');
  import('./labs-card.js');
  import('./labs-toast.js');
  import('./labs-button.js');
  import('./labs-icon.js');
  // Load ThemeToggle at runtime to avoid forcing the bundler to resolve
  // an absolute path that may not exist in build time.
  (async () => {
    try {
      // @vite-ignore: dynamic runtime import, intentionally left as a URL(href)
      await import(/* @vite-ignore */ new URL('./ThemeToggle.js', import.meta.url).href);
    } catch (err) {
      // Non-fatal: theme toggle is optional in some hosts
      console.warn('Could not load ThemeToggle at runtime:', err);
    }
  })();
}
// Fallback for environments that can't import raw CSS (Node). If your bundler
// supports importing CSS as raw text (e.g. Vite with ?raw) you can replace
// this variable with the raw import during build. For Node-based sanity checks
// we keep it as an empty string to avoid duplication errors.
const tlEntryCss = '';

// Today List app - comprehensive implementation
let TodayListApp = null;
if (typeof HTMLElement !== 'undefined') {
  TodayListApp = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      // initialize _items as an array; _load() will populate from storage
      this._items = [];
      this._load();
      this._lastAdd = { value: '', ts: 0 };
      this._isBuilt = false;
      // timers for editable windows / undo windows keyed by item id
      this._timers = {};
      // bind handlers so event listeners have correct `this`
      this._onSubmit = this._onSubmit.bind(this);
      // create toast early so host code calling addItem() can rely on it
      this._ensureToast();
      // Listen for global theme changes
      this._onThemeChanged = () => {
        this._updateThemeIcon();
        this._render();
      };
      document.addEventListener('themeChanged', this._onThemeChanged);
      this._build().then(() => {
        this._isBuilt = true;
        this._setupEventListeners();
        // Initialize theme system
        this.initSystemTheme();
        // ensure toast exists and theme icon is set after build
        this._ensureToast();
        this._updateThemeIcon();
        this._render();
      });
    }

    async _build() {
      // Load and inject CSS with fallback
      const style = document.createElement('style');

      try {
        // Try to load the CSS file
        const cssResponse = await fetch(new URL('../styles/tl-entry.css', import.meta.url));
        if (cssResponse.ok) {
          style.textContent = await cssResponse.text();
        } else {
          throw new Error('CSS not found');
        }
      } catch (e) {
        console.warn('Could not load tl-entry.css, using fallback styles:', e);
        // Comprehensive fallback styles (now using tokens for entry text and meta)
        style.textContent = `
          .today-list-app {
            padding: 16px;
            font-family: var(--font-family-base, system-ui, -apple-system, sans-serif);
            max-width: 600px;
            margin: 0 auto;
          }
          .tl-entry {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
            gap: 12px;
          }
          .tl-entry-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .tl-entry-title {
            font-weight: 600;
            line-height: 1.4;
          }
          .tl-entry-text {
            font-size: var(--font-size-entry-text, 1rem);
            font-family: var(--font-family-base, system-ui, -apple-system, sans-serif);
          }
          .tl-entry-meta {
            font-size: var(--font-size-entry-meta, 0.75rem);
            color: #666;
          }
          .tl-entry-actions {
            display: flex;
            gap: 8px;
          }
          .app-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
            padding: 4px 0;
          }
          .app-title h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .version-badge {
            background: #007AFF;
            color: white;
            padding: 2px 6px;
            border-radius: var(--radius-md, 4px);
            font-size: 10px;
            margin-left: 8px;
          }
          .section-title {
            font-weight: 600;
            margin: 16px 0 8px;
            color: #333;
          }
          .date-label {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 18px;
            color: #333;
          }
          .controls {
            margin: 12px 0 18px 0;
          }
          .list {
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .empty {
            text-align: center;
            color: #999;
            font-style: italic;
            padding: 40px 16px;
          }
          .archived-section {
            opacity: 0.7;
          }
          labs-button[variant="icon"]:hover {
            background: rgba(0, 0, 0, 0.1);
          }
          labs-button[data-action="delete"]:hover {
            background: rgba(255, 59, 48, 0.1);
          }
        `;
      }

      this.shadowRoot.appendChild(style);

      // Create main container
      const container = document.createElement('div');
      container.className = 'today-list-app';

      // App header with version and theme toggle
      // Conditionally render header and internal input. Host pages can opt-out
      // by adding the `hide-header` attribute on <today-list-app> and provide
      // their own external editor and theme controls.
      let appHeader = null;
      let themeToggle = null;
      let flavorToggle = null;
      if (!this.hasAttribute('hide-header')) {
        appHeader = document.createElement('div');
        appHeader.className = 'app-header';

        const appTitle = document.createElement('div');
        appTitle.className = 'app-title';
        appTitle.innerHTML = `
          <h1>Today List</h1>
          <span class="version-badge">v2.1.5</span>
        `;

        themeToggle = document.createElement('labs-button');
        themeToggle.setAttribute('variant', 'icon');
        themeToggle.className = 'theme-toggle';
        const themeIconSlot = document.createElement('span');
        themeIconSlot.setAttribute('slot', 'icon-left');
        const themeIcon = document.createElement('labs-icon');
        themeIcon.setAttribute('name', 'bedtime');
        themeIconSlot.appendChild(themeIcon);
        themeToggle.appendChild(themeIconSlot);

        // flavor toggle (cycles flavors) - small icon-only button
        flavorToggle = document.createElement('labs-button');
        flavorToggle.setAttribute('variant', 'icon');
        flavorToggle.className = 'flavor-toggle';
        const flavorIconSlot = document.createElement('span');
        flavorIconSlot.setAttribute('slot', 'icon-left');
        const flavorIcon = document.createElement('labs-icon');
        flavorIcon.setAttribute('name', 'palette');
        flavorIconSlot.appendChild(flavorIcon);
        flavorToggle.appendChild(flavorIconSlot);

        // Add a small icon button to reset all items (like Pad app)
        const resetBtn = document.createElement('labs-button');
        resetBtn.setAttribute('variant', 'icon');
        resetBtn.setAttribute('aria-label', 'Reset all items');
        resetBtn.className = 'reset-all';
        const resetIconSlot = document.createElement('span');
        resetIconSlot.setAttribute('slot', 'icon-left');
        const resetIcon = document.createElement('labs-icon');
        resetIcon.setAttribute('name', 'delete_sweep');
        resetIconSlot.appendChild(resetIcon);
        resetBtn.appendChild(resetIconSlot);
        resetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._resetAll();
        });

        const headerRight = document.createElement('div');
        headerRight.style.display = 'flex';
        headerRight.style.gap = '8px';
        headerRight.appendChild(resetBtn);
        headerRight.appendChild(flavorToggle);
        headerRight.appendChild(themeToggle);

        appHeader.appendChild(appTitle);
        appHeader.appendChild(headerRight);
      }

      // Today section header with date
      const todayHeader = document.createElement('div');
      todayHeader.className = 'today-header';

      const dateLabel = document.createElement('div');
      dateLabel.className = 'date-label';
      dateLabel.textContent = this._formatDateLabel(new Date());

      todayHeader.appendChild(dateLabel);

      // Input controls (only when header is shown)
      let inputWrap = null;
      if (!this.hasAttribute('hide-header')) {
        inputWrap = document.createElement('div');
        inputWrap.className = 'controls';
        this._input = document.createElement('labs-input');
        this._input.setAttribute('id', 'today-list-input');
        this._input.setAttribute('name', 'today-list-input');
        this._input.setAttribute('placeholder', 'Add item...');
        inputWrap.appendChild(this._input);
      }

      // Today's items list
      const todaySection = document.createElement('div');
      todaySection.className = 'section';
      const todayList = document.createElement('div');
      todayList.className = 'list today-list';
      this._todayList = todayList;
      todaySection.appendChild(todayList);

      // Completed items section
      const completedSection = document.createElement('div');
      completedSection.className = 'section';
      const completedTitle = document.createElement('div');
      completedTitle.className = 'section-title';
      completedTitle.textContent = 'Completed';
      const completedList = document.createElement('div');
      completedList.className = 'list completed-list';
      this._completedList = completedList;
      completedSection.appendChild(completedTitle);
      completedSection.appendChild(completedList);

      // Archived items section
      const archivedSection = document.createElement('div');
      archivedSection.className = 'section archived-section';
      this._archivedSection = archivedSection;

      // Append all sections in correct order. If header/input were skipped
      // because the host opted out, don't append them.
      if (appHeader) container.appendChild(appHeader);
      container.appendChild(todayHeader);
      if (inputWrap) container.appendChild(inputWrap);
      container.appendChild(todaySection);
      container.appendChild(completedSection);
      container.appendChild(archivedSection);

      // floating remove-all button (bottom-right)
      const floatingWrap = document.createElement('div');
      floatingWrap.className = 'floating-remove';
      const floatingBtn = document.createElement('labs-button');
      floatingBtn.setAttribute('variant', 'icon');
      floatingBtn.setAttribute('aria-label', 'Remove all items');
      const floatIconSlot = document.createElement('span');
      floatIconSlot.setAttribute('slot', 'icon-left');
      const floatIcon = document.createElement('labs-icon');
      floatIcon.setAttribute('name', 'delete_sweep');
      floatIconSlot.appendChild(floatIcon);
      floatingBtn.appendChild(floatIconSlot);
      floatingBtn.addEventListener('click', (e) => { e.stopPropagation(); this._resetAll(); });
      floatingWrap.appendChild(floatingBtn);
      this.shadowRoot.appendChild(floatingWrap);

      this.shadowRoot.appendChild(container);
    }

    _setupEventListeners() {
      // Theme toggle click handler - using Pad app approach
      const themeToggle = this.shadowRoot.querySelector('.theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          this.toggleTheme();
        });
      }

      // Flavor toggle cycles through flavors - using Pad app approach
      const flavorBtn = this.shadowRoot.querySelector('.flavor-toggle');
      if (flavorBtn) {
        flavorBtn.addEventListener('click', () => {
          this.cycleFlavor();
        });
      }

      // Input submit handler (single binding)
      if (this._input) {
        this._input.removeEventListener('submit', this._onSubmit); // defensive
        this._input.addEventListener('submit', this._onSubmit);
      }
    }

    // Theme management utilities (copied from Pad app)
    applyTheme({ flavor = 'vanilla', theme = 'light' } = {}) {
      const root = document.documentElement;
      root.classList.remove('flavor-vanilla', 'flavor-blueberry', 'flavor-strawberry');
      root.classList.add(`flavor-${flavor}`);
      root.classList.remove('theme-light', 'theme-dark');
      root.classList.add(`theme-${theme}`);
      root.setAttribute('data-color-scheme', theme);
      localStorage.setItem('today-list-theme', theme);
      localStorage.setItem('today-list-flavor', flavor);

      // Update meta theme-color for PWA
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      const bgColor = getComputedStyle(root).getPropertyValue('--color-background').trim();
      if (themeColorMeta && bgColor) {
        themeColorMeta.setAttribute('content', bgColor);
      }
    }

    initSystemTheme(defaultTheme = 'light') {
      const savedTheme = localStorage.getItem('today-list-theme');
      const savedFlavor = localStorage.getItem('today-list-flavor');
      if (savedTheme || savedFlavor) {
        this.applyTheme({
          flavor: savedFlavor || 'vanilla',
          theme: savedTheme || defaultTheme
        });
      } else {
        // Always default to light mode
        this.applyTheme({ flavor: 'vanilla', theme: 'light' });
      }
    }

    toggleTheme() {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const root = document.documentElement;
      const flavorClass = Array.from(root.classList).find(c => c.startsWith('flavor-'));
      const flavor = flavorClass ? flavorClass.replace('flavor-', '') : 'vanilla';
      this.applyTheme({ flavor, theme: isDark ? 'light' : 'dark' });
      this._updateThemeIcon();
    }

    cycleFlavor() {
      const root = document.documentElement;
      const flavors = ['vanilla', 'blueberry', 'strawberry'];
      const current = Array.from(root.classList).find(c => c.startsWith('flavor-'));
      const curName = current ? current.replace('flavor-', '') : 'vanilla';
      const next = flavors[(flavors.indexOf(curName) + 1) % flavors.length];
      const isDark = root.classList.contains('theme-dark');
      this.applyTheme({ flavor: next, theme: isDark ? 'dark' : 'light' });
    }

    _startEditableTimer(item) {
      // clear existing
      if (!item || !item.id) return;
      const id = item.id;
      const now = Date.now();
      if (item.editableUntil && item.editableUntil > now) {
        const ms = item.editableUntil - now;
        if (this._timers[id]) clearTimeout(this._timers[id]);
        this._timers[id] = setTimeout(() => {
          this._lockItem(id);
        }, ms);
      } else if (item.editableUntil && item.editableUntil <= now) {
        this._lockItem(id);
      }
    }

    _lockItem(id) {
      const idx = this._items.findIndex(i => i.id === id);
      if (idx === -1) return;
      const item = this._items[idx];
      item.locked = true;
      delete item.editableUntil;
      this._save();
      this._render();
      if (this._timers[id]) { clearTimeout(this._timers[id]); delete this._timers[id]; }
    }

    _addItem(text) {
      const now = Date.now();
      // Relax duplicate-add guard to 250ms to allow quick successive adds.
      if (this._lastAdd.value === text && (now - this._lastAdd.ts) < 250) return;
      this._lastAdd.value = text;
      this._lastAdd.ts = now;

      const item = {
        id: Date.now() + Math.random().toString(36).slice(2, 7),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        restoredFrom: null,
        archived: false,
        locked: false,
        // allow 5 seconds to edit after creation
        editableUntil: Date.now() + 5000
      };

      this._items.unshift(item);
      // schedule locking after editable window
      this._startEditableTimer(item);
      this._save();
      this._render();

      // show toast offering Edit for 5 seconds
      this._showToast('Item added', { actionText: 'Edit', duration: 5000 }).then(() => {
        const onAction = () => {
          item._editing = true;
          this._render();
          cleanup();
        };
        const cleanup = () => {
          if (this._toast) this._toast.removeEventListener('action', onAction);
        };
        if (this._toast) this._toast.addEventListener('action', onAction, { once: true });
      });
    }

    connectedCallback() {
      if (!this._isBuilt) return; // Wait for _build to complete
      // listeners are bound in _setupEventListeners during build
      this._load();
      // ensure toast exists in case host removed it
      this._ensureToast();
      this._updateThemeIcon();
      this._render();
    }

    disconnectedCallback() {
      try {
        if (this._input) this._input.removeEventListener('submit', this._onSubmit);
      } catch (e) { }
      document.removeEventListener('themeChanged', this._onThemeChanged);
    }

    _updateThemeIcon() {
      const themeIcon = this.shadowRoot.querySelector('.theme-toggle labs-icon');
      const themeToggle = this.shadowRoot.querySelector('.theme-toggle');
      if (themeIcon && themeToggle) {
        const isDark = document.documentElement.classList.contains('theme-dark');
        themeIcon.setAttribute('name', isDark ? 'bedtime_off' : 'bedtime');
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      }
    }

    _formatDateLabel(date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (itemDate.getTime() === today.getTime()) {
        return 'Today';
      }

      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    _formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    _isToday(timestamp) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const itemDate = new Date(timestamp);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      return itemDateOnly.getTime() === today.getTime();
    }

    _groupItemsByDate() {
      const groups = {};
      this._items.forEach(item => {
        const date = new Date(item.createdAt);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!groups[dateKey]) {
          groups[dateKey] = {
            date: date,
            items: []
          };
        }
        groups[dateKey].items.push(item);
      });
      return groups;
    }

    async _ensureToast() {
      // ensure labs-toast is registered; import if necessary
      if (!customElements.get('labs-toast')) {
        try {
          // @vite-ignore: intentionally dynamic runtime import
          await import(/* @vite-ignore */ new URL('./labs-toast.js', import.meta.url).href);
        } catch (e) {
          // non-fatal; continue and attempt to append element
          console.warn('Could not import labs-toast:', e);
        }
      }
      // single toast instance appended to body
      if (!document.body.querySelector('labs-toast')) {
        const t = document.createElement('labs-toast');
        document.body.appendChild(t);
      }
      this._toast = document.body.querySelector('labs-toast');
    }

    _showToast(message, opts = {}) {
      // Unified helper that ensures toast is ready before showing
      try {
        return this._ensureToast().then(() => {
          if (this._toast && typeof this._toast.show === 'function') {
            this._toast.show(message, opts);
          } else {
            console.warn('labs-toast not available to show message:', message);
          }
        });
      } catch (e) { return Promise.resolve(); }
    }

    _resetAll() {
      if (!this._items || !this._items.length) return;
      // copy current items for undo
      const previous = this._items.slice();
      this._items = [];
      this._save();
      this._render();

      // show toast with undo
      this._showToast('Cleared all items', { actionText: 'Undo', duration: 5000 }).then(() => {
        const onAction = () => {
          this._items = previous.slice();
          this._save();
          this._render();
          cleanup();
        };
        const onDismiss = () => { cleanup(); };
        const cleanup = () => {
          if (this._toast) this._toast.removeEventListener('action', onAction);
          if (this._toast) this._toast.removeEventListener('dismiss', onDismiss);
        };
        if (this._toast) this._toast.addEventListener('action', onAction, { once: true });
        if (this._toast) this._toast.addEventListener('dismiss', onDismiss, { once: true });
      });
    }

    _save() {
      try {
        localStorage.setItem('today-list-items', JSON.stringify(this._items));
      } catch (e) {
        // ignore storage errors
      }
    }

    _load() {
      try {
        const raw = localStorage.getItem('today-list-items');
        if (raw) {
          this._items = JSON.parse(raw) || [];
        } else {
          this._items = [];
        }
      } catch (e) {
        this._items = [];
      }
    }

    _onSubmit(e) {
      const value = e && e.detail && e.detail.value && e.detail.value.trim();
      if (!value) return;
      const now = Date.now();
      if (!this._lastAdd) this._lastAdd = { value: '', ts: 0 };
      if (this._lastAdd.value === value && (now - this._lastAdd.ts) < 250) return;
      this._lastAdd.value = value; this._lastAdd.ts = now;

      // Clear input
      if (this._input && this._input.value !== undefined) {
        this._input.value = '';
      }

      const item = {
        id: Date.now() + Math.random().toString(36).slice(2, 7),
        text: value,
        completed: false,
        createdAt: new Date().toISOString(),
        restoredFrom: null
      };
      this._items.unshift(item);
      this._save();
      this._render();
    }

    // Public helper to request an external editor or notify host to open input
    openInput() {
      try {
        this.dispatchEvent(new CustomEvent('request-open-input', { bubbles: true, composed: true }));
      } catch (e) { }
    }

    // Public API to add an item programmatically (used by external editors)
    addItem(value) {
      const v = value && String(value).trim();
      if (!v) return;
      const now = Date.now();
      if (!this._lastAdd) this._lastAdd = { value: '', ts: 0 };
      if (this._lastAdd.value === v && (now - this._lastAdd.ts) < 250) return;
      this._lastAdd.value = v; this._lastAdd.ts = now;
      const item = {
        id: Date.now() + Math.random().toString(36).slice(2, 7),
        text: v,
        completed: false,
        createdAt: new Date().toISOString(),
        restoredFrom: null,
        archived: false,
        locked: false,
        editableUntil: Date.now() + 5000
      };
      this._items.unshift(item);
      this._startEditableTimer(item);
      this._save();
      this._render();
    }

    _restoreItem(archivedItem) {
      // duplicate archived item to today (only once)
      if (archivedItem.restoredFrom) return; // Already duplicated
      const newItem = {
        id: Date.now() + Math.random().toString(36).slice(2, 7),
        text: archivedItem.text,
        completed: false,
        createdAt: new Date().toISOString(),
        restoredFrom: archivedItem.id,
        archived: false,
        locked: false,
        editableUntil: Date.now() + 5000
      };
      // Mark the archived item as restored/duplicated
      archivedItem.restoredFrom = newItem.id;
      this._items.unshift(newItem);
      this._startEditableTimer(newItem);
      this._save();
      this._render();
    }

    _render() {
      // Clear existing lists
      this._todayList.innerHTML = '';
      this._completedList.innerHTML = '';
      this._archivedSection.innerHTML = '';

      if (!this._items.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No items yet — add something using the input above.';
        this._todayList.appendChild(empty);
        return;
      }

      // Group items by completion status and date
      const todayItems = this._items.filter(item => !item.archived && !item.completed && this._isToday(item.createdAt));
      const completedItems = this._items.filter(item => !item.archived && item.completed);
      const archivedItems = this._items.filter(item => item.archived);

      // Render today's items
      if (todayItems.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No items for today yet.';
        this._todayList.appendChild(empty);
      } else {
        todayItems.forEach((item, index) => {
          const itemEl = this._createItemElement(item, index, 'today');
          this._todayList.appendChild(itemEl);
        });
      }

      // Render completed items
      if (completedItems.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No completed items.';
        this._completedList.appendChild(empty);
      } else {
        completedItems.forEach((item, index) => {
          const itemEl = this._createItemElement(item, index, 'completed');
          this._completedList.appendChild(itemEl);
        });
      }

      // Render archived items inside a single labs-details accordion
      if (archivedItems.length > 0) {
        const details = document.createElement('labs-details');
        details.setAttribute('variant', 'secondary');
        const summary = document.createElement('span');
        summary.slot = 'summary';
        summary.textContent = `Archived (${archivedItems.length})`;
        details.appendChild(summary);

        // Group archived items by date
        const archivedGroups = {};
        archivedItems.forEach(item => {
          const dateKey = this._formatTimestamp(item.createdAt);
          if (!archivedGroups[dateKey]) {
            archivedGroups[dateKey] = [];
          }
          archivedGroups[dateKey].push(item);
        });

        Object.keys(archivedGroups).forEach(dateKey => {
          const dateSection = document.createElement('div');
          dateSection.className = 'archived-divider';

          const dateTitle = document.createElement('div');
          dateTitle.className = 'section-title';
          dateTitle.textContent = dateKey;

          const dateList = document.createElement('div');
          dateList.className = 'list archived-list';

          archivedGroups[dateKey].forEach((item, index) => {
            const itemEl = this._createItemElement(item, index, 'archived');
            dateList.appendChild(itemEl);
          });

          dateSection.appendChild(dateTitle);
          dateSection.appendChild(dateList);
          details.appendChild(dateSection);
        });
        this._archivedSection.appendChild(details);
      }
    }

    _createItemElement(item, index, section) {
      const entryWrap = document.createElement('div');
      entryWrap.className = `tl-entry ${section === 'archived' ? 'archived' : ''}`;

      const left = document.createElement('div');
      left.className = 'tl-entry-left';

      // Checkbox / complete button
      const completeBtn = document.createElement('labs-button');
      completeBtn.setAttribute('variant', 'icon');
      completeBtn.setAttribute('aria-label', item.completed ? 'Mark undone' : 'Mark done');
      const completeIconSlot = document.createElement('span');
      completeIconSlot.setAttribute('slot', 'icon-left');
      const completeIcon = document.createElement('labs-icon');
      completeIcon.setAttribute('name', item.completed ? 'check_box' : 'check_box_outline_blank');
      completeIconSlot.appendChild(completeIcon);
      completeBtn.appendChild(completeIconSlot);
      completeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.completed) return; // once completed it's locked
        // mark completed and lock immediately
        item.completed = true;
        item.locked = true;
        this._save();
        this._render();

        // show toast with undo option
        this._showToast('Item completed', { actionText: 'Undo', duration: 5000 }).then(() => {
          const onAction = () => {
            item.completed = false;
            item.locked = false;
            this._save();
            this._render();
            cleanup();
          };
          const cleanup = () => { if (this._toast) this._toast.removeEventListener('action', onAction); };
          if (this._toast) this._toast.addEventListener('action', onAction, { once: true });
        });
      });

      // Content: title is either an inline input (editing) or a filled label
      const content = document.createElement('div');
      content.className = 'tl-entry-content';

      const textWrap = document.createElement('div');
      // states: empty, filled, filled-not-focused
      textWrap.className = `tl-entry-text ${item.completed ? 'completed' : ''} ${item.locked ? 'locked' : ''}`;

      const now = Date.now();
      const canEdit = !item.locked && (!item.editableUntil || item.editableUntil > now);

      if (item._editing && canEdit) {
        // inline editor using labs-input
        const inlineInput = document.createElement('labs-input');
        inlineInput.setAttribute('keep', '');
        inlineInput.value = item.text || '';
        inlineInput.addEventListener('submit', (ev) => {
          const v = ev && ev.detail && ev.detail.value && ev.detail.value.trim();
          if (v !== undefined && v !== null) {
            item.text = v;
            // after editing, lock the item
            item.locked = true;
            delete item.editableUntil;
            delete item._editing;
            this._save();
            this._render();
          }
        });
        // if user blurs without submitting, cancel editing (don't persist changes)
        try {
          // focus inner input after a tick
          setTimeout(() => { try { inlineInput.focus(); } catch (e) { } }, 20);
        } catch (e) { }
        textWrap.appendChild(inlineInput);
      } else {
        // display label
        const label = document.createElement('div');
        label.textContent = item.text || '';
        label.className = item.text ? 'filled' : 'empty';
        if (canEdit) {
          label.style.cursor = 'text';
          label.addEventListener('click', (e) => {
            e.stopPropagation();
            // only allow inline editing during the editable window
            if (!item.locked && (!item.editableUntil || item.editableUntil > Date.now())) {
              item._editing = true;
              this._render();
            }
          });
        }
        textWrap.appendChild(label);
      }

      const meta = document.createElement('div');
      meta.className = 'tl-entry-meta';
      meta.textContent = this._formatTimestamp(item.createdAt);

      content.appendChild(textWrap);
      content.appendChild(meta);

      left.appendChild(completeBtn);
      left.appendChild(content);

      // Actions
      const right = document.createElement('div');
      right.className = 'tl-entry-actions';

      // Archive (replaces delete). For archived items, show restore/duplicate instead.
      if (section === 'archived') {
        if (!item.restoredFrom) {
          const restoreBtn = document.createElement('labs-button');
          restoreBtn.setAttribute('variant', 'icon');
          restoreBtn.setAttribute('aria-label', 'Restore item');
          const restoreIconSlot = document.createElement('span');
          restoreIconSlot.setAttribute('slot', 'icon-left');
          const restoreIcon = document.createElement('labs-icon');
          restoreIcon.setAttribute('name', 'history');
          restoreIconSlot.appendChild(restoreIcon);
          restoreBtn.appendChild(restoreIconSlot);
          restoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._restoreItem(item);
          });
          right.appendChild(restoreBtn);
        } else {
          const restoredBtn = document.createElement('labs-button');
          restoredBtn.setAttribute('variant', 'icon');
          restoredBtn.setAttribute('aria-label', 'Item already restored');
          restoredBtn.style.opacity = '0.5';
          restoredBtn.style.pointerEvents = 'none';
          const restoredIconSlot = document.createElement('span');
          restoredIconSlot.setAttribute('slot', 'icon-left');
          const restoredIcon = document.createElement('labs-icon');
          restoredIcon.setAttribute('name', 'published_with_changes');
          restoredIconSlot.appendChild(restoredIcon);
          restoredBtn.appendChild(restoredIconSlot);
          right.appendChild(restoredBtn);
        }
      } else {
        const archiveBtn = document.createElement('labs-button');
        archiveBtn.setAttribute('variant', 'icon');
        archiveBtn.setAttribute('aria-label', 'Archive');
        const archiveIconSlot = document.createElement('span');
        archiveIconSlot.setAttribute('slot', 'icon-left');
        const archiveIcon = document.createElement('labs-icon');
        archiveIcon.setAttribute('name', 'history');
        archiveIconSlot.appendChild(archiveIcon);
        archiveBtn.appendChild(archiveIconSlot);
        archiveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // archive item (cannot be deleted)
          item.archived = true;
          item.archivedAt = new Date().toISOString();
          this._save();
          this._render();

          this._showToast('Item archived', { actionText: 'Undo', duration: 5000 }).then(() => {
            const onAction = () => {
              item.archived = false;
              delete item.archivedAt;
              this._save();
              this._render();
              cleanup();
            };
            const cleanup = () => { if (this._toast) this._toast.removeEventListener('action', onAction); };
            if (this._toast) this._toast.addEventListener('action', onAction, { once: true });
          });
        });
        right.appendChild(archiveBtn);
        // Add delete button as well (user requested delete option)
        const delBtn = document.createElement('labs-button');
        delBtn.setAttribute('variant', 'icon');
        delBtn.setAttribute('aria-label', 'Delete');
        delBtn.setAttribute('data-action', 'delete');
        const delIconSlot = document.createElement('span');
        delIconSlot.setAttribute('slot', 'icon-left');
        const delIcon = document.createElement('labs-icon');
        delIcon.setAttribute('name', 'delete_forever');
        delIconSlot.appendChild(delIcon);
        delBtn.appendChild(delIconSlot);
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._deleteWithUndo(item, index);
        });
        right.appendChild(delBtn);
      }

      // Make the whole entry clickable to toggle completion, but ignore clicks
      // that originate from action buttons or the inline input.
      entryWrap.addEventListener('click', (e) => {
        // If click came from an actionable control, ignore
        const path = e.composedPath ? e.composedPath() : (e.path || []);
        for (const node of path) {
          if (!node || !node.className) continue;
          // ignore clicks on action buttons or labs-button elements
          if (node.tagName && node.tagName.toLowerCase() === 'labs-button') return;
          if (node.classList && node.classList.contains && node.classList.contains('tl-entry-actions')) return;
          if (node.tagName && node.tagName.toLowerCase() === 'labs-input') return;
        }

        // Prevent toggling if item is archived or locked
        if (item.archived || item.locked) return;

        // Toggle completion
        item.completed = !item.completed;
        if (item.completed) {
          item.locked = true;
        }
        this._save();
        this._render();

        if (item.completed) {
          // show undo toast similar to completeBtn
          this._showToast('Item completed', { actionText: 'Undo', duration: 5000 }).then(() => {
            const onAction = () => {
              item.completed = false;
              item.locked = false;
              this._save();
              this._render();
              cleanup();
            };
            const cleanup = () => { if (this._toast) this._toast.removeEventListener('action', onAction); };
            if (this._toast) this._toast.addEventListener('action', onAction, { once: true });
          });
        }
      });

      entryWrap.appendChild(left);
      entryWrap.appendChild(right);

      return entryWrap;
    }

    _archiveWithUndo(item, index) {
      // mark archived and remove from current lists; allow undo for a short window
      item.archived = true;
      item.archivedAt = new Date().toISOString();
      this._save();
      this._render();

      this._showToast('Item archived', { actionText: 'Undo', duration: 5000 }).then(() => {
        const onAction = () => {
          item.archived = false;
          delete item.archivedAt;
          this._save();
          this._render();
          cleanup();
        };
        const onDismiss = () => { cleanup(); };
        const cleanup = () => {
          if (this._toast) this._toast.removeEventListener('action', onAction);
          if (this._toast) this._toast.removeEventListener('dismiss', onDismiss);
        };
        if (this._toast) this._toast.addEventListener('action', onAction, { once: true });
        if (this._toast) this._toast.addEventListener('dismiss', onDismiss, { once: true });
      });
    }

    _deleteWithUndo(item, index) {
      // remove item fully with undo option
      const removedIndex = this._items.findIndex(i => i.id === item.id);
      if (removedIndex === -1) return;
      const removed = this._items.splice(removedIndex, 1)[0];
      this._save();
      this._render();

      this._showToast('Item deleted', { actionText: 'Undo', duration: 5000 }).then(() => {
        const onAction = () => {
          // restore item at front
          this._items.unshift(removed);
          this._save();
          this._render();
          cleanup();
        };
        const onDismiss = () => { cleanup(); };
        const cleanup = () => {
          if (this._toast) this._toast.removeEventListener('action', onAction);
          if (this._toast) this._toast.removeEventListener('dismiss', onDismiss);
        };
        if (this._toast) this._toast.addEventListener('action', onAction, { once: true });
        if (this._toast) this._toast.addEventListener('dismiss', onDismiss, { once: true });
      });
    }
  }

  if (!customElements.get('today-list-app')) {
    customElements.define('today-list-app', TodayListApp);
  }
}

export default TodayListApp;
