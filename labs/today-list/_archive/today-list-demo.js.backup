// Demo module for Today List page
// Imports required web components
import '../design-system/components/labs-overlay.js';
import '../design-system/components/labs-settings-card.js';
import '../design-system/components/labs-flavor-button.js';
import '../design-system/components/labs-input-card.js';
import '../design-system/components/labs-list-item.js';
import '../design-system/components/labs-toast.js';
import '../design-system/components/labs-details.js';

// Ensure labs-toast exists for undo actions (top-level for global access)
function ensureToast() {
  if (!document.body.querySelector('labs-toast')) {
    const t = document.createElement('labs-toast');
    document.body.appendChild(t);
  }
  return document.body.querySelector('labs-toast');
}

// Theme management utilities (mirrored from Pad/Today List)
function applyTheme({ flavor = 'blueberry', theme = 'light' } = {}) {
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
  document.dispatchEvent(new CustomEvent('themeChanged'));
}

function initSystemTheme(defaultTheme = 'light') {
  const savedTheme = localStorage.getItem('today-list-theme');
  const savedFlavor = localStorage.getItem('today-list-flavor');
  applyTheme({
    flavor: savedFlavor || 'blueberry',
    theme: savedTheme || 'light',
  });
}

function updateThemeToggleButton() {
  // Prefer settings overlay controls (injected into settings card)
  const themeIcon = document.getElementById('settingsThemeIcon') || document.getElementById('themeIcon') || document.getElementById('themeIconCenter');
  const themeButton = document.getElementById('settingsThemeBtn') || document.getElementById('themeToggle') || document.getElementById('themeToggleCenter');
  const themeLabel = document.getElementById('settingsThemeLabel') || document.getElementById('themeLabel') || document.getElementById('themeLabelCenter');
  const isDark = document.documentElement.classList.contains('theme-dark');
  if (themeIcon) themeIcon.setAttribute('name', isDark ? 'bedtime_off' : 'bedtime');
  if (themeButton) themeButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  if (themeLabel) themeLabel.textContent = isDark ? 'Dark' : 'Light';
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('theme-dark');
  const currentFlavor = getCurrentFlavor();
  applyTheme({ flavor: currentFlavor, theme: isDark ? 'light' : 'dark' });
  updateThemeToggleButton();
}

function getCurrentFlavor() {
  const flavors = ['vanilla', 'blueberry', 'strawberry'];
  for (const f of flavors) {
    if (document.documentElement.classList.contains(`flavor-${f}`)) return f;
  }
  return 'blueberry';
}

function cycleFlavor() {
  const flavors = ['vanilla', 'blueberry', 'strawberry'];
  const current = getCurrentFlavor();
  const idx = flavors.indexOf(current);
  const next = flavors[(idx + 1) % flavors.length];
  const isDark = document.documentElement.classList.contains('theme-dark');
  applyTheme({ flavor: next, theme: isDark ? 'dark' : 'light' });
}

// Initialize theme system
initSystemTheme();

// Persistence helpers for Today List items
const STORAGE_KEY = 'today-list-items-v2';

