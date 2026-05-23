export function getRotationTimeSecondsByIndexController(index, {
    speedSecondsPerRev,
    speedDefault,
} = {}) {
    return speedSecondsPerRev[index] ?? speedSecondsPerRev[speedDefault];
}

export function getExportFormatForDurationLabelsController(format = 'gif') {
    return format === 'mp4' ? 'mp4' : 'gif';
}

export function getRotationFrameCountForSecondsController(seconds, format = 'gif', {
    getExportQualityValue,
    qualityPresets,
    getEffectiveExportFpsForSeconds,
} = {}) {
    const qualityValue = getExportQualityValue?.() ?? 'std';
    const preset = qualityPresets[qualityValue] ?? qualityPresets.std;
    const baseFps = preset.fps;
    const fps = getEffectiveExportFpsForSeconds(baseFps, seconds, format);
    return Math.max(1, Math.round(fps * Math.max(1, Number(seconds) || 1)));
}

export function formatRotationTimeOptionLabelController(index, format = 'gif', {
    getRotationTimeSecondsByIndex,
    getRotationFrameCountForSeconds,
} = {}) {
    const seconds = getRotationTimeSecondsByIndex(index);
    const frames = getRotationFrameCountForSeconds(seconds, format);
    return `${seconds} seconds (${frames} frames)`;
}

export function refreshExportMotionSpeedOptionLabelsController(format = 'gif', {
    exportMotionSpeedEl,
    getExportFormatForDurationLabels,
    formatRotationTimeOptionLabel,
} = {}) {
    if (!exportMotionSpeedEl) return;
    const normalizedFormat = getExportFormatForDurationLabels(format);
    Array.from(exportMotionSpeedEl.options).forEach((option, idx) => {
        option.textContent = formatRotationTimeOptionLabel(idx, normalizedFormat);
    });
}
