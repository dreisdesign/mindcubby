export function computeActionMenuPlacement({
    anchorRect,
    menuWidth,
    menuHeight,
    viewportWidth,
    viewportHeight,
    gap = 8,
    sideGap = 10,
    boundaryRect = null,
    containerRect = null,
}) {
    const width = Math.max(160, Math.round(menuWidth || 186));
    const height = Math.max(120, Math.round(menuHeight || 138));

    const bounds = boundaryRect
        ? {
            left: boundaryRect.left + sideGap,
            right: boundaryRect.right - sideGap,
            top: boundaryRect.top + sideGap,
            bottom: boundaryRect.bottom - sideGap,
        }
        : {
            left: sideGap,
            right: viewportWidth - sideGap,
            top: sideGap,
            bottom: viewportHeight - sideGap,
        };

    let left = anchorRect.right - width;
    left = Math.max(bounds.left, Math.min(left, bounds.right - width));

    let top = anchorRect.bottom + gap;
    if (top + height > bounds.bottom) {
        top = anchorRect.top - height - gap;
    }
    top = Math.max(bounds.top, Math.min(top, bounds.bottom - height));

    if (containerRect) {
        return {
            mode: 'absolute',
            width,
            left: Math.round(left - containerRect.left),
            top: Math.round(top - containerRect.top),
        };
    }

    return {
        mode: 'fixed',
        width,
        left: Math.round(left),
        top: Math.round(top),
    };
}