function saveItemsToStorage() {
  try {
    const items = [];
    const list = document.getElementById('todayItems');
    Array.from(list.children).forEach(child => {
      if (child.tagName && child.tagName.toLowerCase() === 'labs-list-item') {
        items.push({
          id: child.getAttribute('data-id') || null,
          text: child.getAttribute('value') || '',
          checked: child.hasAttribute('checked'),
          archived: child.hasAttribute('archived'),
          restored: child.hasAttribute('restored'),
          timestamp: child.getAttribute('timestamp') || null,
          date: child.getAttribute('date') || null,
          originalId: child.getAttribute('data-original-id') || null
        });
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) { console.warn('Could not persist items', e); }
}

function loadItemsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) { return []; }
}

// Render welcome card when empty
function renderWelcomeIfEmpty() {
  const today = document.getElementById('todayItems');
  const container = document.getElementById('welcomeCardContainer');
  container.innerHTML = '';
  // Only render the welcome card when there are no list items
  const hasItems = today && today.querySelector && today.querySelector('labs-list-item');
  if (hasItems) return;
  const card = document.createElement('div');
  card.style.background = 'var(--color-surface)';
  card.style.border = '1px solid color-mix(in srgb, var(--color-on-surface) 6%, transparent)';
  card.style.padding = '16px';
  card.style.borderRadius = '12px';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '8px';
  card.style.boxSizing = 'border-box';
  card.style.width = '100%';
  card.style.maxWidth = '100%';
  const h = document.createElement('div');
  h.textContent = 'Welcome - add your first item to get started';
  h.style.fontSize = 'var(--font-size-card-header, 1.125rem)';
  h.style.fontWeight = 'var(--font-weight-card-header, 600)';
  h.style.color = 'var(--color-on-surface)';
  // description removed per spec
  const inputWrap = document.createElement('div');
  inputWrap.style.display = 'flex';
  inputWrap.style.gap = '8px';

  const inlineInput = document.createElement('input');
  inlineInput.type = 'text';
  inlineInput.placeholder = 'New item';
  inlineInput.style.flex = '1';
  inlineInput.style.padding = '10px';
  inlineInput.style.borderRadius = '8px';
  inlineInput.style.border = '1px solid color-mix(in srgb, var(--color-on-surface) 8%, transparent)';

  const addBtn = document.createElement('labs-button');
  addBtn.setAttribute('size', 'large');
  addBtn.setAttribute('variant', 'primary');
  addBtn.setAttribute('pill', '');
  // add icon similar to footer button
  const addIcon = document.createElement('labs-icon');
  addIcon.setAttribute('slot', 'icon-left');
  addIcon.setAttribute('name', 'add');
  addIcon.setAttribute('width', '20');
  addIcon.setAttribute('height', '20');
  addBtn.appendChild(addIcon);
  addBtn.appendChild(document.createTextNode('Add'));
  addBtn.addEventListener('click', () => {
    const val = inlineInput.value && inlineInput.value.trim();
    if (val) {
      appendItem(val);
      inlineInput.value = '';
    }
  });
  inlineInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addBtn.click(); }
  });
  inputWrap.appendChild(inlineInput);
  inputWrap.appendChild(addBtn);
  card.appendChild(h);
  card.appendChild(inputWrap);
  // center the welcome card horizontally
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.justifyContent = 'center';
  wrapper.appendChild(card);
  container.appendChild(wrapper);
}

// Hydrate items from storage on load
function hydrateFromStorage() {
  const items = loadItemsFromStorage();
  if (!items || !items.length) return;
  const list = document.getElementById('todayItems');
  // Prevent loading multiple restored copies for the same original
  const restoredOriginals = new Set();
  items.forEach(it => {
    if (it.originalId) {
      if (restoredOriginals.has(it.originalId)) return; // skip duplicate restored copy
      restoredOriginals.add(it.originalId);
    }
    const el = document.createElement('labs-list-item');
    if (it.id) el.setAttribute('data-id', it.id);
    el.setAttribute('value', it.text || '');
    // Add checkbox control (like Tracker)
    const controlIcon = document.createElement('labs-icon');
    controlIcon.slot = 'control';
    controlIcon.setAttribute('name', 'check');
    controlIcon.setAttribute('aria-hidden', 'true');
    el.appendChild(controlIcon);
    // Add slotted content for visible text
    const contentNode = document.createElement('span');
    contentNode.setAttribute('slot', 'content');
    contentNode.textContent = it.text || '';
    el.appendChild(contentNode);
    if (it.checked) el.setAttribute('checked', '');
    if (it.archived) el.setAttribute('archived', '');
    if (it.restored) el.setAttribute('restored', '');
    if (it.timestamp) el.setAttribute('timestamp', it.timestamp);
    if (it.date) el.setAttribute('date', it.date);
    if (it.originalId) el.setAttribute('data-original-id', it.originalId);
    // Add actions slot with a delete-only dropdown by default for hydrated items
    const actionsWrap = document.createElement('div');
    actionsWrap.slot = 'actions';
    const actionsDropdown = document.createElement('labs-dropdown');
    actionsDropdown.setAttribute('only', 'delete');
    actionsDropdown.setAttribute('aria-label', 'More actions');
    actionsWrap.appendChild(actionsDropdown);
    el.appendChild(actionsWrap);
    list.appendChild(el);
    wireItemPersistence(el);
  });
  renderGroupedView();
}

