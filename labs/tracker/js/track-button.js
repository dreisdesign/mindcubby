/* lightweight track-button module (optional helper) */
export function createTrackButton(onTrack) {
    const btn = document.createElement('labs-button');
    btn.setAttribute('fullwidth', '');
    btn.textContent = 'Track';
    btn.addEventListener('click', onTrack);
    return btn;
}
