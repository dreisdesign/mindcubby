export function isModelPartFloatingCardOpenController({ modelPartSelectorMenu = null } = {}) {
    return !!(modelPartSelectorMenu
        && !modelPartSelectorMenu.hidden
        && modelPartSelectorMenu.classList.contains('thumb-select-menu--floating-card'));
}

export function shouldUseFloatingModelPartSelectorController({
    isMultipartModel,
    windowRef = window,
    minDesktopWidth = 900,
} = {}) {
    return typeof isMultipartModel === 'function'
        && isMultipartModel()
        && !!windowRef.matchMedia
        && windowRef.matchMedia('(pointer:fine)').matches
        && windowRef.innerWidth >= minDesktopWidth;
}

export function ensureModelPartFloatingHeaderController({
    modelPartSelectorMenu,
    getCloseIconSVG,
    closeModelPartSelectorMenu,
    shouldUseFloatingModelPartSelector,
    setModelPartMenuDragState,
} = {}) {
    if (!modelPartSelectorMenu) return null;

    let headerEl = modelPartSelectorMenu.querySelector('.model-selector-floating-header');
    if (headerEl) return headerEl;

    headerEl = document.createElement('div');
    headerEl.className = 'model-selector-floating-header';
    headerEl.innerHTML = `<span class="model-selector-floating-drag-indicator" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.05078 16C9.63381 16.0001 10.1212 16.1955 10.5127 16.5869C10.9044 16.9786 11.1006 17.4665 11.1006 18.0498C11.1006 18.5998 10.9044 19.079 10.5127 19.4873C10.1211 19.8955 9.63392 20.0995 9.05078 20.0996C8.46745 20.0996 7.97956 19.8956 7.58789 19.4873C7.19626 19.079 7 18.5998 7 18.0498C7 17.4665 7.19623 16.9786 7.58789 16.5869C7.97953 16.1953 8.46752 16 9.05078 16Z"/><path d="M15.251 16C15.834 16.0001 16.3214 16.1955 16.7129 16.5869C17.1046 16.9786 17.3008 17.4665 17.3008 18.0498C17.3008 18.5998 17.1046 19.079 16.7129 19.4873C16.3213 19.8955 15.8341 20.0995 15.251 20.0996C14.6677 20.0996 14.1797 19.8956 13.7881 19.4873C13.3964 19.079 13.2002 18.5998 13.2002 18.0498C13.2002 17.4665 13.3964 16.9786 13.7881 16.5869C14.1797 16.1954 14.6678 16 15.251 16Z"/><path d="M9.05078 10C9.63381 10.0001 10.1212 10.1955 10.5127 10.5869C10.9044 10.9786 11.1006 11.4665 11.1006 12.0498C11.1006 12.6331 10.9044 13.121 10.5127 13.5127C10.1212 13.9041 9.63382 14.0995 9.05078 14.0996C8.46752 14.0996 7.97953 13.9043 7.58789 13.5127C7.19622 13.121 7 12.6331 7 12.0498C7 11.4665 7.19623 10.9786 7.58789 10.5869C7.97953 10.1953 8.46752 10 9.05078 10Z"/><path d="M15.251 10C15.834 10.0001 16.3214 10.1955 16.7129 10.5869C17.1046 10.9786 17.3008 11.4665 17.3008 12.0498C17.3008 12.6331 17.1046 13.121 16.7129 13.5127C16.3214 13.9041 15.834 14.0995 15.251 14.0996C14.6678 14.0996 14.1797 13.9042 13.7881 13.5127C13.3964 13.121 13.2002 12.6331 13.2002 12.0498C13.2002 11.4665 13.3964 10.9786 13.7881 10.5869C14.1797 10.1954 14.6678 10 15.251 10Z"/><path d="M9.05078 4C9.63381 4.00007 10.1212 4.19554 10.5127 4.58691C10.9044 4.97858 11.1006 5.46648 11.1006 6.0498C11.1006 6.63314 10.9044 7.12103 10.5127 7.5127C10.1212 7.90407 9.63382 8.09954 9.05078 8.09961C8.46752 8.09961 7.97953 7.90427 7.58789 7.5127C7.19626 7.12103 7 6.63314 7 6.0498C7 5.46648 7.19623 4.97858 7.58789 4.58691C7.97953 4.19535 8.46752 4 9.05078 4Z"/><path d="M15.251 4C15.834 4.00011 16.3214 4.19552 16.7129 4.58691C17.1046 4.97858 17.3008 5.46648 17.3008 6.0498C17.3008 6.63314 17.1046 7.12103 16.7129 7.5127C16.3214 7.90409 15.834 8.0995 15.251 8.09961C14.6678 8.09961 14.1797 7.9042 13.7881 7.5127C13.3964 7.12103 13.2002 6.63314 13.2002 6.0498C13.2002 5.46648 13.3964 4.97858 13.7881 4.58691C14.1797 4.19541 14.6678 4 15.251 4Z"/></svg></span><span class="model-selector-floating-title">3D Models</span><button type="button" class="model-selector-floating-minimize" aria-label="Close model picker" title="Close model picker">${typeof getCloseIconSVG === 'function' ? getCloseIconSVG(18) : ''}</button>`;

    headerEl.querySelector('.model-selector-floating-minimize')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof closeModelPartSelectorMenu === 'function') closeModelPartSelectorMenu(true);
    });

    headerEl.addEventListener('pointerdown', (ev) => {
        const floatingDesktopMenu = typeof shouldUseFloatingModelPartSelector === 'function'
            && shouldUseFloatingModelPartSelector();
        if (!floatingDesktopMenu || !modelPartSelectorMenu || modelPartSelectorMenu.hidden) return;
        if (ev.button !== 0) return;
        if (ev.target instanceof Element && ev.target.closest('button,a,input,select,label,textarea')) return;

        const rect = modelPartSelectorMenu.getBoundingClientRect();
        if (typeof setModelPartMenuDragState === 'function') {
            setModelPartMenuDragState({
                startX: ev.clientX,
                startY: ev.clientY,
                startLeft: rect.left,
                startTop: rect.top,
            });
        }
        headerEl.classList.add('is-dragging');
        headerEl.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
        ev.stopPropagation();
    });

    modelPartSelectorMenu.prepend(headerEl);
    return headerEl;
}

