# 🚀 Note App Migration - Quick Reference Guide

**Status**: Ready for Phase 1 implementation  
**Branch**: `feature/note-migration`

---

## For Quick Lookup During Implementation

### Component Imports (for index.html)

```html
<!-- Design Tokens -->
<link rel="stylesheet" href="../design-system/tokens/colors.css">
<link rel="stylesheet" href="../design-system/tokens/spacing.css">
<link rel="stylesheet" href="../design-system/tokens/typography.css">
<link rel="stylesheet" href="../design-system/tokens/border-radius.css">
<link rel="stylesheet" href="../design-system/tokens/shadows.css">
<link rel="stylesheet" href="../design-system/styles/flavors.css">

<!-- Components (Module Loading) -->
<script type="module" src="../design-system/components/labs-container.js"></script>
<script type="module" src="../design-system/components/labs-footer-with-settings.js"></script>
<script type="module" src="../design-system/components/labs-template-header-wrapped.js"></script>
<script type="module" src="../design-system/components/labs-metric-card.js"></script>
<script type="module" src="../design-system/components/labs-overlay.js"></script>
<script type="module" src="../design-system/components/labs-input-card.js"></script>
<script type="module" src="../design-system/components/labs-button.js"></script>
<script type="module" src="../design-system/components/labs-icon.js"></script>
<script type="module" src="../design-system/components/labs-toast.js"></script>
```

### Early Theme Initialization

```javascript
<script>
  (function () {
    var root = document.documentElement;
    var flavor = localStorage.getItem('note-flavor') || 'blueberry';
    var theme = localStorage.getItem('note-theme') || 'light';
    root.classList.remove('flavor-blueberry', 'flavor-strawberry', 'flavor-vanilla');
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add('flavor-' + flavor);
    root.classList.add('theme-' + theme);
    root.setAttribute('data-color-scheme', theme);
  })();
</script>
```

### Basic HTML Structure

```html
<labs-container small>
  <labs-template-header-wrapped>
    <span slot="title">Note</span>
  </labs-template-header-wrapped>

  <!-- Main note display -->
  <labs-metric-card id="noteCard">
    <span slot="label" id="noteLabel">Today's Note</span>
    <span slot="value" id="noteContent">No note yet</span>
  </labs-metric-card>

  <!-- Edit overlay - using textarea like Today-List pattern -->
  <labs-overlay id="editOverlay">
    <div style="padding: var(--space-md);">
      <h2>Edit Note</h2>
      <!-- Simple textarea - not labs-input-card for multiline (Today-List pattern) -->
      <textarea id="noteTextArea" placeholder="Enter your note..." 
                style="width: 100%; min-height: 150px; padding: var(--space-sm); 
                       border: 1px solid var(--color-outline); border-radius: var(--radius-md);
                       font-family: var(--font-family-base); font-size: var(--font-size-body);"></textarea>
      <div style="display: flex; gap: var(--space-md); margin-top: var(--space-md);">
        <labs-button id="cancelBtn">Cancel</labs-button>
        <labs-button id="saveBtn" variant="primary">Save</labs-button>
      </div>
    </div>
  </labs-overlay>

  <!-- Label edit overlay -->
  <labs-overlay id="labelOverlay">
    <div style="padding: var(--space-md);">
      <h2>Edit Label</h2>
      <!-- Use labs-input-card for single-line label (Today-List pattern) -->
      <labs-input-card id="labelInput" placeholder="Enter label..."></labs-input-card>
      <div style="display: flex; gap: var(--space-md); margin-top: var(--space-md);">
        <labs-button id="resetLabelBtn">Reset</labs-button>
        <labs-button id="saveLabelBtn" variant="primary">Save</labs-button>
      </div>
    </div>
  </labs-overlay>
</labs-container>

<labs-footer-with-settings elevated></labs-footer-with-settings>

<!-- Toast for undo (Today-List pattern) -->
<labs-toast id="undoToast">
  <span slot="message">Note cleared</span>
  <labs-button slot="action" size="small">Undo</labs-button>
</labs-toast>

<script type="module" src="./js/main.js"></script>
```

**Key points from Today-List app**:
- Use plain `<textarea>` for multiline text input (inside overlay)
- Use `labs-input-card` for single-line inputs (like label)
- Toast with undo button for destructive actions
- Overlays wrap custom content

### JavaScript Template

