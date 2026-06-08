export const EXPORT_SIZE_PRESETS = {
    gif: {
        '854': { shortEdge: 854, label: 'Low (480p)' },
        '1280': { shortEdge: 1280, label: 'Medium (720p)' },
        '1920': { shortEdge: 1920, label: 'High (1080p)' },
        '3840': { shortEdge: 3840, label: 'Ultra (4K)' },
    },
    mp4: {
        '854': { shortEdge: 854, label: 'Low (480p)' },
        '1280': { shortEdge: 1280, label: 'Medium (720p)' },
        '1920': { shortEdge: 1920, label: 'High (1080p)' },
        '3840': { shortEdge: 3840, label: 'Ultra (4K)' },
    },
    image: {
        '854': { shortEdge: 854, label: 'Low (480p)' },
        '1280': { shortEdge: 1280, label: 'Medium (720p)' },
        '1920': { shortEdge: 1920, label: 'High (1080p)' },
        '3840': { shortEdge: 3840, label: 'Ultra (4K)' },
    },
};

export const DEFAULT_EXPORT_SIZE_KEYS = {
    gif: '1280',
    mp4: '1280',
    image: '1280',
};

const LEGACY_EXPORT_SIZE_KEY_MAP = {
    '720': '854',
    '1080': '1280',
    '2160': '1920',
};

const LEGACY_SIZE_KEY_BY_QUALITY = {
    '30': '1280',
    '60': '1280',
    '90': '1920',
    '120': '1920',
    '240': '3840',
};

export function createDefaultExportSizeSelections() {
    return {
        gif: DEFAULT_EXPORT_SIZE_KEYS.gif,
        mp4: DEFAULT_EXPORT_SIZE_KEYS.mp4,
        image: DEFAULT_EXPORT_SIZE_KEYS.image,
    };
}

export function normalizeExportSizeProfile(format = 'gif') {
    return (format === 'png' || format === 'jpg') ? 'image' : (format === 'mp4' ? 'mp4' : 'gif');
}

export function getExportSizePresetMap(format = 'gif') {
    return EXPORT_SIZE_PRESETS[normalizeExportSizeProfile(format)] ?? EXPORT_SIZE_PRESETS.gif;
}

export function normalizeExportSizeKey(format = 'gif', key = null) {
    const profile = normalizeExportSizeProfile(format);
    const presets = getExportSizePresetMap(profile);
    const stringKey = String(key ?? '');
    if (presets[stringKey]) return stringKey;

    const legacyMappedKey = LEGACY_EXPORT_SIZE_KEY_MAP[stringKey];
    if (legacyMappedKey && presets[legacyMappedKey]) return legacyMappedKey;

    return DEFAULT_EXPORT_SIZE_KEYS[profile] ?? Object.keys(presets)[0];
}

export function getExportSizeOptionsForFormat(format = 'gif') {
    return Object.entries(getExportSizePresetMap(format)).map(([value, preset]) => ({
        value,
        label: preset.label,
    }));
}

export function getExportLongEdgeForKey(format = 'gif', selectedKey = null) {
    const presets = getExportSizePresetMap(format);
    const key = normalizeExportSizeKey(format, selectedKey);
    return presets[key]?.shortEdge ?? presets[Object.keys(presets)[0]]?.shortEdge ?? 1080;
}

export function getLegacyExportSizeKeyForNormalizedQuality(format = 'gif', normalizedQuality = '30') {
    const profile = normalizeExportSizeProfile(format);
    return LEGACY_SIZE_KEY_BY_QUALITY[normalizedQuality] || DEFAULT_EXPORT_SIZE_KEYS[profile];
}

export function getExportDimensionsForLongEdge(longEdge, preset = { w: 1, h: 1 }) {
    const safeLongEdge = Math.max(2, Number(longEdge) || 1080);
    const safeW = Math.max(1, Number(preset?.w) || 1);
    const safeH = Math.max(1, Number(preset?.h) || 1);

    let width = safeLongEdge;
    let height = safeLongEdge;
    if (safeW >= safeH) {
        width = safeLongEdge;
        height = Math.round((safeLongEdge * safeH) / safeW);
    } else {
        height = safeLongEdge;
        width = Math.round((safeLongEdge * safeW) / safeH);
    }

    // H.264 browser limit: level 5.1 supports max 9.4MP (9,437,184 pixels)
    // For square 1:1 crops at Ultra (3840px), this exceeds the limit (3840×3840 = 14.7MP)
    // Cap square/near-square crops at 2160 for reliable H.264 encoding
    const isSquareAspect = Math.abs(safeW - safeH) < Math.max(safeW, safeH) * 0.05;
    if (isSquareAspect && safeLongEdge > 2160) {
        // For square crops, cap at 2160 to stay within H.264 level 5.1 limits
        const cappedLongEdge = 2160;
        width = cappedLongEdge;
        height = cappedLongEdge;
    }

    // Prefer even dimensions for codec and pixel-grid consistency.
    if (width % 2 !== 0) width += 1;
    if (height % 2 !== 0) height += 1;

    return { width, height };
}