export function clampModelPartSelectorMenuPositionController({
    modelPartSelectorMenu,
    left,
    top,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
    pad = 8,
    minVisibleHeight = 220,
} = {}) {
    if (!modelPartSelectorMenu) return { left, top };

    const rect = modelPartSelectorMenu.getBoundingClientRect();
    const maxLeft = Math.max(pad, viewportWidth - rect.width - pad);
    const maxTop = Math.max(pad, viewportHeight - minVisibleHeight);

    return {
        left: Math.max(pad, Math.min(maxLeft, left)),
        top: Math.max(pad, Math.min(maxTop, top)),
    };
}

export function setModelPartSelectorMenuPositionController({
    modelPartSelectorMenu,
    left,
    top,
    persist = true,
    clampModelPartSelectorMenuPosition,
    storage = null,
    storageKey = '',
    viewportHeight = window.innerHeight,
} = {}) {
    if (!modelPartSelectorMenu) return;

    const clamped = typeof clampModelPartSelectorMenuPosition === 'function'
        ? clampModelPartSelectorMenuPosition(left, top)
        : { left, top };

    modelPartSelectorMenu.style.left = `${Math.round(clamped.left)}px`;
    modelPartSelectorMenu.style.top = `${Math.round(clamped.top)}px`;
    modelPartSelectorMenu.style.right = 'auto';
    modelPartSelectorMenu.style.bottom = 'auto';
    const maxH = Math.max(220, Math.floor(viewportHeight - clamped.top - 8));
    modelPartSelectorMenu.style.maxHeight = `${maxH}px`;

    if (!persist || !storage || !storageKey) return;
    try {
        storage.setItem(storageKey, JSON.stringify({ left: Math.round(clamped.left), top: Math.round(clamped.top) }));
    } catch (_) { }
}

export function restoreModelPartSelectorMenuPositionController({
    modelPartSelectorMenu,
    storage = null,
    storageKey = '',
    setModelPartSelectorMenuPosition,
} = {}) {
    if (!modelPartSelectorMenu || !storage || !storageKey || typeof setModelPartSelectorMenuPosition !== 'function') return false;

    try {
        const raw = storage.getItem(storageKey);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!parsed || !Number.isFinite(parsed.left) || !Number.isFinite(parsed.top)) return false;
        setModelPartSelectorMenuPosition(parsed.left, parsed.top, false);
        return true;
    } catch (_) {
        return false;
    }
}

export function positionFloatingModelPartSelectorMenuController({
    modelPartSelectorMenu,
    anchorBtn,
    ensureModelPartFloatingHeader,
    restoreModelPartSelectorMenuPosition,
    setModelPartSelectorMenuPosition,
} = {}) {
    if (!modelPartSelectorMenu || !anchorBtn) return;

    modelPartSelectorMenu.classList.add('thumb-select-menu--floating-card');
    modelPartSelectorMenu.classList.remove('thumb-select-menu--above');

    if (typeof ensureModelPartFloatingHeader === 'function') ensureModelPartFloatingHeader();

    const restoredPos = typeof restoreModelPartSelectorMenuPosition === 'function'
        && restoreModelPartSelectorMenuPosition();
    if (!restoredPos && typeof setModelPartSelectorMenuPosition === 'function') {
        const anchorRect = anchorBtn.getBoundingClientRect();
        setModelPartSelectorMenuPosition(anchorRect.left, anchorRect.bottom + 10, false);
    }
}

export function initializeModelPartSelectorMenuDragController({
    windowRef = window,
    getModelPartMenuDragState,
    setModelPartMenuDragState,
    modelPartSelectorMenu,
    setModelPartSelectorMenuPosition,
} = {}) {
    const onPointerMove = (ev) => {
        if (typeof getModelPartMenuDragState !== 'function') return;
        const dragState = getModelPartMenuDragState();
        if (!dragState || typeof setModelPartSelectorMenuPosition !== 'function') return;

        const nextLeft = dragState.startLeft + (ev.clientX - dragState.startX);
        const nextTop = dragState.startTop + (ev.clientY - dragState.startY);
        setModelPartSelectorMenuPosition(nextLeft, nextTop, false);
    };

    const onPointerUp = () => {
        if (typeof getModelPartMenuDragState !== 'function') return;
        const dragState = getModelPartMenuDragState();
        if (!dragState || !modelPartSelectorMenu || typeof setModelPartSelectorMenuPosition !== 'function') return;

        const headerEl = modelPartSelectorMenu.querySelector('.model-selector-floating-header');
        if (headerEl) headerEl.classList.remove('is-dragging');

        const rect = modelPartSelectorMenu.getBoundingClientRect();
        setModelPartSelectorMenuPosition(rect.left, rect.top, true);
        if (typeof setModelPartMenuDragState === 'function') setModelPartMenuDragState(null);
    };

    windowRef.addEventListener('pointermove', onPointerMove);
    windowRef.addEventListener('pointerup', onPointerUp);
}