```javascript
import { applyTheme } from '../design-system/utils/theme.js';

// Data store
const store = {
  getNote() {
    const today = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`note-${today}`);
  },
  
  saveNote(text) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`note-${today}`, text);
  },
  
  getLabel() {
    return localStorage.getItem('note-label') || "Today's Note";
  },
  
  saveLabel(text) {
    localStorage.setItem('note-label', text);
  }
};

// UI state
let currentNote = '';
let previousNote = '';

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  // Apply theme from localStorage
  const flavor = localStorage.getItem('note-flavor') || 'blueberry';
  const theme = localStorage.getItem('note-theme') || 'light';
  applyTheme({ flavor, theme });

  // Load initial data
  loadNote();
  loadLabel();

  // Setup event listeners
  setupFooterEvents();
  setupOverlayEvents();
});

// Load note and update display
function loadNote() {
  currentNote = store.getNote() || '';
  updateDisplay();
}

// Load label and update display
function loadLabel() {
  const label = store.getLabel();
  document.getElementById('noteLabel').textContent = label;
}

// Update note display
function updateDisplay() {
  const content = document.getElementById('noteContent');
  content.textContent = currentNote || 'No note yet';
}

// Setup footer events
function setupFooterEvents() {
  const footer = document.querySelector('labs-footer-with-settings');
  
  footer.addEventListener('add', openEditOverlay);
  footer.addEventListener('reset-all', clearNote);
  footer.addEventListener('flavor-changed', (e) => {
    applyTheme({ flavor: e.detail.flavor });
  });
}

// Setup overlay events
function setupOverlayEvents() {
  document.getElementById('noteCard').addEventListener('click', openEditOverlay);
  document.getElementById('saveBtn').addEventListener('click', saveNote);
  document.getElementById('cancelBtn').addEventListener('click', closeEditOverlay);
  
  document.getElementById('noteLabel').addEventListener('click', openLabelOverlay);
  document.getElementById('saveLabelBtn').addEventListener('click', saveLabel);
  document.getElementById('resetLabelBtn').addEventListener('click', resetLabel);
  
  document.getElementById('undoToast')
    .querySelector('labs-button')
    .addEventListener('click', undoClear);
}

// Open edit overlay
function openEditOverlay() {
  const overlay = document.getElementById('editOverlay');
  const textarea = document.getElementById('noteTextArea');
  overlay.setAttribute('open', '');
  textarea.value = currentNote;
  textarea.focus();
}

// Close edit overlay
function closeEditOverlay() {
  const overlay = document.getElementById('editOverlay');
  overlay.removeAttribute('open');
}

// Save note
function saveNote() {
  const textarea = document.getElementById('noteTextArea');
  const newNote = textarea.value.trim();
  previousNote = currentNote;
  currentNote = newNote;
  store.saveNote(currentNote);
  updateDisplay();
  closeEditOverlay();
}

// Clear note
function clearNote() {
  previousNote = currentNote;
  currentNote = '';
  store.saveNote('');
  updateDisplay();
  showUndoToast();
}

// Undo clear
function undoClear() {
  currentNote = previousNote;
  store.saveNote(currentNote);
  updateDisplay();
  hideUndoToast();
}

// Show undo toast
function showUndoToast() {
  const toast = document.getElementById('undoToast');
  toast.setAttribute('open', '');
  setTimeout(() => {
    toast.removeAttribute('open');
  }, 5000);
}

// Hide undo toast
function hideUndoToast() {
  const toast = document.getElementById('undoToast');
  toast.removeAttribute('open');
}

// Open label edit overlay
function openLabelOverlay() {
  const overlay = document.getElementById('labelOverlay');
  const input = document.getElementById('labelInput');
  overlay.setAttribute('open', '');
  input.setAttribute('value', store.getLabel());
}

// Close label overlay
function closeLabelOverlay() {
  const overlay = document.getElementById('labelOverlay');
  overlay.removeAttribute('open');
}

// Save label
function saveLabel() {
  const input = document.getElementById('labelInput');
  const newLabel = input.getAttribute('value') || "Today's Note";
  store.saveLabel(newLabel);
  loadLabel();
  closeLabelOverlay();
}

// Reset label
function resetLabel() {
  const input = document.getElementById('labelInput');
  input.setAttribute('value', "Today's Note");
  store.saveLabel("Today's Note");
  loadLabel();
  closeLabelOverlay();
}
```

### CSS Custom Properties (Used, Not Defined)

```css
/* All these come from design-system/tokens/* files */
--color-background         /* Page background */
--color-on-surface         /* Text color */
--color-primary            /* Primary accent color */
--color-surface            /* Card background */
--space-xs, --space-sm, --space-md, --space-lg, --space-xl
--radius-sm, --radius-lg
--font-family-base
--font-size-body, --font-size-h2
--elevation-1, --elevation-2

/* Tokens specific to each theme/flavor are handled by flavors.css */
```

