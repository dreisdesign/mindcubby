// Tracker App - Simplified with Design System

// Simple date formatter for CSV export
function formatHuman(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}

const STORAGE_KEY = 'tracker-items';

// ...existing code...

// Helper to get date string (YYYY-MM-DD) from timestamp using local timezone
function getDateString(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper to get today's date string using local timezone
function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper to format date for display (e.g., "Nov 9")
function formatDateDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const opts = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, opts);
}

// Data store
const store = {
    items: [],
    load() {
        try {
            this.items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            this.items = [];
        }
    },
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    },
    // Get items grouped by date
    getItemsByDate() {
        const grouped = {};
        this.items.forEach(item => {
            const dateStr = getDateString(item.ts);
            if (!grouped[dateStr]) {
                grouped[dateStr] = [];
            }
            grouped[dateStr].push(item);
        });
        return grouped;
    },
    // Get today's items
    getTodayItems() {
        const today = getTodayString();
        return this.items.filter(item => getDateString(item.ts) === today);
    },
    // Get previous days totals (excluding today)
    getPreviousDayTotals() {
        const today = getTodayString();
        const grouped = this.getItemsByDate();
        const totals = [];

        Object.keys(grouped)
            .filter(dateStr => dateStr !== today)
            .sort((a, b) => b.localeCompare(a)) // Most recent first
            .forEach(dateStr => {
                totals.push({
                    date: dateStr,
                    count: grouped[dateStr].length,
                    displayDate: formatDateDisplay(dateStr)
                });
            });

        return totals;
    }
};

// Get or create toast (singleton)
let _toastInstance = null;
let _currentUndoHandler = null;

function getToast() {
    if (!_toastInstance) {
        _toastInstance = document.createElement('labs-toast');
        document.body.appendChild(_toastInstance);
    }
    return _toastInstance;
}

// Debounce flag for reset-all to prevent duplicate events

// Show undo toast - cleans up previous handler first
function showUndoToast(message, onUndo) {
    const toast = getToast();

    // Remove old handler if it exists
    if (_currentUndoHandler) {
        toast.removeEventListener('action', _currentUndoHandler);
        _currentUndoHandler = null;
    }

    // Create new handler
    _currentUndoHandler = () => {
        onUndo();
        _currentUndoHandler = null; // Clear after use
    };

    toast.setAttribute('variant', 'destructive');
    toast.show(message, { actionText: 'Undo', duration: 5000 });
    toast.addEventListener('action', _currentUndoHandler, { once: true });
}

// Update reset-all button disabled state
function updateResetButtonState() {
    const footer = document.querySelector('labs-footer-with-settings');
    const settingsCard = footer?.shadowRoot?.querySelector('labs-settings-card');
    const resetButton = settingsCard?.shadowRoot?.getElementById('reset-all-btn');
    if (resetButton) {
        if (store.items.length === 0) {
            resetButton.setAttribute('disabled', '');
        } else {
            resetButton.removeAttribute('disabled');
        }
    }
}

