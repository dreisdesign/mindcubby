const VALID_ACTIONS = new Set(['replace', 'append', 'newplate']);
const VALID_PROMPT_RESULTS = new Set(['replace', 'append', 'newplate', 'cancel']);

export function normalizeUploadAction(action, fallback = null) {
    return VALID_ACTIONS.has(action) ? action : fallback;
}

export function createUploadActionController() {
    let pendingAction = null;
    let promptResolver = null;

    return {
        setPendingAction(action) {
            pendingAction = normalizeUploadAction(action, null);
            return pendingAction;
        },
        clearPendingAction() {
            pendingAction = null;
        },
        consumePendingAction() {
            const action = pendingAction;
            pendingAction = null;
            return action;
        },
        beginPrompt() {
            if (promptResolver) {
                const resolveExisting = promptResolver;
                promptResolver = null;
                resolveExisting('cancel');
            }
            return new Promise((resolve) => {
                promptResolver = resolve;
            });
        },
        resolvePrompt(result = 'cancel') {
            if (!promptResolver) return;
            const resolved = VALID_PROMPT_RESULTS.has(result) ? result : 'cancel';
            const resolve = promptResolver;
            promptResolver = null;
            resolve(resolved);
        },
    };
}
