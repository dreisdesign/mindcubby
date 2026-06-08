export function createExportMp4CodecConfigController() {
    function resolveAvcLevel({ width = 0, height = 0 } = {}) {
        const totalPixels = Math.max(1, Math.floor(width)) * Math.max(1, Math.floor(height));
        // Note: WebCodecs does not reliably support level 5.2 encoding (browser limitation).
        // We cap to level 5.1: 9,437,184 pixels maximum.
        // This means square 1:1 exports max out at ~3072×3072.
        // AVC level 5.1 (0x33): 9,437,184 pixels
        if (totalPixels > 2097152) return '33';
        // AVC level 4.0 (0x28): 2,097,152 pixels
        if (totalPixels > 921600) return '28';
        // AVC level 3.1 (0x1f): 921,600 pixels
        return '1f';
    }

    function getMaxResolutionForAspectRatio(aspectRatio = 1) {
        // Returns { width, height, downscaled } for max supported resolution at given aspect ratio.
        // Level 5.1 max: 9,437,184 pixels
        const MAX_PIXELS_LEVEL_5_1 = 9437184;
        
        if (Math.abs(aspectRatio - 1) < 0.01) {
            // Square 1:1: max ~3072×3072
            const maxSide = Math.floor(Math.sqrt(MAX_PIXELS_LEVEL_5_1));
            return { width: maxSide, height: maxSide, isSquare: true };
        }
        
        // Landscape/portrait: use standard 16:9 limits
        // 3840×2160 = 8,294,400 pixels (fits in level 5.1)
        if (aspectRatio > 1) {
            return { width: 3840, height: 2160, isLandscape: true };
        } else {
            return { width: 2160, height: 3840, isPortrait: true };
        }
    }

    function validateResolutionForEncoding({ width, height }) {
        const totalPixels = Math.max(1, Math.floor(width)) * Math.max(1, Math.floor(height));
        const MAX_PIXELS_LEVEL_5_1 = 9437184;
        
        if (totalPixels > MAX_PIXELS_LEVEL_5_1) {
            const aspectRatio = Math.max(1, width) / Math.max(1, height);
            const maxSupported = getMaxResolutionForAspectRatio(aspectRatio);
            return {
                valid: false,
                reason: `Resolution ${width}×${height} exceeds browser H.264 limits. Max: ${maxSupported.width}×${maxSupported.height}`,
                suggested: maxSupported,
            };
        }
        return { valid: true };
    }

    function configureMp4Encoder({
        encoder,
        width,
        height,
        bitrate,
        fps,
    } = {}) {
        if (!encoder) return;
        
        // Validate resolution before encoding
        const validation = validateResolutionForEncoding({ width, height });
        if (!validation.valid) {
            throw new Error(validation.reason);
        }
        
        const avcLevel = resolveAvcLevel({ width, height });
        encoder.configure({
            codec: `avc1.4200${avcLevel}`,
            width,
            height,
            bitrate,
            framerate: fps,
        });
    }

    return {
        resolveAvcLevel,
        getMaxResolutionForAspectRatio,
        validateResolutionForEncoding,
        configureMp4Encoder,
    };
}
