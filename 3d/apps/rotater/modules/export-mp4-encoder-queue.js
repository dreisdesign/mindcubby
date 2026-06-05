export function createExportMp4EncoderQueueController({
    nowMs,
    setTimeoutFn,
    clearTimeoutFn,
    maybePaintExportProgress,
} = {}) {
    function waitForQueueSignal(encoder, targetQueue, timeoutMs = 16) {
        return new Promise((resolve) => {
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
                if (encoder.state === 'closed' || encoder.encodeQueueSize <= targetQueue) finish();
            };

            try { encoder.addEventListener?.('dequeue', onDequeue); } catch (_) { }
            timeoutId = setTimeoutFn?.(finish, timeoutMs);
            if (timeoutId == null) finish();
        });
    }

    async function waitForEncoderQueue({
        encoder,
        getEncoderError,
        maxQueue = 24,
        hardQueue = null,
        frameIndex = 0,
        total = 0,
        maxBusyMs = 120000,
    } = {}) {
        if (!encoder || encoder.state === 'closed') return;
        if (typeof encoder.encodeQueueSize !== 'number') return;

        const softQueue = Math.max(1, Math.floor(maxQueue));
        const hardQueueLimit = Math.max(
            softQueue + 8,
            Number.isFinite(hardQueue) ? Math.floor(hardQueue) : Math.floor(softQueue * 1.35)
        );
        const resumeQueue = Math.max(softQueue, Math.floor((softQueue + hardQueueLimit) / 2));
        if (encoder.encodeQueueSize <= softQueue) return;

        let stallStartedAt = 0;
        let lastQueueDepth = Math.round(encoder.encodeQueueSize || 0);
        let lastQueueChangeAt = nowMs?.() || 0;
        let lastBusyNoticeAt = 0;

        // Soft backpressure: yield briefly without fully draining queue so
        // encoding cadence stays smooth instead of "sprint then hard stop".
        if (encoder.encodeQueueSize <= hardQueueLimit) {
            await waitForQueueSignal(encoder, hardQueueLimit, 8);
            const encoderError = getEncoderError?.();
            if (encoderError) throw encoderError;
            if (encoder.state === 'closed') {
                throw new Error('VideoEncoder closed unexpectedly — try a lower resolution or bitrate.');
            }
            return;
        }

        while (encoder.encodeQueueSize > resumeQueue) {
            if (!stallStartedAt) stallStartedAt = nowMs?.() || 0;
            await waitForQueueSignal(encoder, resumeQueue, 12);

            const encoderError = getEncoderError?.();
            if (encoderError) throw encoderError;
            if (encoder.state === 'closed') {
                throw new Error('VideoEncoder closed unexpectedly — try a lower resolution or bitrate.');
            }

            const now = nowMs?.() || 0;
            const queueDepth = Math.round(encoder.encodeQueueSize || 0);
            if (queueDepth !== lastQueueDepth) {
                lastQueueDepth = queueDepth;
                lastQueueChangeAt = now;
            }

            if (total > 0 && (now - stallStartedAt) > 900 && (now - lastBusyNoticeAt) > 800) {
                lastBusyNoticeAt = now;
                const encodedFloor = Math.max(frameIndex + 0.15, frameIndex + 1 - Math.min(0.45, queueDepth / Math.max(1, hardQueueLimit + 1)));
                await maybePaintExportProgress?.(
                    `Encoding… ${frameIndex + 1} / ${total}`,
                    encodedFloor,
                    total,
                    true
                );
            }

            if ((now - lastQueueChangeAt) > maxBusyMs) {
                throw new Error(
                    `Video encoder stalled while processing frame ${frameIndex + 1}/${total || '?'} `
                    + `(queue=${queueDepth}). Try lower FPS/resolution and close heavy apps/tabs.`
                );
            }
        }
    }

    async function waitForEncoderFlush({
        encoder,
        getEncoderError,
        total = 0,
        timeoutMs = 90000,
    } = {}) {
        if (!encoder || encoder.state === 'closed') return;

        const startAt = nowMs?.() || 0;
        let lastNoticeAt = 0;

        const flushPromise = encoder.flush();
        while (true) {
            const encoderError = getEncoderError?.();
            if (encoderError) throw encoderError;
            if (encoder.state === 'closed') {
                throw new Error('VideoEncoder closed unexpectedly while finalizing. Try a lower resolution or bitrate.');
            }

            const flushResult = await Promise.race([
                flushPromise.then(() => ({ done: true })),
                new Promise((resolve) => {
                    const id = setTimeoutFn?.(() => resolve({ done: false }), 900);
                    if (id == null) resolve({ done: false });
                }),
            ]);

            if (flushResult?.done) return;

            const now = nowMs?.() || 0;
            if (total > 0 && (now - lastNoticeAt) > 1000) {
                lastNoticeAt = now;
                const queueDepth = Math.round(encoder.encodeQueueSize || 0);
                const elapsedSec = Math.max(0, Math.round((now - startAt) / 1000));
                let flushMsg = 'Finishing video... writing final frames.';
                if (elapsedSec >= 8 && elapsedSec < 18) {
                    flushMsg = 'Finishing video... packaging file for download.';
                } else if (elapsedSec >= 18) {
                    flushMsg = 'Still finishing your video... high-resolution exports can take a little longer.';
                }

                // Keep the bar near-complete and let it creep forward as queued
                // work drains so users can see that progress is still happening.
                const trailingFrames = Math.max(1, Math.min(18, Math.round(queueDepth / 20)));
                const flushDone = Math.max(0, total - trailingFrames);
                await maybePaintExportProgress?.(
                    flushMsg,
                    flushDone,
                    total,
                    true
                );
            }

            if ((now - startAt) > timeoutMs) {
                throw new Error('Video encoder did not finalize in time. Try a lower FPS/resolution and close other heavy apps/tabs.');
            }
        }
    }

    return {
        waitForEncoderQueue,
        waitForEncoderFlush,
    };
}
