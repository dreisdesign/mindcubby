// Focus Timer - Clean and Simple
class FocusTimer {
    constructor() {
        // Timer state
        this.currentTime = 25 * 60; // Start at 25:00 (in seconds)
        this.isRunning = false;
        this.interval = null;
        this.lastTime = null; // For undo
        this.mode = 'idle'; // 'idle', 'focus', 'paused', 'break'

        // Get DOM elements
        this.display = document.getElementById('timerDisplay');
        this.header = document.getElementById('timerHeader');
        this.breakHint = document.getElementById('breakHint');
        this.footer = document.querySelector('labs-footer-media-controls');
        this.overlay = document.getElementById('resetWarning');
        this.resetConfirm = document.getElementById('resetConfirm');
        this.resetCancel = document.getElementById('resetCancel');

        // Initialize
        this.updateDisplay();
        this.setupEvents();
    }

    setupEvents() {
        if (!this.footer) return;

        // Timer mode: Start → Pause ↔ Resume
        // The button label tells us what will happen on the NEXT click
        this.footer.addEventListener('media-action', (e) => {
            const buttonLabel = e.detail.label;

            if (buttonLabel === 'Pause') {
                // Button shows "Pause" - timer is running, ready to be paused
                this.start();
            } else if (buttonLabel === 'Resume') {
                // Button shows "Resume" - timer is paused, ready to be resumed
                this.pause();
            }
        });

        // Listen for reset button
        this.footer.addEventListener('reset-media', () => {
            this.showResetWarning();
        });

        // Timer display click/tap toggles the same as the button
        if (this.display) {
            this.display.addEventListener('click', () => {
                // Simulate a click on the footer button
                if (this.footer && this.footer.shadowRoot) {
                    const btn = this.footer.shadowRoot.getElementById('media-btn');
                    if (btn) btn.click();
                }
            });
        }

        // Overlay confirm/cancel
        if (this.resetConfirm) {
            this.resetConfirm.addEventListener('click', () => {
                this.hideResetWarning();
                this.doResetWithUndo();
            });
        }
        if (this.resetCancel) {
            this.resetCancel.addEventListener('click', () => {
                this.hideResetWarning();
            });
        }
        if (this.overlay) {
            this.overlay.addEventListener('close', () => {
                this.hideResetWarning();
            });
        }
        // Toast undo
    }

    showResetWarning() {
        if (this.overlay) this.overlay.style.display = '';
    }
    hideResetWarning() {
        if (this.overlay) this.overlay.style.display = 'none';
    }
    doResetWithUndo() {
        this.lastTime = this.currentTime;
        this.reset();
    }
    undoReset() {
        if (this.lastTime != null) {
            this.currentTime = this.lastTime;
            this.updateDisplay();
            this.lastTime = null;
        }
    }
    updateResetButtonVisibility() {
        if (!this.footer) return;
        const resetBtn = this.footer.shadowRoot && this.footer.shadowRoot.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.style.display = (this.currentTime === 25 * 60) ? 'none' : '';
        }
    }

    start() {
        if (this.isRunning) return;

        // Determine if we're starting a break or focus
        if (this.currentTime === 25 * 60 || this.currentTime > 0) {
            this.mode = 'focus';
        } else if (this.currentTime < 0) {
            this.mode = 'break';
        }

        this.isRunning = true;
        this.updateHeaderAndHint();
        this.interval = setInterval(() => {
            this.currentTime--;
            // Switch to break mode at 0
            if (this.currentTime === 0) {
                this.mode = 'break';
                this.updateHeaderAndHint();
            }
            // When we hit -5:00, reset to 25:00 and go back to focus
            if (this.currentTime === -300) { // -5:00 in seconds
                this.reset();
                return;
            }
            this.updateDisplay();
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        if (this.mode === 'focus' || this.mode === 'break') {
            this.mode = 'paused';
        }
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.updateHeaderAndHint();
    }

    reset() {
        this.pause();
        this.currentTime = 25 * 60; // Reset to 25:00
        this.mode = 'idle';
        this.updateDisplay();
    }

    updateDisplay() {
        const isNegative = this.currentTime < 0;
        const absTime = Math.abs(this.currentTime);
        const minutes = Math.floor(absTime / 60);
        const seconds = absTime % 60;
        const timeString = `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (this.display) {
            this.display.textContent = timeString;
        }
        this.updateHeaderAndHint();
        this.updateResetButtonVisibility();
    }

    updateHeaderAndHint() {
        if (!this.header || !this.breakHint) return;
        // Header logic
        let headerText = 'Timer';
        let breakText = 'Next: 5:00 break';
        if (this.mode === 'focus') {
            headerText = 'Focus';
            breakText = 'Next: 5:00 break';
        } else if (this.mode === 'paused') {
            headerText = 'Paused';
            // Show what the next state will be
            breakText = (this.currentTime < 0) ? 'Next: 25:00 focus' : 'Next: 5:00 break';
        } else if (this.mode === 'break') {
            headerText = 'Break';
            breakText = 'Next: 25:00 focus';
        } else {
            // idle/default
            headerText = 'Timer';
            breakText = 'Next: 5:00 break';
        }
        this.header.textContent = headerText;
        this.breakHint.textContent = breakText;
    }
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.timer = new FocusTimer();
    });
} else {
    window.timer = new FocusTimer();
}
