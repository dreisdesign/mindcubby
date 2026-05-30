import {
    getExportFormatDisplay,
    buildExportFormatOptions,
    buildExportQualityOptions,
    buildExportSpeedOptions,
} from './export-labels.js';

export function renderCollapsedExportSummaryController(fmt, {
    summaryEl,
    getExportSizeOptionsForFormat,
    getExportSizeValueForFormat,
    setExportSizeValueForFormat,
    exportQualityOrder,
    exportQualityLabels,
    speedSecondsPerRev,
    speedDefault,
    speedSlider,
    exportGridEl,
    exportBuildPlateEl,
    exportBgColorEl,
    buildPlateEnabled,
    applyExportFormat,
    saveSettings,
    setExportQualityValue,
    updateEstimate,
    refreshExportPreviewNow,
    getExportFormatForDurationLabels,
    formatRotationTimeOptionLabel,
} = {}) {
    if (!summaryEl) return;

    const format = ({ gif: 'gif', mp4: 'mp4', png: 'png', jpg: 'jpg' })[fmt] || 'gif';
    const qualityValue = document.getElementById('exportQuality')?.value || 'std';
    const sizeValue = getExportSizeValueForFormat?.(format) || '1080';
    const speedValue = String(Math.max(0, Math.min(
        speedSecondsPerRev.length - 1,
        parseInt(speedSlider?.value || String(speedDefault), 10) || speedDefault
    )));
    const gridChecked = !!exportGridEl?.checked;
    const buildPlateChecked = !!(exportBuildPlateEl ? exportBuildPlateEl.checked : buildPlateEnabled);
    const bgChecked = !!exportBgColorEl?.checked;
    const gifLoopChecked = !!document.getElementById('gifLoop')?.checked;
    const jpegQualityValue = document.getElementById('jpegQuality')?.value || '90';
    const cropValue = document.querySelector('input[name="exportDimensions"]:checked')?.value || 'square';
    const cropLabel = ({ square: '1:1', portrait12: '1:2', landscape21: '2:1', landscape43: '4:3' })[cropValue] || '1:1';

    const formatOptions = buildExportFormatOptions({
        selectedFormat: format,
    });

    const sizeOptionList = getExportSizeOptionsForFormat?.(format) || [];
    const sizeOptions = sizeOptionList
        .map(({ value, label }) => `<option value="${value}"${value === sizeValue ? ' selected' : ''}>${label}</option>`)
        .join('');
    const selectedSizeLabel = sizeOptionList.find((opt) => opt.value === sizeValue)?.label || `${sizeValue} px`;

    const qualityOptions = buildExportQualityOptions({
        qualityOrder: exportQualityOrder,
        qualityLabels: exportQualityLabels,
        selectedQuality: qualityValue,
    });

    const speedFormat = getExportFormatForDurationLabels(format);
    const speedOptions = buildExportSpeedOptions({
        speedSecondsPerRev,
        selectedSpeed: speedValue,
        speedFormat,
        formatRotationTimeOptionLabel,
    });
    const speedSummaryLabel = formatRotationTimeOptionLabel(parseInt(speedValue, 10) || 0, speedFormat);

    const summaryPieces = [
        getExportFormatDisplay(format),
        selectedSizeLabel,
        `Crop ${cropLabel}`,
    ];
    if (format === 'gif' || format === 'mp4') {
        summaryPieces.push(exportQualityLabels[qualityValue] || qualityValue);
        summaryPieces.push(speedSummaryLabel);
    }

    const gifExtras = format === 'gif'
        ? `<label class="export-collapsed-confirm-row export-collapsed-confirm-row--check"><span>Loop</span><input type="checkbox" data-export-review="gif-loop"${gifLoopChecked ? ' checked' : ''}></label>`
        : '';

    const jpgExtra = format === 'jpg'
        ? `<label class="export-collapsed-confirm-row"><span>JPEG Quality</span><input type="range" min="50" max="100" step="5" value="${jpegQualityValue}" data-export-review="jpg-quality"></label>`
        : '';

    summaryEl.innerHTML = `
        <details class="export-collapsed-confirm-card" open>
            <summary class="export-collapsed-confirm-card-summary">
                <span class="export-collapsed-confirm-card-title">Current export</span>
                <span class="export-collapsed-confirm-card-meta">${summaryPieces.join(' | ')}</span>
            </summary>
            <div class="export-collapsed-confirm-list">
                <label class="export-collapsed-confirm-row">
                    <span>Format</span>
                    <select class="export-select export-collapsed-confirm-control" data-export-review="format">${formatOptions}</select>
                </label>
                <label class="export-collapsed-confirm-row">
                    <span>Crop</span>
                    <span>${cropLabel}</span>
                </label>
                <label class="export-collapsed-confirm-row">
                    <span>Size</span>
                    <select class="export-select export-collapsed-confirm-control" data-export-review="size">${sizeOptions}</select>
                </label>
                ${(format === 'gif' || format === 'mp4') ? `<label class="export-collapsed-confirm-row">
                    <span>Quality</span>
                    <select class="export-select export-collapsed-confirm-control" data-export-review="quality">${qualityOptions}</select>
                </label>` : ''}
                ${(format === 'gif' || format === 'mp4') ? `<label class="export-collapsed-confirm-row"><span>Duration</span><select class="export-select export-collapsed-confirm-control" data-export-review="speed">${speedOptions}</select></label>` : ''}
                <label class="export-collapsed-confirm-row export-collapsed-confirm-row--check">
                    <span>Grid</span>
                    <input type="checkbox" data-export-review="grid"${gridChecked ? ' checked' : ''}>
                </label>
                <label class="export-collapsed-confirm-row export-collapsed-confirm-row--check">
                    <span>Background</span>
                    <input type="checkbox" data-export-review="bg"${bgChecked ? ' checked' : ''}>
                </label>
                <label class="export-collapsed-confirm-row export-collapsed-confirm-row--check">
                    <span>Surface</span>
                    <input type="checkbox" data-export-review="build-plate"${buildPlateChecked ? ' checked' : ''}>
                </label>
                ${gifExtras}
                ${jpgExtra}
            </div>
        </details>
    `;

    const formatSelect = summaryEl.querySelector('[data-export-review="format"]');
    formatSelect?.addEventListener('change', () => {
        const nextFormat = formatSelect.value;
        applyExportFormat(nextFormat);
        renderCollapsedExportSummaryController(nextFormat, {
            summaryEl,
            getExportSizeOptionsForFormat,
            getExportSizeValueForFormat,
            setExportSizeValueForFormat,
            exportQualityOrder,
            exportQualityLabels,
            speedSecondsPerRev,
            speedDefault,
            speedSlider,
            exportGridEl,
            exportBuildPlateEl,
            exportBgColorEl,
            buildPlateEnabled,
            applyExportFormat,
            saveSettings,
            setExportQualityValue,
            updateEstimate,
            refreshExportPreviewNow,
            getExportFormatForDurationLabels,
            formatRotationTimeOptionLabel,
        });
        saveSettings();
    });

    const sizeSelect = summaryEl.querySelector('[data-export-review="size"]');
    sizeSelect?.addEventListener('change', () => {
        setExportSizeValueForFormat?.(format, sizeSelect.value);
        updateEstimate();
        refreshExportPreviewNow();
        saveSettings();
    });

    const qualitySelect = (format === 'gif' || format === 'mp4')
        ? summaryEl.querySelector('[data-export-review="quality"]')
        : null;
    qualitySelect?.addEventListener('change', () => {
        setExportQualityValue(qualitySelect.value);
        updateEstimate();
        refreshExportPreviewNow();
        saveSettings();
    });

    const speedSelect = (format === 'gif' || format === 'mp4')
        ? summaryEl.querySelector('[data-export-review="speed"]')
        : null;
    speedSelect?.addEventListener('change', () => {
        if (!speedSlider) return;
        speedSlider.value = speedSelect.value;
        speedSlider.dispatchEvent(new Event('change'));
    });

    const gridCheck = summaryEl.querySelector('[data-export-review="grid"]');
    gridCheck?.addEventListener('change', () => {
        if (!exportGridEl) return;
        exportGridEl.checked = !!gridCheck.checked;
        exportGridEl.dispatchEvent(new Event('change'));
    });

    const bgCheck = summaryEl.querySelector('[data-export-review="bg"]');
    bgCheck?.addEventListener('change', () => {
        if (!exportBgColorEl) return;
        exportBgColorEl.checked = !!bgCheck.checked;
        exportBgColorEl.dispatchEvent(new Event('change'));
    });

    const buildPlateCheck = summaryEl.querySelector('[data-export-review="build-plate"]');
    buildPlateCheck?.addEventListener('change', () => {
        if (!exportBuildPlateEl) return;
        exportBuildPlateEl.checked = !!buildPlateCheck.checked;
        exportBuildPlateEl.dispatchEvent(new Event('change'));
    });

    const gifLoopCheck = summaryEl.querySelector('[data-export-review="gif-loop"]');
    gifLoopCheck?.addEventListener('change', () => {
        const loopEl = document.getElementById('gifLoop');
        if (!loopEl) return;
        loopEl.checked = !!gifLoopCheck.checked;
        loopEl.dispatchEvent(new Event('change'));
        refreshExportPreviewNow();
    });

    const jpgQualitySlider = summaryEl.querySelector('[data-export-review="jpg-quality"]');
    jpgQualitySlider?.addEventListener('input', () => {
        const qualitySlider = document.getElementById('jpegQuality');
        if (!qualitySlider) return;
        qualitySlider.value = jpgQualitySlider.value;
        qualitySlider.dispatchEvent(new Event('input'));
    });
}
