export function createExportMp4CodecConfigController() {
    function resolveAvcLevel({ width = 0, height = 0 } = {}) {
        const totalPixels = Math.max(1, Math.floor(width)) * Math.max(1, Math.floor(height));
        if (totalPixels > 2097152) return '33';
        if (totalPixels > 921600) return '28';
        return '1f';
    }

    function configureMp4Encoder({
        encoder,
        width,
        height,
        bitrate,
        fps,
    } = {}) {
        if (!encoder) return;
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
        configureMp4Encoder,
    };
}
