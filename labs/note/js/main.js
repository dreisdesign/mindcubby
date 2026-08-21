/**
 * Note App - Daily note with theme support
 * Rebuilt with design system components and overlay editing
 * Version: 4.0.0
 */

// Settings
const settings = {
  resetEnabled: true
};

// Data Store
const store = {
  getNote() {
    const today = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`note-${today}`) || '';
  },

  saveNote(text) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`note-${today}`, text);
    // Update last edited time
    localStorage.setItem(`note-${today}-lastEdited`, new Date().toISOString());
  },

  getLastEditedTime() {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = localStorage.getItem(`note-${today}-lastEdited`);
    return timestamp ? new Date(timestamp) : null;
  },

  isResetEnabled() {
    return localStorage.getItem('note-reset-enabled') !== 'false';
  },

  setResetEnabled(enabled) {
    localStorage.setItem('note-reset-enabled', enabled ? 'true' : 'false');
  },

  isExpanded() {
    return localStorage.getItem('note-expanded') === 'true';
  },

  setExpanded(expanded) {
    localStorage.setItem('note-expanded', expanded ? 'true' : 'false');
  }
};

// UI State
let currentNote = '';
let lastClearedNote = '';

// Element references
const noteInputCard = document.getElementById('noteInputCard');
const footer = document.getElementById('footer');
const undoToast = document.getElementById('undoToast');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  cleanupOldNotes();
  setupEventListeners();
  loadNote();
});

// Clean up notes from previous days
function cleanupOldNotes() {
  const today = new Date().toISOString().split('T')[0];
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('note-') && key !== `note-${today}` && key !== 'note-label' && key !== 'note-flavor' && key !== 'note-theme' && key !== 'note-reset-enabled' && key !== 'note-expanded') {
      localStorage.removeItem(key);
    }
  });
}

// Load note from localStorage and update display
function loadNote() {
  currentNote = store.getNote();
  updateNoteDisplay();
  restoreExpandedState();
}

// Update note display
function updateNoteDisplay() {
  // Update input card with current note using component method
  if (noteInputCard && noteInputCard.setValue) {
    noteInputCard.setValue(currentNote);
  }

  // Update timestamp to last edited time
  if (noteInputCard && noteInputCard.setTimestamp) {
    const lastEdited = store.getLastEditedTime();
    noteInputCard.setTimestamp(lastEdited || new Date());
  }
}

// Setup event listeners
function setupEventListeners() {
  // Input card events - listen for auto-save and reset
  noteInputCard.addEventListener('autosave', onAutoSave);
  noteInputCard.addEventListener('reset', clearAllNotes);
  noteInputCard.addEventListener('expanded-changed', onExpandedChanged);

  // Footer events
  footer.addEventListener('reset-all', clearAllNotes);
  footer.addEventListener('flavor-changed', (e) => {
    // Save flavor to localStorage when settings card flavor changes
    const flavor = e.detail?.flavor;
    if (flavor) {
      localStorage.setItem('note-flavor', flavor);
    }
    // Also save current theme
    const isDark = document.documentElement.classList.contains('theme-dark');
    localStorage.setItem('note-theme', isDark ? 'dark' : 'light');
  });

  // Watch for theme changes and persist to localStorage
  const observer = new MutationObserver(() => {
    const isDark = document.documentElement.classList.contains('theme-dark');
    const isLight = document.documentElement.classList.contains('theme-light');
    if (isDark || isLight) {
      localStorage.setItem('note-theme', isDark ? 'dark' : 'light');
    }
    // Also watch for flavor changes
    const flavorClass = Array.from(document.documentElement.classList).find(c => c.startsWith('flavor-'));
    if (flavorClass) {
      const flavor = flavorClass.replace('flavor-', '');
      localStorage.setItem('note-flavor', flavor);
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  // Toast undo action
  undoToast.addEventListener('action', undoClear);
}

// Handle auto-save from input card (triggered on input with debounce)
function onAutoSave(e) {
  const newText = e.detail?.value || '';
  const trimmedText = newText.trim();

  console.log('onAutoSave called with:', { newText, trimmedText, currentNote });

  if (!trimmedText) {
    // Empty text - clear the note
    if (currentNote !== '') {
      console.log('Clearing note (empty text)');
      currentNote = '';
      store.saveNote(currentNote);
    }
    return;
  }

  // Only save if text changed
  if (trimmedText !== currentNote) {
    console.log('Saving auto-save text:', trimmedText);
    currentNote = trimmedText;
    store.saveNote(currentNote);
  }
}

function clearAllNotes() {
  lastClearedNote = currentNote;
  currentNote = '';
  store.saveNote('');
  updateNoteDisplay();
  showUndoToast('Note cleared');
}

function undoClear() {
  currentNote = lastClearedNote;
  store.saveNote(currentNote);
  updateNoteDisplay();
}

// Handle expand/collapse toggle
function onExpandedChanged(e) {
  const displayArea = document.querySelector('.note-display-area');
  const container = document.querySelector('labs-container');

  if (displayArea && container) {
    if (e.detail.expanded) {
      displayArea.classList.add('expanded');
      container.setAttribute('fill', '');
      store.setExpanded(true);
    } else {
      displayArea.classList.remove('expanded');
      container.removeAttribute('fill');
      store.setExpanded(false);
    }
  }
}

// Restore expanded state from localStorage
function restoreExpandedState() {
  if (store.isExpanded() && noteInputCard) {
    // Set the component to expanded state
    noteInputCard.setAttribute('expanded', '');
    // Trigger the expanded change in the layout
    const displayArea = document.querySelector('.note-display-area');
    const container = document.querySelector('labs-container');
    if (displayArea && container) {
      displayArea.classList.add('expanded');
      container.setAttribute('fill', '');
    }
  }
}

// Toast notification
function showUndoToast(message) {
  undoToast.show(message, { actionText: 'Undo', duration: 5000 });
}