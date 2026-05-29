export function createExportMp4EncoderQueueController({
    nowMs,
    setTimeoutFn,
    clearTimeoutFn,
    maybePaintExportProgress,
} = {}) {
    async function waitForEncoderQueue({
        encoder,
        getEncoderError,
        maxQueue = 24,
        frameIndex = 0,
        total = 0,
    } = {}) {
        if (!encoder || encoder.state === 'closed') return;
        if (typeof encoder.encodeQueueSize !== 'number') return;

        let stallStartedAt = 0;
        let lastBusyNoticeAt = 0;
        while (encoder.encodeQueueSize > maxQueue) {
            if (!stallStartedAt) stallStartedAt = nowMs?.() || 0;

            await new Promise((resolve) => {
                let done = false;
                let timeoutId = null;
                const finish = () => {
                    if (done) return;
                    done = true;
                    if (timeoutId !== null) clearTimeoutFn?.(timeoutId);
                    try { encoder.removeEventListener?.('dequeue', onDequeue); } catch (_) { }
                    resolve();
                };
                const onDequeue = () => {
                    if (encoder.encodeQueueSize <= maxQueue || encoder.state === 'closed') finish();
                };

                try { encoder.addEventListener?.('dequeue', onDequeue); } catch (_) { }
                timeoutId = setTimeoutFn?.(finish, 50);
            });

            const encoderError = getEncoderError?.();
            if (encoderError) throw encoderError;
            if (encoder.state === 'closed') {
                throw new Error('VideoEncoder closed unexpectedly — try a lower resolution or bitrate.');
            }

            const now = nowMs?.() || 0;
            if (total > 0 && (now - stallStartedAt) > 900 && (now - lastBusyNoticeAt) > 800) {
                lastBusyNoticeAt = now;
                const queueDepth = Math.round(encoder.encodeQueueSize || 0);
                await maybePaintExportProgress?.(
                    `Encoding… ${frameIndex + 1} / ${total} (encoder busy: q=${queueDepth}, screen recording can slow export; continuing)`,
                    frameIndex + 1,
                    total,
                    true
                );
            }
        }
    }

    return {
        waitForEncoderQueue,
    };
}