function wireItemPersistence(item) {
  if (!item) return;
  // when an item requests archive, move DOM and persist; offer undo
  item.addEventListener('archive', (ev) => {
    const list = document.getElementById('todayItems');
    const previousParent = item.parentElement;
    const snapshot = { parent: previousParent, index: Array.from(previousParent.children).indexOf(item) };

    // Check if this is a restored item being archived again
    const originalId = item.getAttribute('data-original-id');
    if (originalId) {
      // This is a restored copy being archived again. Do not mutate its `data-id`
      // or remove `data-original-id` — keep the linkage so it cannot be treated
      // as a fresh original later. We still mark it archived below.
      console.log('Archiving a restored copy; preserving data-original-id=', originalId);
    }

    // Normal archive behavior: keep item in same list but mark archived
    item.setAttribute('archived', '');
    saveItemsToStorage();
    renderGroupedView();
    showUndoToast('Item archived', () => {
      try {
        // create a fresh item for today so it doesn't inherit archived/restored state
        const newItem = document.createElement('labs-list-item');
        newItem.setAttribute('value', item.getAttribute('value') || '');
        newItem.setAttribute('data-id', `item-${Math.random().toString(36).slice(2, 9)}`);
        // mark the archived original as restored so it shows the history icon and becomes inactive
        if (!item.hasAttribute('restored')) item.setAttribute('restored', '');
        // add actions dropdown (delete-only) and wire events for the new item
        const newActions = document.createElement('div');
        newActions.slot = 'actions';
        const newDd = document.createElement('labs-dropdown');
        newDd.setAttribute('only', 'delete');
        newDd.setAttribute('aria-label', 'More actions');
        newActions.appendChild(newDd);
        newItem.appendChild(newActions);
        wireItemPersistence(newItem);
        const list = document.getElementById('todayItems');
        list.insertBefore(newItem, list.firstChild);
      } catch (e) {
        // fallback: reinsert original node
        if (snapshot.parent && snapshot.parent.insertBefore) snapshot.parent.insertBefore(item, snapshot.parent.children[snapshot.index] || null);
      }
      saveItemsToStorage();
      renderWelcomeIfEmpty();
    });
  });

  // When a component requests a restore-copy while keeping the original archived, create the clone
  item.addEventListener('request-restore-copy', (ev) => {
    try {
      const today = document.getElementById('todayItems');

      // Get the original ID for tracking
      const originalId = item.getAttribute('data-id');

      // Check if a restored copy referencing this original already exists (prevent duplicates)
      const existingRestored = today.querySelector(`[data-original-id="${originalId}"]`) || today.querySelector(`[data-id="${originalId}-restored"]`);
      if (existingRestored) {
        console.log('Found existing restored copy, ignoring duplicate request');
        // ensure the original is marked restored as a safeguard
        if (!item.hasAttribute('restored')) item.setAttribute('restored', '');
        return;
      }

      // mark the archived original as restored (inactive)
      if (!item.hasAttribute('restored')) item.setAttribute('restored', '');
      // create a fresh item for today as the restored copy
      const clone = document.createElement('labs-list-item');
      clone.setAttribute('data-id', `${originalId}-restored`);
      clone.setAttribute('data-original-id', originalId);
      clone.setAttribute('value', item.getAttribute('value') || '');
      // restored clone should get a delete-only dropdown in its actions slot
      const cloneActions = document.createElement('div');
      cloneActions.slot = 'actions';
      const cloneDd = document.createElement('labs-dropdown');
      cloneDd.setAttribute('only', 'delete');
      cloneDd.setAttribute('aria-label', 'More actions');
      cloneActions.appendChild(cloneDd);
      clone.appendChild(cloneActions);
      wireItemPersistence(clone);
      today.prepend(clone);
      saveItemsToStorage();
      renderWelcomeIfEmpty();
    } catch (e) { console.warn('Could not restore copy', e); }
  });

  // when remove triggered, detach and persist; offer undo
  item.addEventListener('remove', (ev) => {
    const parent = item.parentElement;
    const snapshot = { parent, index: Array.from(parent.children).indexOf(item) };

    item.remove();

    saveItemsToStorage();
    renderWelcomeIfEmpty();
    // Ensure labs-toast exists before showing the toast
    ensureToast();
    showUndoToast('Item removed', () => {
      if (snapshot.parent && snapshot.parent.insertBefore) {
        snapshot.parent.insertBefore(item, snapshot.parent.children[snapshot.index] || null);
        saveItemsToStorage();
        renderWelcomeIfEmpty();
      }
    });
  });

  // handle restore intent from archived item
  item.addEventListener('restore', (ev) => {
    const today = document.getElementById('todayItems');
    // The component already removed archived attribute and set restored; create a copy into today
    try {
      // Determine original id and avoid creating duplicate restored copies
      const originalId = item.getAttribute('data-id');
      const existingRestored = originalId ? (today.querySelector(`[data-original-id="${originalId}"]`) || today.querySelector(`[data-id="${originalId}-restored"]`)) : null;
      if (existingRestored) {
        console.log('Original already has a restored copy, ignoring duplicate restore');
        if (!item.hasAttribute('restored')) item.setAttribute('restored', '');
        return;
      }
      // create a fresh restored item instead of cloning the archived element
      const clone = document.createElement('labs-list-item');
      clone.setAttribute('data-id', `item-${Math.random().toString(36).slice(2, 9)}`);
      clone.setAttribute('value', item.getAttribute('value') || '');
      // link restored copy back to original for future duplicate detection
      if (item.getAttribute('data-id')) clone.setAttribute('data-original-id', item.getAttribute('data-id'));
      // add a delete-only actions dropdown for the restored clone
      const cloneActions = document.createElement('div');
      cloneActions.slot = 'actions';
      const cloneDd = document.createElement('labs-dropdown');
      cloneDd.setAttribute('only', 'delete');
      cloneDd.setAttribute('aria-label', 'More actions');
      cloneActions.appendChild(cloneDd);
      clone.appendChild(cloneActions);
      wireItemPersistence(clone);
      today.prepend(clone);
      // mark original archived instance as restored so it can't be restored again
      item.setAttribute('restored', '');
      saveItemsToStorage();
      renderWelcomeIfEmpty();
    } catch (e) { }
  });

  // toggling checkboxes only needs persistence
  item.addEventListener('toggle', () => { saveItemsToStorage(); });
}

