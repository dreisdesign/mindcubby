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
            history = [];
            currentIndex = -1;
        }
    }

    function saveHistory() {
        try {
            const dataToStore = { history, currentIndex };
            localStorage.setItem(SETTINGS_HISTORY_KEY, JSON.stringify(dataToStore));
        } catch (e) {
        }
    }

    function captureSnapshot(urlString) {
        if (!urlString) return;

        if (currentIndex < history.length - 1) {
            history = history.slice(0, currentIndex + 1);
        }

        if (history.length > 0 && history[currentIndex] === urlString) {
            return;
        }

        if (history.length > 0 && history[history.length - 1] === urlString) {
            return;
        }

        history.push(urlString);

        if (history.length > MAX_HISTORY_SIZE) {
            history = history.slice(history.length - MAX_HISTORY_SIZE);
            currentIndex = Math.min(currentIndex, history.length - 1);
        }

        currentIndex = history.length - 1;
        saveHistory();
    }

    function undo() {
        if (currentIndex > 0) {
            currentIndex--;
            saveHistory();
            return history[currentIndex];
        }
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
        return currentIndex < history.length - 1;
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