// Render everything
function renderAll() {
    const todayItems = store.getTodayItems();

    // Update metric to show today's count
    const metricCard = document.getElementById('tracker-metric');
    const valueSlot = metricCard?.querySelector('[slot="value"]');
    if (valueSlot) {
        valueSlot.textContent = todayItems.length;
    }

    // Update reset-all button disabled state
    updateResetButtonState();

    // Update Clear Archived button visibility
    const clearArchivedBtn = document.getElementById('clear-archived-btn');
    const archivedItems = store.items.filter(item => item.archived);
    if (clearArchivedBtn) {
        if (archivedItems.length > 0) {
            clearArchivedBtn.removeAttribute('hidden');
        } else {
            clearArchivedBtn.setAttribute('hidden', '');
        }
    }

    // Render list
    const list = document.getElementById('entry-list');
    if (!list) return;

    list.innerHTML = '';

    // If no items at all
    if (store.items.length === 0) {
        const card = document.createElement('labs-card');
        card.setAttribute('variant', 'welcome');
        card.setAttribute('align', 'center');

        const header = document.createElement('div');
        header.setAttribute('slot', 'header');
        header.textContent = 'Welcome to Tracker!';
        card.appendChild(header);

        const desc = document.createElement('div');
        desc.textContent = 'Track your first entry to get started.';
        card.appendChild(desc);

        const addBtn = document.createElement('labs-button');
        addBtn.setAttribute('slot', 'actions');
        addBtn.setAttribute('variant', 'primary');
        addBtn.setAttribute('pill', '');
        addBtn.innerHTML = '<labs-icon slot="icon-left" name="add"></labs-icon>Track first entry';
        addBtn.addEventListener('click', () => {
            store.items.unshift({ ts: Date.now(), note: '' });
            store.save();
            renderAll();
        });
        card.appendChild(addBtn);

        list.appendChild(card);
        return;
    }

    // If no items today but have previous days
    if (todayItems.length === 0 && store.items.length > 0) {
        const card = document.createElement('labs-card');
        card.setAttribute('variant', 'welcome');
        card.setAttribute('align', 'center');

        const header = document.createElement('div');
        header.setAttribute('slot', 'header');
        header.textContent = 'Start Today!';
        card.appendChild(header);

        const desc = document.createElement('div');
        desc.textContent = 'Track your first entry for today.';
        card.appendChild(desc);

        const addBtn = document.createElement('labs-button');
        addBtn.setAttribute('slot', 'actions');
        addBtn.setAttribute('variant', 'primary');
        addBtn.setAttribute('pill', '');
        addBtn.innerHTML = '<labs-icon slot="icon-left" name="add"></labs-icon>Track first entry';
        addBtn.addEventListener('click', () => {
            store.items.unshift({ ts: Date.now(), note: '' });
            store.save();
            renderAll();
        });
        card.appendChild(addBtn);

        list.appendChild(card);
    }

    // Display today's items
    todayItems.forEach(item => {
        const li = document.createElement('labs-list-item');
        li.setAttribute('variant', 'text-only');

        const icon = document.createElement('labs-icon');
        icon.setAttribute('slot', 'control');
        icon.setAttribute('name', 'check');
        li.appendChild(icon);

        const content = document.createElement('span');
        content.setAttribute('slot', 'content');
        content.textContent = formatHuman(item.ts);
        li.appendChild(content);

        const dropdown = document.createElement('labs-dropdown');
        dropdown.setAttribute('slot', 'actions');
        dropdown.setAttribute('only', 'archive,delete');
        
        dropdown.addEventListener('archive', () => {
            const archivedItem = { ...item, archived: true };
            store.items = store.items.map(x => x.ts === item.ts ? archivedItem : x);
            store.save();
            renderAll();
            showUndoToast('Entry archived', () => {
                store.items = store.items.map(x => x.ts === item.ts ? item : x);
                store.save();
                renderAll();
            });
        });
        
        dropdown.addEventListener('remove', () => {
            const removedItem = item;
            const removedIndex = store.items.findIndex(x => x.ts === item.ts);
            store.items = store.items.filter(x => x.ts !== item.ts);
            store.save();
            renderAll();
            showUndoToast('Entry deleted', () => {
                store.items.splice(removedIndex, 0, removedItem);
                store.save();
                renderAll();
            });
        });
        li.appendChild(dropdown);

        list.appendChild(li);
    });

    // Display end-of-day summary using collapsible details section
    const previousDays = store.getPreviousDayTotals();
    if (previousDays.length > 0) {
        const detailsSection = document.createElement('labs-details');
        detailsSection.setAttribute('archived', '');
        detailsSection.style.marginTop = 'var(--space-md)';

        // Header text: "Previously tracked"
        const header = document.createTextNode('Previously tracked');
        detailsSection.appendChild(header);

        // Content section with summaries
        const prevContentDiv = document.createElement('div');
        prevContentDiv.setAttribute('slot', 'content');
        prevContentDiv.style.display = 'flex';
        prevContentDiv.style.flexDirection = 'column';
        prevContentDiv.style.gap = 'var(--space-sm)';

        previousDays.forEach(dayTotal => {
            // Check if it's yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

            const label = dayTotal.date === yesterdayStr ? 'Yesterday' : dayTotal.displayDate;
            const summaryText = `${label}: ${dayTotal.count} Total`;

            const summaryItem = document.createElement('div');
            summaryItem.style.padding = 'var(--space-sm) var(--space-md)';
            summaryItem.style.textAlign = 'center';
            summaryItem.style.color = 'var(--color-on-surface)';
            summaryItem.style.fontSize = 'var(--font-size-large)';
            summaryItem.style.opacity = '0.7';
            summaryItem.textContent = summaryText;

            prevContentDiv.appendChild(summaryItem);
        });

        detailsSection.appendChild(prevContentDiv);
        list.appendChild(detailsSection);
    }

    // Display archived items
    if (archivedItems.length > 0) {
        const archivedSection = document.createElement('labs-details');
        archivedSection.setAttribute('archived', '');
        archivedSection.style.marginTop = 'var(--space-lg)';

        // Header text: "Archived"
        const archivedHeader = document.createTextNode('Archived');
        archivedSection.appendChild(archivedHeader);

        // Content section with archived items
        const archivedContentDiv = document.createElement('div');
        archivedContentDiv.setAttribute('slot', 'content');
        archivedContentDiv.style.display = 'flex';
        archivedContentDiv.style.flexDirection = 'column';
        archivedContentDiv.style.gap = 'var(--space-sm)';

        archivedItems.forEach(item => {
            const li = document.createElement('labs-list-item');
            li.setAttribute('variant', 'text-only');

            const icon = document.createElement('labs-icon');
            icon.setAttribute('slot', 'control');
            icon.setAttribute('name', 'archive');
            li.appendChild(icon);

            const content = document.createElement('span');
            content.setAttribute('slot', 'content');
            content.textContent = formatHuman(item.ts);
            li.appendChild(content);

            const dropdown = document.createElement('labs-dropdown');
            dropdown.setAttribute('slot', 'actions');
            dropdown.setAttribute('archived', '');
            dropdown.setAttribute('only', 'restore,delete');
            
            dropdown.addEventListener('restore', () => {
                const restoredItem = { ...item, archived: false };
                store.items = store.items.map(x => x.ts === item.ts ? restoredItem : x);
                store.save();
                renderAll();
                showUndoToast('Entry restored', () => {
                    store.items = store.items.map(x => x.ts === item.ts ? item : x);
                    store.save();
                    renderAll();
                });
            });
            
            dropdown.addEventListener('remove', () => {
                const removedItem = item;
                const removedIndex = store.items.findIndex(x => x.ts === item.ts);
                store.items = store.items.filter(x => x.ts !== item.ts);
                store.save();
                renderAll();
                showUndoToast('Entry deleted', () => {
                    store.items.splice(removedIndex, 0, removedItem);
                    store.save();
                    renderAll();
                });
            });
            li.appendChild(dropdown);

            archivedContentDiv.appendChild(li);
        });

        archivedSection.appendChild(archivedContentDiv);
        list.appendChild(archivedSection);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Theme is now handled by ThemeManager.init() in HTML

    // Load and render
    store.load();
    customElements.whenDefined('labs-metric-card').then(renderAll);

    // Wire up Add button
    const addBtn = document.getElementById('add-item-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            store.items.unshift({ ts: Date.now(), note: '' });
            store.save();
            renderAll();
        });
    }

    // Wire up Clear Archived button
    const clearArchivedBtn = document.getElementById('clear-archived-btn');
    if (clearArchivedBtn) {
        clearArchivedBtn.addEventListener('click', () => {
            const archivedCount = store.items.filter(item => item.archived).length;
            if (archivedCount === 0) return;
            
            const backup = store.items.filter(item => item.archived);
            store.items = store.items.filter(item => !item.archived);
            store.save();
            renderAll();
            
            const message = `${archivedCount} ${archivedCount === 1 ? 'entry' : 'entries'} cleared`;
            showUndoToast(message, () => {
                store.items = [...store.items, ...backup].sort((a, b) => b.ts - a.ts);
                store.save();
                renderAll();
            });
        });
    }

    // Wire up footer
    const footer = document.querySelector('labs-footer-settings-wrapper');
    if (footer) {
        // Add button is wired directly in HTML
        
        footer.addEventListener('reset-all', () => {
            // Prevent duplicate reset-all events (component fires twice)
            if (_isResetting) return;
            _isResetting = true;

            // Don't reset if no items
            if (store.items.length === 0) {
                _isResetting = false;
                return;
            }

            const backup = [...store.items];
            const count = backup.length;
            store.items = [];
            store.save();
            renderAll();

            const message = `${count} ${count === 1 ? 'entry' : 'entries'} deleted`;
            showUndoToast(message, () => {
                store.items = backup;
                store.save();
                renderAll();
            });

            // Reset flag after a short delay to allow for any duplicate events
            setTimeout(() => {
                _isResetting = false;
            }, 100);
        });
    }
});

// Listen for theme and appearance changes
document.documentElement.addEventListener('theme-changed', (e) => {
    // Theme changed - tracker colors will update
});

document.documentElement.addEventListener('appearance-changed', (e) => {
    // Appearance changed - components will re-render
});

// ...existing code...