// Setup DOM handlers on load
document.addEventListener('DOMContentLoaded', () => {
  // Appearance controls are provided inside the settings overlay for parity.
  // Create controls and inject them into the settings card's appearance slot.
  const settingsCard = document.querySelector('labs-settings-card');
  if (settingsCard) {
    const appearanceSlot = settingsCard.shadowRoot.getElementById('appearance-btn-slot');
    if (appearanceSlot) {
      // Only inject flavors/theme if host hasn't already provided controls
      if (appearanceSlot.children.length === 0) {
        // Create flavor button
        const flavorWrap = document.createElement('div');
        flavorWrap.style.display = 'flex';
        flavorWrap.style.flexDirection = 'column';
        flavorWrap.style.alignItems = 'flex-start';
        flavorWrap.style.gap = '6px';

        const flavorBtn = document.createElement('labs-flavor-button');
        // Set initial label to the current flavor (capitalized)
        const currentFlavor = getCurrentFlavor();
        const flavorLabel = currentFlavor.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        flavorBtn.setAttribute('label', flavorLabel);

        const themeBtn = document.createElement('labs-button');
        themeBtn.setAttribute('variant', 'secondary');
        themeBtn.style.gap = '8px';
        themeBtn.id = 'settingsThemeBtn';
        // label updated by updateThemeToggleButton()
        themeBtn.innerHTML = `<labs-icon name="bedtime" slot="icon-left" width="20" height="20"></labs-icon> <span id="settingsThemeLabel">Theme</span>`;
        themeBtn.addEventListener('click', (e) => { e.preventDefault(); toggleTheme(); updateThemeToggleButton(); });

        flavorWrap.appendChild(flavorBtn);
        flavorWrap.appendChild(themeBtn);
        appearanceSlot.appendChild(flavorWrap);
      }
    }

    // Wire reset event coming from settings card
    settingsCard.addEventListener('reset-all', () => resetAllData(true));
  }
  // initialize icon and label state
  updateThemeToggleButton();
  // Footer icon buttons were moved into settings overlay; ensure Add and More still function
  // Settings overlay wiring: ensure the overlay close event handles card 'close' events
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsCardEl = document.querySelector('labs-settings-card');
  if (settingsOverlay && settingsCardEl) {
    settingsCardEl.addEventListener('close', () => settingsOverlay.close());
    // Forward simulate-next-day event
    settingsCardEl.addEventListener('simulate-next-day', () => simulateNextDay());
    // Forward reset-all handled above via 'reset-all' listener
  }

  // More button opens settings overlay on narrow screens
  const moreBtn = document.getElementById('footer-more-btn');
  if (moreBtn && settingsOverlay) {
    moreBtn.addEventListener('click', () => settingsOverlay.open());
    // Show the More button only on narrow screens; CSS class handles visibility but ensure fallback
    const mql = window.matchMedia('(max-width:420px)');
    const setMoreVisibility = () => { moreBtn.style.display = mql.matches ? '' : 'none'; };
    setMoreVisibility();
    mql.addEventListener('change', setMoreVisibility);
  }

  // Controls are injected into the settings overlay; footer wiring removed.

  // Inject full controls into settings overlay: All apps, Theme, Flavor, Reset
  if (settingsCard) {
    try {
      const appearanceSlot = settingsCard.shadowRoot.getElementById('appearance-btn-slot');
      if (appearanceSlot) {
        // Only inject the full controls if the slot is empty (prevent duplicates)
        if (appearanceSlot.children.length === 0) {
          // All apps
          const allAppsBtn = document.createElement('labs-button');
          allAppsBtn.setAttribute('variant', 'secondary');
          allAppsBtn.style.gap = '8px';
          allAppsBtn.innerHTML = `<labs-icon name="apps" slot="icon-left" width="20" height="20"></labs-icon> All apps`;
          allAppsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const localUrl = 'http://localhost:8000/';
            const publicUrl = '/labs/';
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 600);
              await fetch(localUrl, { mode: 'no-cors', signal: controller.signal });
              clearTimeout(timeout);
              window.open(localUrl, '_blank');
            } catch (err) {
              window.open(publicUrl, '_blank');
            }
          });

          // Theme
          const themeBtn = document.createElement('labs-button');
          themeBtn.setAttribute('variant', 'secondary');
          themeBtn.style.gap = '8px';
          themeBtn.innerHTML = `<labs-icon name="bedtime" slot="icon-left" width="20" height="20"></labs-icon> <span id="settingsThemeLabel">Theme</span>`;
          themeBtn.addEventListener('click', (e) => { e.preventDefault(); toggleTheme(); updateThemeToggleButton(); });

          // Flavor control using the labs-flavor-button web component
          const flavorBtn = document.createElement('labs-flavor-button');
          // Set initial label to the current flavor (capitalized)
          const currentFlavor = getCurrentFlavor();
          const flavorLabel = currentFlavor.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
          flavorBtn.setAttribute('label', flavorLabel);

          // Reset
          const resetBtn = document.createElement('labs-button');
          resetBtn.setAttribute('variant', 'destructive');
          resetBtn.style.gap = '8px';
          resetBtn.innerHTML = `<labs-icon name="delete" slot="icon-left" width="20" height="20" color="var(--color-on-error)"></labs-icon> Reset all`;
          resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const confirmed = window.confirm('Warning: This will delete all Today List entries and settings. Are you sure you want to continue?');
            if (!confirmed) return;
            resetAllData(true);
          });

          appearanceSlot.appendChild(allAppsBtn);
          appearanceSlot.appendChild(themeBtn);
          appearanceSlot.appendChild(flavorBtn);
          appearanceSlot.appendChild(resetBtn);
        }
      }
    } catch (e) { /* ignore */ }
  }

  // Footer settings icon opens overlay
  const footerSettingsIcon = document.getElementById('footerSettingsBtn') || document.getElementById('footer-settings-btn');
  if (footerSettingsIcon && settingsOverlay) footerSettingsIcon.addEventListener('click', () => settingsOverlay.open());

  // Listen for actions dispatched from the settings card's internal buttons
  if (settingsCardEl) {
    settingsCardEl.addEventListener('open-all-apps', () => {
      const localUrl = 'http://localhost:8000/';
      const publicUrl = '/labs/';
      (async () => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 600);
          await fetch(localUrl, { mode: 'no-cors', signal: controller.signal });
          clearTimeout(timeout);
          window.open(localUrl, '_blank');
        } catch (e) { window.open(publicUrl, '_blank'); }
      })();
    });

    settingsCardEl.addEventListener('toggle-theme', () => { toggleTheme(); updateThemeToggleButton(); });
    settingsCardEl.addEventListener('cycle-flavor', (e) => {
      const flavor = (e && e.detail && e.detail.flavor) ? e.detail.flavor : getCurrentFlavor();
      const isDark = document.documentElement.classList.contains('theme-dark');
      applyTheme({ flavor, theme: isDark ? 'dark' : 'light' });
      updateThemeToggleButton();
    });
  }

  // Always update the current date display on load
  updateCurrentDate();

  // Input overlay wiring (Add button)
  const addBtn = document.getElementById('footerAddBtn');
  const inputOverlay = document.getElementById('inputOverlay');
  if (addBtn && inputOverlay) {
    addBtn.addEventListener('click', () => {
      inputOverlay.open();
      // Focus the input inside the card after the overlay opens
      requestAnimationFrame(() => {
        const inputCard = inputOverlay.querySelector('labs-input-card');
        if (inputCard) {
          const innerInput = inputCard.shadowRoot.getElementById('cardInput');
          if (innerInput) {
            innerInput.focus();
          }
        }
      });
    });

    const inputCard = inputOverlay.querySelector('labs-input-card');
    if (inputCard) {
      inputCard.addEventListener('close', () => inputOverlay.close());
      inputCard.addEventListener('save', (e) => {
        const { value } = e.detail || {};
        if (value && value.trim()) {
          appendItem(value.trim());
        }
        // Clear the input inside the input card so it doesn't persist between opens
        try {
          const innerInput = inputCard.shadowRoot.getElementById('cardInput');
          if (innerInput) innerInput.value = '';
        } catch (err) { }
        inputOverlay.close();
      });
    }
  }

  // No auto-open for the input overlay — input is now inline in the welcome card

  // Floating demo controls removed; settings overlay exposes Archive/Reset/Simulate actions now.

  // Load persisted items and render welcome state
  hydrateFromStorage();
  renderWelcomeIfEmpty();

  // Show header after app initialization to prevent FOUC
  const appHeader = document.getElementById('app-header');
  if (appHeader) {
    requestAnimationFrame(() => {
      appHeader.style.opacity = '1';
    });
  }
});

