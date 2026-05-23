export function getExportFormatDisplay(fmt) {
    return ({ gif: 'Animated GIF', mp4: 'MP4 Video', png: 'PNG Image', jpg: 'JPEG Image' })[fmt] || 'Export';
}

export function buildExportFormatOptions({ selectedFormat }) {
    return ['gif', 'mp4', 'png', 'jpg']
        .map((key) => `<option value="${key}"${key === selectedFormat ? ' selected' : ''}>${getExportFormatDisplay(key)}</option>`)
        .join('');
}

export function buildExportQualityOptions({
    qualityOrder,
    qualityLabels,
    selectedQuality,
}) {
    return qualityOrder
        .map((key) => `<option value="${key}"${key === selectedQuality ? ' selected' : ''}>${qualityLabels[key] || key}</option>`)
        .join('');
}

export function buildExportSpeedOptions({
    speedSecondsPerRev,
    selectedSpeed,
    speedFormat,
    formatRotationTimeOptionLabel,
}) {
    return speedSecondsPerRev
        .map((_seconds, idx) => {
            const value = String(idx);
            const label = formatRotationTimeOptionLabel(idx, speedFormat);
            return `<option value="${value}"${value === selectedSpeed ? ' selected' : ''}>${label}</option>`;
        })
        .join('');
}
