import { computeActionMenuPlacement } from './menu-positioning.js';

export function closeModelPartActionMenus({
    root = document,
    modelPartSingleMenuBtn = null,
} = {}) {
    root.querySelectorAll('.part-option-actions').forEach((menu) => {
        menu.hidden = true;
        menu.style.position = '';
        menu.style.left = '';
        menu.style.top = '';
        menu.style.right = '';
        menu.style.bottom = '';
        menu.style.width = '';
    });
    if (modelPartSingleMenuBtn) modelPartSingleMenuBtn.setAttribute('aria-expanded', 'false');
}

export function positionModelPartActionMenu({
    menuEl,
    anchorEl,
    modelPartSelectorMenu = null,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
} = {}) {
    if (!menuEl || !anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const sideGap = 10;
    const maxMenuW = Math.max(160, Math.min(220, viewportWidth - (sideGap * 2)));
    const menuRect = menuEl.getBoundingClientRect();
    const menuW = Math.max(160, Math.min(maxMenuW, menuRect.width || maxMenuW));
    const menuH = Math.max(120, menuRect.height || 138);

    const placement = computeActionMenuPlacement({
        anchorRect,
        menuWidth: menuW,
        menuHeight: menuH,
        viewportWidth,
        viewportHeight,
        sideGap,
        // Menu is portaled to document.body, so viewport bounds are always correct.
        boundaryRect: null,
        containerRect: null,
    });

    menuEl.style.width = `${placement.width}px`;
    menuEl.style.position = placement.mode;
    menuEl.style.right = '';
    menuEl.style.bottom = '';
    menuEl.style.left = `${placement.left}px`;
    menuEl.style.top = `${placement.top}px`;
}