// Append item to the today list
function appendItem(text) {
  const today = document.getElementById('todayItems');
  const item = document.createElement('labs-list-item');
  const id = `item-${Math.random().toString(36).slice(2, 9)}`;
  item.setAttribute('data-id', id);
  item.setAttribute('value', text);
  // Add checkbox control (like Tracker)
  const controlIcon = document.createElement('labs-icon');
  controlIcon.slot = 'control';
  controlIcon.setAttribute('name', 'check');
  controlIcon.setAttribute('aria-hidden', 'true');
  item.appendChild(controlIcon);
  // Add slotted content for visible text
  const contentNode = document.createElement('span');
  contentNode.setAttribute('slot', 'content');
  contentNode.textContent = text;
  item.appendChild(contentNode);
  // add a delete-only actions dropdown by default
  const actionsWrap = document.createElement('div');
  actionsWrap.slot = 'actions';
  const dd = document.createElement('labs-dropdown');
  dd.setAttribute('only', 'delete');
  dd.setAttribute('aria-label', 'More actions');
  actionsWrap.appendChild(dd);
  item.appendChild(actionsWrap);

  today.prepend(item);

  // wire persistence and event handlers
  wireItemPersistence(item);
  saveItemsToStorage();
  renderWelcomeIfEmpty();
}

