// Today-List App - Simplified with Design System
import { applyTheme } from '../../design-system/utils/theme.js';
import { formatHuman } from '../../design-system/utils/date-format.js';

const STORAGE_KEY = 'today-list-items-v2';

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
    }
};

// Toast singleton
let _toastInstance = null;
let _currentUndoHandler = null;

function getToast() {
    if (!_toastInstance) {
        _toastInstance = document.createElement('labs-toast');
        document.body.appendChild(_toastInstance);
    }
    return _toastInstance;
}

function showUndoToast(message, onUndo) {
    const toast = getToast();

    if (_currentUndoHandler) {
        toast.removeEventListener('action', _currentUndoHandler);
        _currentUndoHandler = null;
    }

    _currentUndoHandler = () => {
        onUndo();
        _currentUndoHandler = null;
    };

    toast.setAttribute('variant', 'destructive');
    toast.show(message, { actionText: 'Undo', duration: 5000 });
    toast.addEventListener('action', _currentUndoHandler, { once: true });
}

// Debounce flag for reset-all
let _isResetting = false;

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

// Export items as CSV
function exportAsCSV() {
    // Export all items (includes completed and active)
    const items = store.items || [];

    if (items.length === 0) {
        getToast().show('No items to export', { variant: 'secondary', duration: 3000 });
        return;
    }

    // CSV headers matching expectation: Timestamp, Status, Item Text
    const headers = ['Timestamp', 'Status', 'Item Text'];

    // CSV rows
    const rows = items.map(item => {
        // Format timestamp to match Tracker app (human readable)
        let timestamp = item.timestamp ? formatHuman(item.timestamp) : '';
        timestamp = `"${(timestamp || '').replace(/"/g, '""')}"`;

        const status = item.checked ? 'Completed' : '';
        // Escape quotes by doubling them, wrap in quotes to preserve commas/newlines
        const text = `"${(item.text || '').replace(/"/g, '""')}"`;
        return `${timestamp},${status},${text}`;
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Download
    link.setAttribute('href', url);
    link.setAttribute('download', `today-list-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const toast = getToast();
    toast.setAttribute('variant', 'secondary');
    toast.show('All items have been exported as a CSV', { actionText: null, duration: 3000 });
}

// Input overlay management
function toggleInputOverlay(open = true) {
    const overlay = document.getElementById('input-overlay');
    const inputCard = overlay?.querySelector('labs-input-card');

    if (!overlay || !inputCard) return;

    if (open) {
        overlay.setAttribute('open', '');
        inputCard.setAttribute('value', '');
        // Use requestAnimationFrame for optimal timing after DOM update
        requestAnimationFrame(() => {
            const inputEl = inputCard.shadowRoot?.querySelector('input, textarea');
            if (inputEl) inputEl.value = '';
            // Second frame ensures layout is complete
            requestAnimationFrame(() => {
                inputEl?.focus();
            });
        });
    } else {
        overlay.removeAttribute('open');
    }
}

// Helper: Check if a timestamp is from today
function isToday(timestamp) {
    const today = new Date();
    const date = new Date(timestamp);
    return today.toDateString() === date.toDateString();
}

// Helper: Get date string for grouping
function getDateString(timestamp) {
    return new Date(timestamp).toDateString();
}

// Helper: Format date for display
function formatDateLabel(dateStr) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toDateString()) return 'Today';
    if (dateStr === yesterday.toDateString()) return 'Yesterday';

    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Render everything
function renderAll() {
    // Update metric (count TODAY'S active items only)
    const todayActiveItems = store.items.filter(item => !item.archived && isToday(item.timestamp));
    const metricCard = document.getElementById('todo-metric');
    const valueSlot = metricCard?.querySelector('[slot="value"]');
    if (valueSlot) {
        valueSlot.textContent = todayActiveItems.length;
    }

    // Update reset-all button disabled state
    updateResetButtonState();

    // Render today's section
    renderTodaySection();

    // Render past days section
    renderPastDaysSection();
}

// Render Today's tasks (always visible)
function renderTodaySection() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    list.innerHTML = '';

    const todayItems = store.items.filter(item => isToday(item.timestamp));
    const todayActive = todayItems.filter(item => !item.archived);
    const todayArchived = todayItems.filter(item => item.archived);

    // Show welcome card if no tasks today
    if (todayItems.length === 0) {
        const card = document.createElement('labs-card');
        card.setAttribute('variant', 'welcome');

        const header = document.createElement('div');
        header.setAttribute('slot', 'header');
        header.textContent = 'Welcome to Today-List';
        card.appendChild(header);

        const desc = document.createElement('div');
        desc.setAttribute('slot', 'description');
        desc.textContent = 'Add your first task to get started.';
        card.appendChild(desc);

        const addButton = document.createElement('labs-button');
        addButton.setAttribute('slot', 'actions');
        addButton.setAttribute('variant', 'primary');
        addButton.setAttribute('pill', '');
        addButton.innerHTML = '<labs-icon slot="icon-left" name="add"></labs-icon>Add First Task';
        addButton.addEventListener('click', () => toggleInputOverlay(true));
        card.appendChild(addButton);

        list.appendChild(card);
        return;
    }

    // Render today's active tasks with drag-drop support
    todayActive.forEach((item, index) => {
        const li = createTodoItem(item, false); // false = not from past
        li.setAttribute('draggable', 'true');
        li.setAttribute('data-index', index);

        if (pendingDropAnimation) {
            li.style.animation = 'none';
            requestAnimationFrame(() => {
                li.style.animation = 'today-list-drop 220ms ease-out';
            });
        }

        setupDragHandlers(li, item, index, todayActive);
        list.appendChild(li);
    });

    if (pendingDropAnimation) {
        pendingDropAnimation = false;
    }

    // Render today's archived tasks in collapsed <details>
    if (todayArchived.length > 0) {
        const details = document.createElement('labs-details');
        details.setAttribute('archived', '');
        const summaryText = document.createTextNode(`Today — ${todayArchived.length} archived ${todayArchived.length === 1 ? 'task' : 'tasks'}`);
        details.appendChild(summaryText);

        const contentWrapper = document.createElement('div');
        contentWrapper.setAttribute('slot', 'content');
        contentWrapper.style.display = 'flex';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.gap = 'var(--space-md)';

        todayArchived.forEach(item => {
            const li = createTodoItem(item, false);
            contentWrapper.appendChild(li);
        });

        details.appendChild(contentWrapper);
        list.appendChild(details);
    }
}

// Render past days section (each day in collapsed <details>)
function renderPastDaysSection() {
    const archivedSection = document.getElementById('archived-section');
    if (!archivedSection) return;

    archivedSection.innerHTML = '';

    // Get all items NOT from today
    const pastItems = store.items.filter(item => !isToday(item.timestamp));

    if (pastItems.length === 0) {
        return;
    }

    // Group by date
    const groups = {};
    pastItems.forEach(item => {
        const dateStr = getDateString(item.timestamp);
        if (!groups[dateStr]) {
            groups[dateStr] = { active: [], archived: [] };
        }
        if (item.archived) {
            groups[dateStr].archived.push(item);
        } else {
            groups[dateStr].active.push(item);
        }
    });

    // Sort dates descending (most recent first)
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    // Create <details> for each past day
    sortedDates.forEach(dateStr => {

        const group = groups[dateStr];
        const totalCount = group.active.length + group.archived.length;

        const details = document.createElement('labs-details');
        details.setAttribute('archived', '');

        // Summary: "Yesterday — 4 tasks" or "Fri Oct 10 2025 — 4 tasks"
        const summaryText = document.createTextNode(
            `${formatDateLabel(dateStr)} — ${totalCount} ${totalCount === 1 ? 'task' : 'tasks'}`
        );
        details.appendChild(summaryText);

        // Content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.setAttribute('slot', 'content');
        contentWrapper.style.display = 'flex';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.gap = 'var(--space-md)';

        // Render active tasks first
        group.active.forEach(item => {
            const li = createTodoItem(item, true); // true = from past
            contentWrapper.appendChild(li);
        });

        // Render archived tasks (slightly muted)
        group.archived.forEach(item => {
            const li = createTodoItem(item, true);
            li.style.opacity = '0.7';
            contentWrapper.appendChild(li);
        });

        details.appendChild(contentWrapper);
        archivedSection.appendChild(details);
    });
}

function createTodoItem(item, isPast = false) {
    const li = document.createElement('labs-list-item');
    li.setAttribute('variant', 'task');
    if (item.checked) li.setAttribute('checked', '');
    if (item.archived) li.setAttribute('state', 'archived');

    // Checkbox in control slot
    const checkbox = document.createElement('labs-checkbox');
    checkbox.setAttribute('slot', 'control');
    if (item.checked) checkbox.setAttribute('checked', '');
    // Disable checkbox for archived or past items
    if (item.archived || isPast) {
        checkbox.setAttribute('disabled', '');
        checkbox.style.pointerEvents = 'none';
    }
    li.appendChild(checkbox);

    // Todo text in content slot
    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    content.textContent = item.text || '';
    li.appendChild(content);

    // Use labs-dropdown for all tasks (today, archived, and past)
    const dropdown = document.createElement('labs-dropdown');
    dropdown.setAttribute('slot', 'actions');

    // Set archived attribute if item is archived (changes Archive → Restore)
    if (item.archived) {
        dropdown.setAttribute('archived', '');
    }

    // For past items, show only restore and delete; for today, show archive/restore and delete
    if (isPast) {
        dropdown.setAttribute('only', 'restore,delete');
    } else {
        dropdown.setAttribute('only', item.archived ? 'archive,delete' : 'archive,delete');
    }

    // Attach click handler only for today’s active (not archived) items
    const isTodayActive = !isPast && !item.archived;
    if (isTodayActive) {
        li.addEventListener('click', (e) => {
            if (e.target.closest('labs-dropdown')) return;
            item.checked = !item.checked;
            store.save();
            renderAll();
        });
    }

    // Restore handler for past items or archived today
    if (isPast || item.archived) {
        dropdown.addEventListener('restore', () => {
            if (isPast) {
                // Restore to today (copy)
                const newItem = {
                    id: Date.now().toString(),
                    text: item.text,
                    checked: false,
                    archived: false,
                    timestamp: Date.now()
                };
                store.items.unshift(newItem);
                store.save();
                renderAll();
                showUndoToast('Task restored to today', () => {
                    store.items = store.items.filter(x => x.id !== newItem.id);
                    store.save();
                    renderAll();
                });
            } else {
                // Restore archived today
                const idx = store.items.findIndex(x => x.id === item.id);
                const wasArchived = item.archived;
                item.archived = false;
                store.save();
                renderAll();
                showUndoToast('Task restored', () => {
                    store.items[idx].archived = wasArchived;
                    store.save();
                    renderAll();
                });
            }
        });
    }

    // Archive handler for today’s active (not archived) items
    if (!isPast && !item.archived) {
        dropdown.addEventListener('archive', () => {
            const idx = store.items.findIndex(x => x.id === item.id);
            const wasArchived = item.archived;
            item.archived = true;
            store.save();
            renderAll();
            showUndoToast('Task archived', () => {
                store.items[idx].archived = wasArchived;
                store.save();
                renderAll();
            });
        });
    }

    // Delete handler (all cases)
    dropdown.addEventListener('remove', () => {
        const removedItem = { ...item };
        const removedIndex = store.items.findIndex(x => x.id === item.id);
        store.items = store.items.filter(x => x.id !== item.id);
        store.save();
        renderAll();
        showUndoToast('Task deleted', () => {
            store.items.splice(removedIndex, 0, removedItem);
            store.save();
            renderAll();
        });
    });

    li.appendChild(dropdown);

    return li;
}

// Drag-drop reordering for today's active items
let draggedItemIndex = null;
let draggedItemId = null;
let pendingDropAnimation = false;

function setupDragHandlers(li, item, index, todayActive) {
    li.addEventListener('dragstart', (e) => {
        draggedItemIndex = index;
        draggedItemId = item.id;
        li.setAttribute('dragging', '');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
    });

    li.addEventListener('dragend', () => {
        li.removeAttribute('dragging');
        document.querySelectorAll('[data-index]').forEach(el => el.removeAttribute('drag-over'));
        draggedItemIndex = null;
        draggedItemId = null;
    });

    li.addEventListener('dragover', (e) => {
        if (draggedItemIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        li.setAttribute('drag-over', '');
    });

    li.addEventListener('dragleave', () => {
        li.removeAttribute('drag-over');
    });

    li.addEventListener('drop', (e) => {
        if (draggedItemId === null) return;
        e.preventDefault();
        e.stopPropagation();

        const todayItemsInStore = store.items.filter(
            storeItem => !storeItem.archived && isToday(storeItem.timestamp)
        );

        const draggedId = draggedItemId;
        const targetId = item.id;

        if (!draggedId || !targetId || draggedId === targetId) {
            return;
        }

        const draggedIdx = todayItemsInStore.findIndex(it => it.id === draggedId);
        if (draggedIdx === -1) return;

        const dropIndex = Number(li.getAttribute('data-index'));
        if (Number.isNaN(dropIndex)) return;

        const [draggedItem] = todayItemsInStore.splice(draggedIdx, 1);

        let insertIdx = dropIndex;
        if (draggedIdx < dropIndex) {
            insertIdx = dropIndex;
        }

        if (insertIdx < 0) {
            insertIdx = 0;
        }

        if (insertIdx > todayItemsInStore.length) {
            insertIdx = todayItemsInStore.length;
        }

        todayItemsInStore.splice(insertIdx, 0, draggedItem);

        // Update the master store.items array
        const otherItems = store.items.filter(
            storeItem => storeItem.archived || !isToday(storeItem.timestamp)
        );
        store.items = [...todayItemsInStore, ...otherItems];
        store.save();
        pendingDropAnimation = true;
        renderAll();
    });
}

function triggerDropAnimation() {
    const listSection = document.getElementById('todo-list');
    if (!listSection) return;

    listSection.setAttribute('data-drop-animating', '');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            listSection.removeAttribute('data-drop-animating');
        });
    });
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Apply theme
    applyTheme({
        flavor: localStorage.getItem('today-list-flavor') || 'blueberry',
        theme: localStorage.getItem('today-list-theme') || 'light'
    });

    // Load and render
    store.load();
    customElements.whenDefined('labs-metric-card').then(renderAll);

    // Wire up footer
    const footer = document.querySelector('labs-footer-with-settings');
    if (footer) {
        footer.addEventListener('add', () => toggleInputOverlay(true));

        footer.addEventListener('reset-all', () => {
            // Don't reset if no items
            if (store.items.length === 0) return;

            if (_isResetting) return;
            _isResetting = true;

            const backup = [...store.items];
            const count = backup.length;
            store.items = [];
            store.save();
            renderAll();

            const message = `${count} ${count === 1 ? 'task' : 'tasks'} deleted`;
            showUndoToast(message, () => {
                store.items = backup;
                store.save();
                renderAll();
            });

            setTimeout(() => {
                _isResetting = false;
            }, 100);
        });

        // Save flavor to localStorage when settings card flavor changes
        footer.addEventListener('flavor-changed', (e) => {
            const flavor = e.detail?.flavor;
            if (flavor) {
                localStorage.setItem('today-list-flavor', flavor);
            }
            // Also save current theme
            const isDark = document.documentElement.classList.contains('theme-dark');
            localStorage.setItem('today-list-theme', isDark ? 'dark' : 'light');
        });

        // Watch for theme changes and persist to localStorage
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('theme-dark');
            const isLight = document.documentElement.classList.contains('theme-light');
            if (isDark || isLight) {
                localStorage.setItem('today-list-theme', isDark ? 'dark' : 'light');
            }
            // Also watch for flavor changes
            const flavorClass = Array.from(document.documentElement.classList).find(c => c.startsWith('flavor-'));
            if (flavorClass) {
                const flavor = flavorClass.replace('flavor-', '');
                localStorage.setItem('today-list-flavor', flavor);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        // Add a simple Export CSV button (POC).
        // This injects the button into the footer's actions slot.
        try {
            const footer = document.querySelector('labs-footer-with-settings');
            if (footer) {
                const exportBtn = document.createElement('labs-button');
                exportBtn.setAttribute('slot', 'left');
                exportBtn.setAttribute('variant', 'icon');
                exportBtn.setAttribute('size', 'large');
                exportBtn.setAttribute('aria-label', 'Export CSV');
                exportBtn.style.paddingLeft = '12px';
                exportBtn.innerHTML = '<labs-icon slot="icon-left" name="download" width="28" height="28"></labs-icon>';
                exportBtn.addEventListener('click', exportAsCSV);
                footer.appendChild(exportBtn);
            } else {
                // Fallback if footer not found
                const exportBtn = document.createElement('labs-button');
                exportBtn.setAttribute('variant', 'secondary');
                exportBtn.setAttribute('pill', '');
                exportBtn.textContent = 'Export CSV';
                exportBtn.style.position = 'fixed';
                exportBtn.style.right = '16px';
                exportBtn.style.bottom = '84px';
                exportBtn.style.zIndex = '9999';
                exportBtn.style.boxShadow = 'var(--elevation-2, 0 4px 8px rgba(0,0,0,0.12))';
                exportBtn.addEventListener('click', exportAsCSV);
                document.body.appendChild(exportBtn);
            }
        } catch (err) {
            console.warn('Export button injection failed:', err);
        }
    }

    // Wire up input overlay
    const inputOverlay = document.getElementById('input-overlay');
    const inputCard = inputOverlay?.querySelector('labs-input-card');

    if (inputCard) {
        inputCard.addEventListener('save', (e) => {
            const text = e.detail?.value?.trim();
            if (text) {
                store.items.unshift({
                    id: Date.now().toString(),
                    text,
                    checked: false,
                    archived: false,
                    timestamp: Date.now()
                });
                store.save();
                renderAll();
            }
            // Always clear the input field after save
            setTimeout(() => {
                const inputEl = inputCard.shadowRoot?.querySelector('input, textarea');
                if (inputEl) inputEl.value = '';
            }, 50);
            toggleInputOverlay(false);
        });

        inputCard.addEventListener('close', () => toggleInputOverlay(false));
    }

    // Close overlay on backdrop click
    if (inputOverlay) {
        inputOverlay.addEventListener('click', (e) => {
            if (e.target === inputOverlay) toggleInputOverlay(false);
        });
    }
});
