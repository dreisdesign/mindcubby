export function createExportFilenameController({
    getExportQuality,
    getGifLoopEnabled,
    getGifDitherEnabled,
    getTransparentEnabled,
    getTransparentPngEnabled,
    getImagePresetTag,
    getCurrentFileName,
    getRotateMode,
    getNamePrefix,
    getSelectedPartIndices,
    getPartNameByIndex,
    stemFromFileName,
} = {}) {
    function getQualityTag() {
        const q = getExportQuality?.() ?? 'std';
        return ({ web: 'low', std: 'medium', high: 'high' }[q]) || q;
    }

    function getExportModifierTags(format) {
        const tags = [];
        if (format === 'gif') {
            const loopOn = getGifLoopEnabled?.() ?? true;
            tags.push(loopOn ? 'loop' : 'noloop');
            if (getGifDitherEnabled?.()) tags.push('dither');
            if (getTransparentEnabled?.()) tags.push('transparent');
            return tags;
        }

        if (format === 'png' || format === 'jpg') {
            const imagePresetTag = getImagePresetTag?.();
            if (imagePresetTag) tags.push(imagePresetTag);
            if (format === 'png' && (getTransparentPngEnabled?.() ?? getTransparentEnabled?.() ?? false)) {
                tags.push('transparent');
            }
        }

        return tags;
    }

    function getSelectedPartExportName() {
        const selectedIndices = typeof getSelectedPartIndices === 'function' ? getSelectedPartIndices() : [];

        if (selectedIndices.length === 1) {
            // Single selection: use that part's name
            const idx = selectedIndices[0];
            const partName = typeof getPartNameByIndex === 'function' ? getPartNameByIndex(idx) : null;
            if (partName) {
                return typeof stemFromFileName === 'function' ? stemFromFileName(partName) : partName;
            }
        } else if (selectedIndices.length > 1) {
            // Multiple selections: use first part name + "-plus-X-more"
            const firstIdx = selectedIndices[0];
            const firstPartName = typeof getPartNameByIndex === 'function' ? getPartNameByIndex(firstIdx) : null;
            const stem = firstPartName
                ? (typeof stemFromFileName === 'function' ? stemFromFileName(firstPartName) : firstPartName)
                : 'model';
            const moreCount = selectedIndices.length - 1;
            return `${stem}-plus-${moreCount}-more`;
        }

        // Fallback to global currentFileName
        return getCurrentFileName?.() || 'model';
    }

    function buildExportFilename(format) {
        const ext = ({ gif: 'gif', mp4: 'mp4', png: 'png', jpg: 'jpg' }[format]) || format;
        const base = `Rotater_${getSelectedPartExportName()}`;
        const mode = getRotateMode?.() || 'spin';
        const quality = getQualityTag();
        const modifiers = getExportModifierTags(format);
        const stem = [base, mode, quality, ...modifiers].join('_');
        const prefix = String(getNamePrefix?.() || '').trim();
        return (prefix ? `${prefix}--${stem}` : stem) + '.' + ext;
    }

    return {
        getQualityTag,
        getExportModifierTags,
        buildExportFilename,
    };
}
