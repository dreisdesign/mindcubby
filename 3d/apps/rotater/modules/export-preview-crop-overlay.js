export function drawExportPreviewCropOverlayController(
    ctx2d,
    {
        pxW,
        pxH,
        cw,
        ch,
        getCropFrameRect,
    } = {}
) {
    if (!ctx2d || !getCropFrameRect) return;

    const { sx, sy, sw, sh } = getCropFrameRect(cw, ch);
    const scaleX = pxW / cw;
    const scaleY = pxH / ch;

    ctx2d.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx2d.fillRect(0, 0, pxW, sy * scaleY);
    ctx2d.fillRect(0, (sy + sh) * scaleY, pxW, pxH - (sy + sh) * scaleY);
    ctx2d.fillRect(0, sy * scaleY, sx * scaleX, sh * scaleY);
    ctx2d.fillRect((sx + sw) * scaleX, sy * scaleY, pxW - (sx + sw) * scaleX, sh * scaleY);

    const cm = Math.max(2, Math.round(Math.min(sw * scaleX, sh * scaleY) * 0.07));
    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    const minX = sx * scaleX;
    const minY = sy * scaleY;
    const maxX = (sx + sw) * scaleX;
    const maxY = (sy + sh) * scaleY;

    ctx2d.moveTo(minX, minY + cm); ctx2d.lineTo(minX, minY); ctx2d.lineTo(minX + cm, minY);
    ctx2d.moveTo(maxX - cm, minY); ctx2d.lineTo(maxX, minY); ctx2d.lineTo(maxX, minY + cm);
    ctx2d.moveTo(minX, maxY - cm); ctx2d.lineTo(minX, maxY); ctx2d.lineTo(minX + cm, maxY);
    ctx2d.moveTo(maxX - cm, maxY); ctx2d.lineTo(maxX, maxY); ctx2d.lineTo(maxX, maxY - cm);
    ctx2d.stroke();
}
