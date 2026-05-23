export function createExportFilenameController({
    getExportQuality,
    getGifLoopEnabled,
    getGifDitherEnabled,
    getTransparentEnabled,
    getTransparentPngEnabled,
    getImagePresetTag,
    getCurrentFileName,
    getRotateMode,
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

    function buildExportFilename(format) {
        const ext = ({ gif: 'gif', mp4: 'mp4', png: 'png', jpg: 'jpg' }[format]) || format;
        const base = `Rotater_${getCurrentFileName?.() || 'model'}`;
        const mode = getRotateMode?.() || 'spin';
        const quality = getQualityTag();
        const modifiers = getExportModifierTags(format);
        return [base, mode, quality, ...modifiers].join('_') + '.' + ext;
    }

    return {
        getQualityTag,
        getExportModifierTags,
        buildExportFilename,
    };
}