### localStorage Keys

```javascript
// Note content for specific date
localStorage.getItem('note-2025-10-17')
localStorage.setItem('note-2025-10-17', 'My note content')

// Label customization
localStorage.getItem('note-label')
localStorage.setItem('note-label', 'Custom Label')

// Theme preferences
localStorage.getItem('note-flavor')  // 'blueberry' | 'strawberry' | 'vanilla'
localStorage.getItem('note-theme')   // 'light' | 'dark'
```

### Testing Checklist

```
Phase 1 - Components:
☐ Components load without 404s
☐ No console errors
☐ Theme initialization works
☐ Metric card displays
☐ Footer visible
☐ Overlays can open/close

Phase 2 - JavaScript:
☐ Note saves to localStorage
☐ Note loads on page reload
☐ Display updates when note changes
☐ Footer events fire
☐ Label saves and persists

Phase 3 - Features:
☐ Add note works
☐ Edit note works
☐ Clear note works
☐ Undo works
☐ Label edit works
☐ Theme toggle works
☐ All original features working

Phase 4 - Quality:
☐ Looks like footer-test reference
☐ Mobile responsive
☐ Keyboard accessible
☐ All themes/flavors work
☐ Deployed and tested live
```

### Useful Design System Utilities

```javascript
// From design-system/utils/theme.js
import { applyTheme } from '../design-system/utils/theme.js';

applyTheme({ 
  flavor: 'blueberry',    // 'blueberry' | 'strawberry' | 'vanilla'
  theme: 'light'          // 'light' | 'dark'
});

// From design-system/utils/date-format.js (if needed)
import { formatHuman } from '../design-system/utils/date-format.js';
```

### Component API Quick Reference

```javascript
// labs-overlay
overlay.setAttribute('open', '');
overlay.removeAttribute('open');

// labs-input-card
input.setAttribute('value', 'text');
input.getAttribute('value');

// labs-footer-with-settings
footer.addEventListener('add', handler);
footer.addEventListener('reset-all', handler);
footer.addEventListener('flavor-changed', (e) => { e.detail.flavor });

// labs-toast
toast.setAttribute('open', '');
toast.removeAttribute('open');

// labs-button
button.setAttribute('variant', 'primary');  // 'primary' | 'secondary' | 'destructive'
button.addEventListener('click', handler);

// labs-metric-card
card.querySelector('[slot="label"]').textContent = 'New label';
card.querySelector('[slot="value"]').textContent = 'New value';
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Theme not applying | Check early theme init script, run `applyTheme()` after components load |
| Overlay not opening | Use `setAttribute('open', '')` instead of `open` property |
| Components not loading | Verify paths are correct, check imports in console |
| Slots not updating | Use `textContent`, not `innerHTML` for text slots |
| Footer events not firing | Wire up listeners after DOMContentLoaded |
| localStorage not persisting | Use consistent key pattern: `note-YYYY-MM-DD` |
| Mobile layout broken | Use design system spacing (--space-*) instead of hardcoded values |

---

## Files Reference

| File | Purpose | Size Target |
|------|---------|-------------|
| `docs/note/index.html` | Main page | ~120 lines |
| `docs/note/js/main.js` | Core logic | ~100-120 lines |
| `design-system/tokens/colors.css` | Color tokens | (reference) |
| `design-system/styles/flavors.css` | Theme definitions | (reference) |
| `design-system/utils/theme.js` | Theme utilities | (reference) |
| `docs/footer-test/index.html` | Reference template | (reference) |

---

## Commit Messages

```
Phase 1:
git commit -m "feat(note): Create HTML template from design system components

- New index.html based on footer-test reference pattern
- Import all design system tokens and components
- Early theme initialization to prevent FOUC
- 120 lines, zero custom CSS"

Phase 2:
git commit -m "feat(note): Modernize JavaScript using design system utilities

- Refactor main.js with clean data store
- Use applyTheme() from design system
- Wire footer events for add/reset/flavor
- 100+ lines, all core functionality working"

Phase 3:
git commit -m "feat(note): Restore all features with design system components

- Add/edit note with overlay
- Label customization
- Undo functionality with toast
- Full feature parity with original"

Phase 4:
git commit -m "style(note): Polish and accessibility improvements

- Visual consistency with design system
- Accessibility audit and fixes
- Mobile responsiveness verified
- All browsers tested"

Deployment:
git commit -m "chore(note): Deploy migration to GitHub Pages"
```

---

**Status**: ✅ Ready for Phase 1  
**Next**: Create new `index.html` from footer-test template
