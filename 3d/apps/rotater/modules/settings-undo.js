const SETTINGS_HISTORY_KEY = 'rotater-settings-history';
const MAX_HISTORY_SIZE = 50;

export function createSettingsUndoController() {
    let history = [];
    let currentIndex = -1;

    function loadHistory() {
        try {
            const storedHistory = localStorage.getItem(SETTINGS_HISTORY_KEY);
            if (storedHistory) {
                const parsed = JSON.parse(storedHistory);
                if (parsed.history && typeof parsed.currentIndex === 'number') {
                    history = parsed.history;
                    currentIndex = parsed.currentIndex;
                }
            }
        } catch (e) {
            console.error('[SettingsUndo] Failed to load history:', e);
            history = [];
            currentIndex = -1;
        }
    }

    function saveHistory() {
        try {
            const dataToStore = { history, currentIndex };
            localStorage.setItem(SETTINGS_HISTORY_KEY, JSON.stringify(dataToStore));
        } catch (e) {
            console.error('[SettingsUndo] Failed to save history:', e);
        }
    }

    function captureSnapshot(urlString) {
        if (!urlString) return;

        // If we are not at the end of the history, truncate it
        if (currentIndex < history.length - 1) {
            const truncatedCount = history.length - (currentIndex + 1);
            history = history.slice(0, currentIndex + 1);
            console.log(`[SettingsUndo] Truncated ${truncatedCount} future states after undo`);
        }

        // Avoid duplicate snapshots - don't capture if it matches the current position
        if (history.length > 0 && history[currentIndex] === urlString) {
            console.log(`[SettingsUndo] Snapshot identical to current position, skipping`);
            return;
        }

        // Avoid duplicate consecutive states
        if (history.length > 0 && history[history.length - 1] === urlString) {
            console.log(`[SettingsUndo] Snapshot identical to previous, skipping`);
            return;
        }

        history.push(urlString);
        console.log(`[SettingsUndo] Captured snapshot #${history.length - 1}`);

        // Limit history size
        if (history.length > MAX_HISTORY_SIZE) {
            history = history.slice(history.length - MAX_HISTORY_SIZE);
            currentIndex = Math.min(currentIndex, history.length - 1);
        }

        currentIndex = history.length - 1;
        saveHistory();
        console.log(`[SettingsUndo] History size: ${history.length}, currentIndex: ${currentIndex}`);
    }

    function undo() {
        if (currentIndex > 0) {
            currentIndex--;
            saveHistory();
            console.log(`[SettingsUndo] Undid to index ${currentIndex}`);
            return history[currentIndex];
        }
        console.log(`[SettingsUndo] Cannot undo, at beginning of history`);
        return null;
    }

    function redo() {
        if (currentIndex < history.length - 1) {
            currentIndex++;
            saveHistory();
            return history[currentIndex];
        }
        return null;
    }

    function hasUndo() {
        return currentIndex > 0;
    }

    function hasRedo() {
        const canRedo = currentIndex < history.length - 1;
        console.log(`[SettingsUndo] hasRedo check: currentIndex=${currentIndex}, historyLength=${history.length}, result=${canRedo}`);
        return canRedo;
    }

    function clearHistory() {
        history = [];
        currentIndex = -1;
        saveHistory();
    }

    loadHistory();

    return {
        captureSnapshot,
        undo,
        redo,
        hasUndo,
        hasRedo,
        clearHistory,
    };
}