// Archive entire day: move all today items to archived with undo
function archiveDay() {
  const today = document.getElementById('todayItems');
  if (!today || !today.children.length) return;
  const moved = [];
  while (today.firstChild) {
    const node = today.firstChild;
    moved.push(node);
    // mark each node as archived and keep in list order; we'll render grouping differently
    node.setAttribute('archived', '');
    today.removeChild(node);
    today.appendChild(node);
  }
  saveItemsToStorage();
  renderWelcomeIfEmpty();
  showUndoToast('Day archived', () => {
    // restore moved nodes back to today in original order
    for (let i = moved.length - 1; i >= 0; i--) {
      today.prepend(moved[i]);
    }
    saveItemsToStorage();
    renderWelcomeIfEmpty();
  });
}

// Reset all data: clear storage and DOM with undo
function resetAllData(fromSettingsCard = false) {
  // If reset was triggered from settings card, the card already confirmed the action.
  // If called directly (e.g., demo button), require confirmation here.
  if (!fromSettingsCard) {
    const confirmed = window.confirm('Warning: This will delete all Today List entries and settings. Are you sure you want to continue?');
    if (!confirmed) return;
  }
  const today = document.getElementById('todayItems');
  // Clear DOM
  if (today) today.innerHTML = '';
  // Clear only Today List related storage keys
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('today-list-theme');
    localStorage.removeItem('today-list-flavor');
  } catch (e) { /* ignore */ }
  saveItemsToStorage();
  renderWelcomeIfEmpty();
}

