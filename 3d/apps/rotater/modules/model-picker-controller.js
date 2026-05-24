export function closeModelPartSelectorMenuController({
    force = false,
    modelPartSelectorMenu = null,
    modelPartSelectorBtn = null,
    isModelPartFloatingCardOpen = null,
    rulerPartSelectMultiEnabled = false,
    setRulerPartSelectMultiEnabled = null,
    setModelPartSelectorClosedByUser = null,
    setModelPartMenuDragState = null,
    applyPartInteractionVisualsToMeshMaterials = null,
    syncRulerHoverSelectorState = null,
    updateRulerHUD = null,
} = {}) {
    if (!force && typeof isModelPartFloatingCardOpen === 'function' && isModelPartFloatingCardOpen()) return false;

    let changedModelSelectorMenuState = false;
    if (modelPartSelectorMenu && !modelPartSelectorMenu.hidden) {
        modelPartSelectorMenu.hidden = true;
        changedModelSelectorMenuState = true;
        if (force && typeof setModelPartSelectorClosedByUser === 'function') {
            setModelPartSelectorClosedByUser(true);
        }
    }

    if (modelPartSelectorBtn) modelPartSelectorBtn.setAttribute('aria-expanded', 'false');

    if (changedModelSelectorMenuState) {
        if (typeof setModelPartMenuDragState === 'function') setModelPartMenuDragState(null);
        const floatingHeader = modelPartSelectorMenu?.querySelector('.model-selector-floating-header');
        if (floatingHeader) floatingHeader.classList.remove('is-dragging');
        if (typeof applyPartInteractionVisualsToMeshMaterials === 'function') applyPartInteractionVisualsToMeshMaterials();
        if (typeof syncRulerHoverSelectorState === 'function') syncRulerHoverSelectorState();
        if (typeof updateRulerHUD === 'function') updateRulerHUD();
    }

    return changedModelSelectorMenuState;
}

export function resetSyncMenuFloatingStyleController(menuEl) {
    if (!menuEl) return;
    menuEl.style.position = '';
    menuEl.style.left = '';
    menuEl.style.right = '';
    menuEl.style.top = '';
    menuEl.style.bottom = '';
    menuEl.style.width = '';
    menuEl.style.transform = '';
}

export function positionSyncMenuAtAnchorController({
    menuEl,
    anchorEl,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
} = {}) {
    if (!menuEl || !anchorEl) return;
    const gap = 8;
    const viewportPad = 12;
    const minPanelHeight = 170;
    const anchorRect = anchorEl.getBoundingClientRect();
    const preferredWidth = Math.max(220, Math.min(300, Math.round(anchorRect.width + 44)));
    const width = Math.max(200, Math.min(preferredWidth, Math.floor(viewportWidth - viewportPad * 2)));
    const spaceBelow = Math.max(0, viewportHeight - anchorRect.bottom - viewportPad - gap);
    const spaceAbove = Math.max(0, anchorRect.top - viewportPad - gap);
    const openAbove = spaceBelow < minPanelHeight && spaceAbove > spaceBelow;
    const available = Math.max(140, Math.floor(openAbove ? spaceAbove : spaceBelow));

    let left = anchorRect.left + ((anchorRect.width - width) / 2);
    left = Math.max(viewportPad, Math.min(left, viewportWidth - width - viewportPad));

    menuEl.style.position = 'fixed';
    menuEl.style.left = `${Math.round(left)}px`;
    menuEl.style.right = 'auto';
    menuEl.style.width = `${Math.round(width)}px`;
    menuEl.style.top = `${Math.round(openAbove ? (anchorRect.top - gap) : (anchorRect.bottom + gap))}px`;
    menuEl.style.bottom = 'auto';
    menuEl.style.transform = openAbove ? 'translateY(-100%)' : 'none';
    menuEl.style.maxHeight = `${available}px`;
    menuEl.classList.toggle('thumb-select-menu--above', openAbove);
}

export function resolveModelSyncAnchorController({
    explicitAnchorEl = null,
    fallbackAnchorId = '',
    fallbackBtn = null,
    documentRef = document,
} = {}) {
    return explicitAnchorEl || documentRef.getElementById(fallbackAnchorId) || fallbackBtn;
}

export function openSyncSourceMenuController({
    menuEl,
    selectorBtn = null,
    anchorEl = null,
    setAnchorEl = null,
    resolveAnchorEl,
    closeThumbSelectMenus,
    positionSyncMenuAtAnchor,
    queueModelPartThumbsRender,
} = {}) {
    if (!menuEl) return;

    const open = !menuEl.hidden;
    if (anchorEl instanceof Element && typeof setAnchorEl === 'function') setAnchorEl(anchorEl);
    const targetAnchor = typeof resolveAnchorEl === 'function' ? resolveAnchorEl() : null;

    if (typeof closeThumbSelectMenus === 'function') closeThumbSelectMenus();
    if (open || !targetAnchor) return;

    menuEl.hidden = false;
    if (typeof positionSyncMenuAtAnchor === 'function') {
        positionSyncMenuAtAnchor(menuEl, targetAnchor);
    }
    menuEl.scrollTop = 0;
    if (selectorBtn) selectorBtn.setAttribute('aria-expanded', 'true');
    if (typeof queueModelPartThumbsRender === 'function') queueModelPartThumbsRender();
}

export function closeThumbSelectMenusByModeController({
    includeModelSelector = true,
    closeModelPartSelectorMenu,
    bgModelSyncSelectorMenu = null,
    bgModelSyncSelectorBtn = null,
    buildPlateModelSyncSelectorMenu = null,
    buildPlateModelSyncSelectorBtn = null,
    resetSyncMenuFloatingStyle,
    closeModelPartActionMenus,
} = {}) {
    if (includeModelSelector && typeof closeModelPartSelectorMenu === 'function') closeModelPartSelectorMenu();

    if (bgModelSyncSelectorMenu) {
        bgModelSyncSelectorMenu.hidden = true;
        if (typeof resetSyncMenuFloatingStyle === 'function') resetSyncMenuFloatingStyle(bgModelSyncSelectorMenu);
    }
    if (bgModelSyncSelectorBtn) bgModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');

    if (buildPlateModelSyncSelectorMenu) {
        buildPlateModelSyncSelectorMenu.hidden = true;
        if (typeof resetSyncMenuFloatingStyle === 'function') resetSyncMenuFloatingStyle(buildPlateModelSyncSelectorMenu);
    }
    if (buildPlateModelSyncSelectorBtn) buildPlateModelSyncSelectorBtn.setAttribute('aria-expanded', 'false');

    if (typeof closeModelPartActionMenus === 'function') closeModelPartActionMenus();
}
