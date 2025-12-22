document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const resultsSection = document.getElementById('resultsSection');
    const previewArea = document.getElementById('previewArea');
    const settingsArea = document.getElementById('settingsArea');
    const rawMarkdown = document.getElementById('rawMarkdown');
    const statusMessage = document.getElementById('statusMessage');

    const btnCopyRich = document.getElementById('btnCopyRich');
    const btnCopySettings = document.getElementById('btnCopySettings');
    const btnDownload = document.getElementById('btnDownload');

    let currentFileName = '';
    let currentSpecs = null;

    // === RESTORE STATE FROM LOCALSTORAGE ===
    function restoreSession() {
        try {
            const savedSpecs = localStorage.getItem('gecoder_specs');
            const savedFilename = localStorage.getItem('gecoder_filename');

            if (savedSpecs && savedFilename) {
                const specs = JSON.parse(savedSpecs);
                currentFileName = savedFilename;
                fileNameDisplay.textContent = savedFilename + ' (Restored)';
                displayResults(specs);
            }
        } catch (e) {
            console.error('Failed to restore session:', e);
            clearSession();
        }
    }

    // === DISPLAY RESULTS ===
    function displayResults(specs) {
        currentSpecs = specs;  // Store specs globally
        const markdown = generateMarkdown(specs);
        const html = generateHTML(specs);
        const settingsHTML = generateSettingsHTML(specs);

        rawMarkdown.value = markdown;
        previewArea.innerHTML = html;
        settingsArea.innerHTML = settingsHTML;

        statusMessage.classList.add('hidden');
        resultsSection.classList.remove('hidden');
    }

    // === SAVE STATE TO LOCALSTORAGE ===
    function saveSession(specs, filename) {
        try {
            localStorage.setItem('gecoder_specs', JSON.stringify(specs));
            localStorage.setItem('gecoder_filename', filename);
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    }

    // === CLEAR SESSION ===
    function clearSession() {
        localStorage.removeItem('gecoder_specs');
        localStorage.removeItem('gecoder_filename');
    }

    // Restore on load
    restoreSession();

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        currentFileName = file.name;
        fileNameDisplay.textContent = file.name;
        statusMessage.textContent = 'Processing...';
        statusMessage.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            try {
                const specs = parseGcode(content, file.name);

                // Save to localStorage
                saveSession(specs, file.name);

                displayResults(specs);
            } catch (err) {
                console.error(err);
                statusMessage.textContent = 'Error parsing file. Please ensure it is a valid G-code file.';
                clearSession();
            }
        };
        reader.readAsText(file);
    });

    // Copy Rich Text (HTML) for Printables
    btnCopyRich.addEventListener('click', async () => {
        const htmlContent = previewArea.innerHTML;
        try {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const textBlob = new Blob([rawMarkdown.value], { type: 'text/plain' });
            const data = [new ClipboardItem({
                'text/html': blob,
                'text/plain': textBlob
            })];
            await navigator.clipboard.write(data);
            showToast(btnCopyRich, 'Copied!');
        } catch (err) {
            console.error('Failed to copy rich text: ', err);
            alert('Clipboard access failed. Try using Chrome or Edge.');
        }
    });

    // Download All Settings as JSON
    btnCopySettings.addEventListener('click', () => {
        if (!currentSpecs || !currentSpecs.settings) {
            alert('No settings available. Parse a G-code file first.');
            return;
        }

        const settingsJSON = JSON.stringify(currentSpecs, null, 2);
        const blob = new Blob([settingsJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileName.replace(/\.gcode$/i, '') + '_SETTINGS.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(btnCopySettings, 'Downloaded!');
    });

    // Download .md file
    btnDownload.addEventListener('click', () => {
        const blob = new Blob([rawMarkdown.value], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileName.replace(/\.gcode$/i, '') + '_SUMMARY.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function showToast(element, msg) {
        const originalText = element.textContent;
        element.textContent = msg;
        setTimeout(() => {
            element.textContent = originalText;
        }, 2000);
    }

    // --- PARSING LOGIC (Ported from Python) ---

    function parseGcode(content, filename) {
        const specs = {
            filename: filename,
            slicer: null,
            printer_model: null,
            printer_vendor: null,
            nozzle_temp: null,
            bed_temp: null,
            layer_height: null,
            nozzle_diameter: null,
            filament_material: null,
            infill_density: null,
            infill_pattern: null,
            perimeters: null,
            filament_used_g: null,
            print_time_s: null,
            spiral_vase: null,
            variable_layer_height: null,
            support_material: null
        };

        // Detect Slicer
        if (content.includes('PrusaSlicer') || content.includes('SuperSlicer')) {
            specs.slicer = 'PrusaSlicer';
        } else if (content.includes('Cura')) {
            specs.slicer = 'Cura';
        }

        // Material from filename
        const materialMatch = filename.match(/_(\d{2,3}C)_(PLA|PETG|ABS|TPU|NYLON|RESIN|ASA|CF)/i);
        if (materialMatch) {
            specs.filament_material = materialMatch[2].toUpperCase();
        }

        // --- REGEX PATTERNS ---

        // Printer Model
        const modelMatch = content.match(/; printer_model = ([\w\d]+)/);
        if (modelMatch) {
            specs.printer_model = modelMatch[1] === 'ENDER3V2' ? 'Ender 3 V2' : modelMatch[1];
        }

        // Printer Vendor
        const vendorMatch = content.match(/; printer_vendor = ([\w\s]+)/);
        if (vendorMatch) specs.printer_vendor = vendorMatch[1].trim();

        // Layer Height
        const layerMatch = content.match(/; layer_height = ([\d.]+)/) || content.match(/;Layer height: ([\d.]+)/);
        if (layerMatch) specs.layer_height = parseFloat(layerMatch[1]);

        // Nozzle Diameter
        const nozzleDiamMatch = content.match(/; nozzle_diameter = ([\d.]+)/) || content.match(/;Nozzle diameter: ([\d.]+)/);
        if (nozzleDiamMatch) specs.nozzle_diameter = parseFloat(nozzleDiamMatch[1]);

        // Infill
        const infillMatch = content.match(/; fill_density = ([\d.]+)%/);
        if (infillMatch) specs.infill_density = parseFloat(infillMatch[1]);

        const infillPatMatch = content.match(/; infill_pattern = (\w+)/);
        if (infillPatMatch) specs.infill_pattern = infillPatMatch[1];

        // Perimeters
        const perimMatch = content.match(/; perimeters = (\d+)/);
        if (perimMatch) specs.perimeters = parseInt(perimMatch[1]);

        // Temps
        const nozzleTempMatch = content.match(/; first_layer_temperature = (\d+)/) || content.match(/;Nozzle Temp:\s*(\d+)/) || content.match(/M104 S(\d+)/);
        if (nozzleTempMatch) specs.nozzle_temp = parseInt(nozzleTempMatch[1]);

        const bedTempMatch = content.match(/; bed_temperature = (\d+)/) || content.match(/;Bed Temp:\s*(\d+)/) || content.match(/M140 S(\d+)/);
        if (bedTempMatch) specs.bed_temp = parseInt(bedTempMatch[1]);

        // Modes
        const spiralMatch = content.match(/; spiral_vase = ([01])/);
        if (spiralMatch) specs.spiral_vase = spiralMatch[1] === '1';

        const varLayerMatch = content.match(/; variable_layer_height = ([01])/);
        if (varLayerMatch) specs.variable_layer_height = varLayerMatch[1] === '1';

        const supportMatch = content.match(/; support_material = ([01])/);
        if (supportMatch) specs.support_material = supportMatch[1] === '1';

        // Filament Used (Weight)
        // Try Prusa grams first
        const weightMatch = content.match(/; filament used \[g\] = ([\d.]+)/);
        if (weightMatch) {
            specs.filament_used_g = parseFloat(weightMatch[1]);
        } else {
            // Fallback to Cura meters * 1.25
            const metersMatch = content.match(/;Filament used: ([\d.]+)\s*m(?!\w)/);
            if (metersMatch) {
                specs.filament_used_g = parseFloat(metersMatch[1]) * 1.25;
            }
        }

        // Print Time
        // Try Cura seconds first (;TIME:12345)
        const timeMatch = content.match(/;TIME:(\d+)/);
        if (timeMatch) {
            specs.print_time_s = parseInt(timeMatch[1]);
        } else {
            // Try Prusa format (32m 29s)
            const prusaTimeMatch = content.match(/; estimated printing time \(normal mode\) = (\d+)m (\d+)s/);
            if (prusaTimeMatch) {
                specs.print_time_s = (parseInt(prusaTimeMatch[1]) * 60) + parseInt(prusaTimeMatch[2]);
            }
        }

        return specs;
    }

    function formatTime(seconds) {
        if (!seconds) return null;
        const totalMinutes = Math.ceil(seconds / 60);
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return mins === 0
                ? `${hours} Hour${hours > 1 ? 's' : ''}`
                : `${hours} Hour${hours > 1 ? 's' : ''} ${mins} Minute${mins > 1 ? 's' : ''}`;
        }
        return `${totalMinutes} Minute${totalMinutes > 1 ? 's' : ''}`;
    }

    function generateMarkdown(specs) {
        let md = "## Print Specifications\n\n";
        md += "| Specification | Value |\n";
        md += "|---|---|\n";

        const timeStr = formatTime(specs.print_time_s);
        if (timeStr) md += `| Estimated Print Time | ${timeStr} |\n`;

        if (specs.filament_used_g) md += `| Filament Used | ${specs.filament_used_g.toFixed(1)} g |\n`;
        if (specs.layer_height) md += `| Layer Height | ${specs.layer_height.toFixed(2)} mm |\n`;
        if (specs.perimeters) md += `| Wall Thickness | ${specs.perimeters} perimeters |\n`;

        if (specs.infill_density !== null) {
            let infillStr = `${specs.infill_density.toFixed(0)}%`;
            if (specs.infill_pattern) infillStr += ` (${specs.infill_pattern})`;
            md += `| Infill Density | ${infillStr} |\n`;
        }

        if (specs.support_material !== null) {
            md += `| Supports Required | ${specs.support_material ? 'Yes' : 'No'} |\n`;
        }

        if (specs.spiral_vase) md += `| Print Mode | Spiral Vase |\n`;
        if (specs.variable_layer_height) md += `| Adaptive Layer Height | Enabled |\n`;
        if (specs.nozzle_diameter) md += `| Nozzle Diameter | ${specs.nozzle_diameter.toFixed(2)} mm |\n`;

        md += "\n## Settings Used\n\n";

        let settingsParts = [];
        if (specs.filament_material) settingsParts.push(specs.filament_material);
        if (specs.nozzle_diameter) settingsParts.push(`${specs.nozzle_diameter.toFixed(2)}mm`); // Added diameter to settings line too
        if (specs.nozzle_temp) settingsParts.push(`${specs.nozzle_temp}°C Nozzle`);
        if (specs.bed_temp) settingsParts.push(`${specs.bed_temp}°C Bed`);

        if (settingsParts.length > 0) {
            md += `- **This Print:** ${settingsParts.join(' • ')}\n`;
        }

        md += "\n## Print Notes\n\n";
        if (specs.printer_model) {
            md += `- Optimized for **${specs.printer_model}**`;
            if (specs.printer_vendor) md += ` by **${specs.printer_vendor}**`;
            md += "\n";
        }
        if (specs.slicer) md += `- Exported from **${specs.slicer}**\n`;
        md += "- ⚠️ **Adjust temperatures +/-5C** if experiencing adhesion or stringing issues\n";
        md += "- Recommended: Test on a small print first before large jobs\n";

        return md;
    }

    function generateHTML(specs) {
        // Generate HTML that mimics the Markdown table for the preview/rich-copy
        let html = "<h2>Print Specifications</h2>";
        html += "<table><thead><tr><th>Specification</th><th>Value</th></tr></thead><tbody>";

        const timeStr = formatTime(specs.print_time_s);
        if (timeStr) html += `<tr><td>Estimated Print Time</td><td>${timeStr}</td></tr>`;

        if (specs.filament_used_g) html += `<tr><td>Filament Used</td><td>${specs.filament_used_g.toFixed(1)} g</td></tr>`;
        if (specs.layer_height) html += `<tr><td>Layer Height</td><td>${specs.layer_height.toFixed(2)} mm</td></tr>`;
        if (specs.perimeters) html += `<tr><td>Wall Thickness</td><td>${specs.perimeters} perimeters</td></tr>`;

        if (specs.infill_density !== null) {
            let infillStr = `${specs.infill_density.toFixed(0)}%`;
            if (specs.infill_pattern) infillStr += ` (${specs.infill_pattern})`;
            html += `<tr><td>Infill Density</td><td>${infillStr}</td></tr>`;
        }

        if (specs.support_material !== null) {
            html += `<tr><td>Supports Required</td><td>${specs.support_material ? 'Yes' : 'No'}</td></tr>`;
        }

        if (specs.spiral_vase) html += `<tr><td>Print Mode</td><td>Spiral Vase</td></tr>`;
        if (specs.variable_layer_height) html += `<tr><td>Adaptive Layer Height</td><td>Enabled</td></tr>`;
        if (specs.nozzle_diameter) html += `<tr><td>Nozzle Diameter</td><td>${specs.nozzle_diameter.toFixed(2)} mm</td></tr>`;

        html += "</tbody></table>";

        html += "<h2>Settings Used</h2><ul>";
        let settingsParts = [];
        if (specs.filament_material) settingsParts.push(specs.filament_material);
        if (specs.nozzle_diameter) settingsParts.push(`${specs.nozzle_diameter.toFixed(2)}mm`);
        if (specs.nozzle_temp) settingsParts.push(`${specs.nozzle_temp}°C Nozzle`);
        if (specs.bed_temp) settingsParts.push(`${specs.bed_temp}°C Bed`);

        if (settingsParts.length > 0) {
            html += `<li><strong>This Print:</strong> ${settingsParts.join(' • ')}</li>`;
        }
        html += "</ul>";

        html += "<h2>Print Notes</h2><ul>";
        if (specs.printer_model) {
            let modelStr = `Optimized for <strong>${specs.printer_model}</strong>`;
            if (specs.printer_vendor) modelStr += ` by <strong>${specs.printer_vendor}</strong>`;
            html += `<li>${modelStr}</li>`;
        }
        if (specs.slicer) html += `<li>Exported from <strong>${specs.slicer}</strong></li>`;
        html += "<li>⚠️ <strong>Adjust temperatures +/-5C</strong> if experiencing adhesion or stringing issues</li>";
        html += "<li>Recommended: Test on a small print first before large jobs</li>";
        html += "</ul>";

        return html;
    }

    function generateSettingsHTML(specs) {
        // Generate HTML table for all settings (for display in the app)
        if (!specs || Object.keys(specs).length === 0) {
            return "<p style='color: #999;'>No settings extracted.</p>";
        }

        let html = `<table style="width: 100%; border-collapse: collapse; font-size: 0.9em;"><thead><tr style="background: #f5f5f5;"><th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Setting</th><th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Value</th></tr></thead><tbody>`;

        // Sort settings alphabetically
        const sortedKeys = Object.keys(specs).sort();
        for (const key of sortedKeys) {
            if (key === 'filename' || key === 'slicer' || key === 'printer_model' || key === 'printer_vendor' || key === 'nozzle_temp' || key === 'bed_temp' || key === 'layer_height' || key === 'nozzle_diameter' || key === 'filament_material' || key === 'infill_density' || key === 'infill_pattern' || key === 'perimeters' || key === 'filament_used_g' || key === 'print_time_s' || key === 'spiral_vase' || key === 'variable_layer_height' || key === 'support_material') {
                continue; // Skip the basic specs already shown above
            }

            const displayName = key
                .replace(/_/g, ' ')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            const value = specs[key];
            const displayValue = value && value.length > 100 ? value.substring(0, 100) + '...' : value;

            html += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${displayName}</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; color: #666;">${displayValue}</td></tr>`;
        }

        html += "</tbody></table>";
        return html;
    }
});
