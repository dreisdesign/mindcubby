export function createExportMp4CodecConfigController() {
    function resolveAvcLevel({ width = 0, height = 0, fps = 30 } = {}) {
        const w = Math.max(1, Math.floor(width));
        const h = Math.max(1, Math.floor(height));
        const safeFps = Math.max(1, Math.ceil(fps));
        const totalPixels = w * h;

        // AVC macroblock = 16×16 pixels.
        // We pick the lowest level that satisfies BOTH pixel-count AND macroblock-rate limits.
        // WebCodecs H.264 level limits (macroblocks / second):
        //   3.1 (0x1f): 108,000 MB/s  ← only safe for ≤720p @ ≤30 fps
        //   4.0 (0x28): 245,760 MB/s  ← up to 1080p @ 30 fps, 720p @ 60 fps
        //   5.1 (0x33): 983,040 MB/s  ← up to 4K @ 30 fps, 1080p @ 60 fps, etc.
        const mbsPerFrame = Math.ceil(w / 16) * Math.ceil(h / 16);
        const mbRate = mbsPerFrame * safeFps;

        // Pixel-count thresholds: > 2,097,152 px requires Level 5.1; > 921,600 px requires Level 4.0.
        if (totalPixels > 2097152 || mbRate > 245760) return '33';
        if (totalPixels > 921600 || mbRate >= 108000) return '28';
        return '1f';
    }

    function getMaxResolutionForAspectRatio(aspectRatio = 1) {
        const MAX_PIXELS_LEVEL_5_1 = 9437184;
        if (Math.abs(aspectRatio - 1) < 0.01) {
            const maxSide = Math.floor(Math.sqrt(MAX_PIXELS_LEVEL_5_1));
            return { width: maxSide, height: maxSide, isSquare: true };
        }
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

    async function findSupportedEncoderConfig({ width, height, bitrate, fps }) {
        const level = resolveAvcLevel({ width, height, fps });

        // Hardware encoders (such as Apple VideoToolbox on macOS) natively support
        // High Profile ('6400') for HD and 4K, and frequently reject Baseline ('4200')
        // at higher levels (Level 4.0+). We test candidate profiles in priority order:
        // High Profile ('6400') -> Main Profile ('4d00') -> Baseline ('4200').
        const candidateCodecs = [
            `avc1.6400${level}`,
            `avc1.4d00${level}`,
            `avc1.4200${level}`,
            `avc1.42e0${level}`,
        ];

        // Additional level fallbacks if target level isn't directly accelerated
        if (level === '33') {
            candidateCodecs.push('avc1.640034', 'avc1.64002a', 'avc1.640028');
        } else if (level === '28') {
            candidateCodecs.push('avc1.640029', 'avc1.64002a', 'avc1.640033', 'avc1.4d0028');
        } else {
            candidateCodecs.push('avc1.640028', 'avc1.4d0028', 'avc1.42001f');
        }

        if (typeof VideoEncoder !== 'undefined' && typeof VideoEncoder.isConfigSupported === 'function') {
            for (const codec of candidateCodecs) {
                try {
                    const testConfig = {
                        codec,
                        width,
                        height,
                        bitrate,
                        framerate: fps,
                        avc: { format: 'avc' },
                    };
                    const res = await VideoEncoder.isConfigSupported(testConfig);
                    if (res?.supported) {
                        return res.config || testConfig;
                    }
                } catch (_) {
                    // Try next candidate
                }
            }
        }

        // Default to High Profile with AVCC format if probe is unavailable
        return {
            codec: `avc1.6400${level}`,
            width,
            height,
            bitrate,
            framerate: fps,
            avc: { format: 'avc' },
        };
    }

    async function configureMp4Encoder({
        encoder,
        width,
        height,
        bitrate,
        fps,
    } = {}) {
        if (!encoder) return null;

        // Validate resolution before encoding
        const validation = validateResolutionForEncoding({ width, height });
        if (!validation.valid) {
            throw new Error(validation.reason);
        }

        const config = await findSupportedEncoderConfig({ width, height, bitrate, fps });
        encoder.configure(config);
        return config;
    }

    return {
        resolveAvcLevel,
        getMaxResolutionForAspectRatio,
        validateResolutionForEncoding,
        findSupportedEncoderConfig,
        configureMp4Encoder,
    };
}