// Simulate next day: mark as archived state (for testing)
function simulateNextDay() {
  // simple behavior: move all today items to archived but keep them present (like archiveDay)
  archiveDay();
  // update displayed date to tomorrow
  updateCurrentDate(1);
}

// Update the current date display (offsetDays allows simulate-next-day behavior)
function updateCurrentDate(offsetDays = 0) {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  // Format like: Saturday, September 13, 2025
  try {
    el.textContent = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    el.textContent = d.toDateString();
  }
}

// Simple toast helper using existing labs-toast
function showUndoToast(message, undoFn) {
  try {
    const toast = document.body.querySelector('labs-toast');
    if (toast && typeof toast.show === 'function') {
      toast.show(message, { actionText: 'Undo', duration: 5000 });
      const onAction = () => { undoFn && undoFn(); toast.removeEventListener('action', onAction); };
      toast.addEventListener('action', onAction, { once: true });
    }
  } catch (e) { console.warn('Toast unavailable', e); }
}

// Grouped rendering: show Today header with date and optionally Yesterday group
function renderGroupedView() {
  const list = document.getElementById('todayItems');
  const items = Array.from(list.querySelectorAll('labs-list-item'));
  // Clear rendered list and re-insert grouped
  list.innerHTML = '';

  // Helper to create heading
  function addGroupHeading(text) {
    const h = document.createElement('div');
    h.style.fontWeight = '600';
    h.style.margin = '12px 0 6px 0';
    h.textContent = text;
    list.appendChild(h);
  }

  // Sort helper: parse timestamp attribute (fallback to 0)
  function tsValue(el) {
    const t = el.getAttribute('timestamp');
    if (!t) return 0;
    const n = Date.parse(t);
    return isNaN(n) ? 0 : n;
  }

  // Separate into active (non-archived) and archived arrays
  const active = items.filter(i => !i.hasAttribute('archived'));
  const archived = items.filter(i => i.hasAttribute('archived'));

  // Sort both arrays by timestamp descending (newest first)
  active.sort((a, b) => tsValue(b) - tsValue(a));
  archived.sort((a, b) => tsValue(b) - tsValue(a));

  // Append active items first
  active.forEach(i => list.appendChild(i));

  // Then archived group below, with heading
  if (archived.length) {
    // Use the labs-details component so archived items live inside the bordered content
    const d = document.createElement('labs-details');
    d.id = 'archivedSection';
    d.style.marginTop = '12px';

    // Create a centered summary node and slot it into the component
    const summarySpan = document.createElement('span');
    summarySpan.setAttribute('slot', 'summary');
    summarySpan.style.display = 'inline-flex';
    summarySpan.style.alignItems = 'center';
    summarySpan.style.justifyContent = 'center';
    summarySpan.style.gap = '8px';
    summarySpan.textContent = 'Archived';

    // Container for archived list items (content slot)
    const archivedContainer = document.createElement('div');
    archivedContainer.style.display = 'flex';
    archivedContainer.style.flexDirection = 'column';
    archivedContainer.style.gap = '8px';
    archived.forEach(i => {
      // each labs-list-item should be a direct child so it sits inside the details border
      archivedContainer.appendChild(i);
    });

    d.appendChild(summarySpan);
    d.appendChild(archivedContainer);
    list.appendChild(d);
  }

  // Archived items should remain full opacity (they live inside the collapsed details)
  Array.from(list.querySelectorAll('labs-list-item')).forEach(i => {
    i.style.opacity = '';
  });

  // If there are no active items (today), show the input box in the welcome card area to prompt entry
  const welcomeContainer = document.getElementById('welcomeCardContainer');
  if (!active.length) {
    // ensure welcome is visible and includes the inline input
    renderWelcomeIfEmpty();
    // try to focus the input inside the welcome card if present
    requestAnimationFrame(() => {
      const input = welcomeContainer.querySelector('input[type="text"]');
      if (input) input.focus();
    });
  } else {
    // clear welcome container when active items present
    if (welcomeContainer) welcomeContainer.innerHTML = '';
  }
}
