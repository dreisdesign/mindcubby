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
    let currentFileContent = null;

    // === RESTORE STATE FROM LOCALSTORAGE ===
    function restoreSession() {
        try {
            const savedSpecs = localStorage.getItem('g-coder_specs');
            const savedFilename = localStorage.getItem('g-coder_filename');

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
        updateProcessTime();
    }

    // === SAVE STATE TO LOCALSTORAGE ===
    function saveSession(specs, filename) {
        try {
            localStorage.setItem('g-coder_specs', JSON.stringify(specs));
            localStorage.setItem('g-coder_filename', filename);
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    }

    // === CLEAR SESSION ===
    function clearSession() {
        localStorage.removeItem('g-coder_specs');
        localStorage.removeItem('g-coder_filename');
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
            currentFileContent = content; // Store for reprocessing
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

    // Reprocess file with current app version
    const btnReprocess = document.getElementById('btnReprocess');
    const processTime = document.getElementById('processTime');

    function updateProcessTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        processTime.textContent = `Processed at ${timeStr}`;
        processTime.classList.remove('hidden');
    }

    btnReprocess.addEventListener('click', () => {
        if (!currentFileContent || !currentFileName) {
            statusMessage.textContent = 'No file loaded. Please select a file first.';
            statusMessage.classList.remove('hidden');
            return;
        }

        try {
            const specs = parseGcode(currentFileContent, currentFileName);
            saveSession(specs, currentFileName);
            displayResults(specs);
            updateProcessTime();
        } catch (err) {
            console.error(err);
            statusMessage.textContent = 'Error reprocessing file.';
            statusMessage.classList.remove('hidden');
        }
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
        if (!currentSpecs) {
            alert('No settings available. Parse a G-code file first.');
            return;
        }

        const settingsJSON = JSON.stringify({
            file: currentFileName,
            extracted_at: new Date().toISOString(),
            print_specs: {
                estimated_print_time: formatTime(currentSpecs.print_time_s),
                filament_used_g: currentSpecs.filament_used_g,
                layer_height: currentSpecs.layer_height,
                nozzle_temp: currentSpecs.nozzle_temp,
                bed_temp: currentSpecs.bed_temp,
                printer_model: currentSpecs.printer_model,
                slicer: currentSpecs.slicer
            },
            all_gcode_settings: currentSpecs.all_settings || {}
        }, null, 2);

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
            top_fill_pattern: null,
            bottom_fill_pattern: null,
            top_shell_layers: null,
            bottom_shell_layers: null,
            perimeters: null,
            filament_used_g: null,
            print_time_s: null,
            spiral_vase: null,
            variable_layer_height: null,
            support_material: null,
            fuzzy_skin: null,
            seam_position: null,
            skirt_loops: null,
            brim_type: null,
            print_sequence: null,
            ironing_type: null
        };

        // Extract ALL settings from G-code comments dynamically
        const settingsRegex = /; ([\w_]+) = (.+?)(?=\n|$)/g;
        let match;
        const allSettings = {};
        const objectLevelSettings = {};  // Store injected object-level settings separately

        while ((match = settingsRegex.exec(content)) !== null) {
            const key = match[1];
            const value = match[2].trim();
            allSettings[key] = value;

            // Also capture injected object-level settings from post-processing script
            // (e.g., ; OBJECT_wall_loops = 3)
            if (key.startsWith('OBJECT_')) {
                const actualKey = key.substring(7);  // Remove 'OBJECT_' prefix
                objectLevelSettings[actualKey] = value;
            }

            // Map key settings to specs object for Printables output
            if (key === 'printer_model') specs.printer_model = value === 'ENDER3V2' ? 'Ender 3 V2' : value;
            if (key === 'printer_vendor') specs.printer_vendor = value;
            if (key === 'layer_height') specs.layer_height = parseFloat(value);
            if (key === 'nozzle_diameter') specs.nozzle_diameter = parseFloat(value);
            if (key === 'fill_density') specs.infill_density = parseFloat(value);
            if (key === 'infill_pattern') specs.infill_pattern = value;
            if (key === 'top_fill_pattern') specs.top_fill_pattern = value;
            if (key === 'bottom_fill_pattern') specs.bottom_fill_pattern = value;
            if (key === 'top_solid_layers' || key === 'top_shell_layers') specs.top_shell_layers = parseInt(value);
            if (key === 'bottom_solid_layers' || key === 'bottom_shell_layers') specs.bottom_shell_layers = parseInt(value);
            if (key === 'perimeters') specs.perimeters = parseInt(value);
            if (key === 'first_layer_temperature') specs.nozzle_temp = parseInt(value);
            if (key === 'bed_temperature') specs.bed_temp = parseInt(value);
            if (key === 'spiral_vase') specs.spiral_vase = value === '1';
            if (key === 'spiral_mode') specs.spiral_vase = value === '1';  // OrcaSlicer format
            if (key === 'variable_layer_height') specs.variable_layer_height = value === '1';
            if (key === 'support_material') specs.support_material = value === '1';
            // Fuzzy skin - check both global setting and object-level parameters
            // In OrcaSlicer, object-level fuzzy skin has non-zero thickness/distance even if global = 'none'
            if (key === 'fuzzy_skin' && value !== 'none') {
                specs.fuzzy_skin = value;
            }
            if (key === 'fuzzy_skin_thickness' && parseFloat(value) > 0) {
                if (!specs.fuzzy_skin) specs.fuzzy_skin = 'displacement';  // Default mode
            }
            if (key === 'fuzzy_skin_point_distance' && parseFloat(value) > 0) {
                if (!specs.fuzzy_skin) specs.fuzzy_skin = 'displacement';  // Default mode
            }
            if (key === 'fuzzy_skin_mode' && !specs.fuzzy_skin && allSettings['fuzzy_skin_thickness'] > 0) {
                specs.fuzzy_skin = value;
            }
            if (key === 'seam_position') specs.seam_position = value;
            if (key === 'brim_type') specs.brim_type = value;
            if (key === 'skirt_loops') specs.skirt_loops = parseInt(value);
            if (key === 'print_sequence') specs.print_sequence = value;
            if (key === 'ironing_type') specs.ironing_type = value;
        }

        // Apply object-level setting overrides (from post-processing script injection)
        // These take priority over global settings
        if (objectLevelSettings['wall_loops']) {
            specs.perimeters = parseInt(objectLevelSettings['wall_loops']);
        }
        if (objectLevelSettings['top_shell_layers']) {
            specs.top_shell_layers = parseInt(objectLevelSettings['top_shell_layers']);
        }
        if (objectLevelSettings['bottom_shell_layers']) {
            specs.bottom_shell_layers = parseInt(objectLevelSettings['bottom_shell_layers']);
        }
        if (objectLevelSettings['fuzzy_skin']) {
            specs.fuzzy_skin = objectLevelSettings['fuzzy_skin'];
        }
        if (objectLevelSettings['fuzzy_skin_thickness']) {
            const thickness = parseFloat(objectLevelSettings['fuzzy_skin_thickness']);
            if (thickness > 0 && !specs.fuzzy_skin) {
                specs.fuzzy_skin = 'displacement';
            }
        }
        if (objectLevelSettings['fuzzy_skin_point_distance']) {
            const distance = parseFloat(objectLevelSettings['fuzzy_skin_point_distance']);
            if (distance > 0 && !specs.fuzzy_skin) {
                specs.fuzzy_skin = 'displacement';
            }
        }
        if (objectLevelSettings['seam_position']) {
            specs.seam_position = objectLevelSettings['seam_position'];
        }
        if (objectLevelSettings['brim_type']) {
            specs.brim_type = objectLevelSettings['brim_type'];
        }

        // Store all extracted settings for the settings display
        specs.all_settings = allSettings;

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

        // Fallback patterns for older/different formats
        const nozzleTempMatch = content.match(/;Nozzle Temp:\s*(\d+)/) || content.match(/M104 S(\d+)/);
        if (nozzleTempMatch && !specs.nozzle_temp) specs.nozzle_temp = parseInt(nozzleTempMatch[1]);

        const bedTempMatch = content.match(/;Bed Temp:\s*(\d+)/) || content.match(/M140 S(\d+)/);
        if (bedTempMatch && !specs.bed_temp) specs.bed_temp = parseInt(bedTempMatch[1]);

        // Filament Used (Weight)
        const weightMatch = content.match(/; filament used \[g\] = ([\d.]+)/);
        if (weightMatch) {
            specs.filament_used_g = parseFloat(weightMatch[1]);
        } else {
            const metersMatch = content.match(/;Filament used: ([\d.]+)\s*m(?!\w)/);
            if (metersMatch) {
                specs.filament_used_g = parseFloat(metersMatch[1]) * 1.25;
            }
        }

        // Print Time
        const timeMatch = content.match(/;TIME:(\d+)/);
        if (timeMatch) {
            specs.print_time_s = parseInt(timeMatch[1]);
        } else {
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
        let lines = [];

        // Title (cleaned filename)
        const cleanedName = cleanFilenameForDisplay(specs.filename);
        lines.push(`**${cleanedName}**`);

        // Print Time only
        const timeStr = formatTime(specs.print_time_s);
        if (timeStr) {
            lines.push("");  // Blank line
            lines.push(timeStr);
        }

        // Layer Settings
        lines.push("");  // Blank line separator
        if (specs.layer_height) {
            lines.push(`Layer Height: **${specs.layer_height.toFixed(2)}mm**`);
        }
        if (specs.perimeters) {
            lines.push(`Walls: **${specs.perimeters}**`);
        }
        if (specs.variable_layer_height) {
            lines.push(`Variable Layer Height: **Yes**`);
        }

        // Infill & Surface
        if (specs.infill_density !== null && specs.infill_density > 0) {
            let infillStr = `**${specs.infill_density.toFixed(0)}%**`;
            if (specs.infill_pattern) {
                infillStr += ` (${specs.infill_pattern.charAt(0).toUpperCase() + specs.infill_pattern.slice(1)})`;
            }
            lines.push(`Infill: ${infillStr}`);
        }

        // Top/Bottom Layers
        const topLayers = specs.top_shell_layers;
        const bottomLayers = specs.bottom_shell_layers;
        if (topLayers !== null && topLayers !== undefined) {
            lines.push(`Top Layers: **${topLayers}**`);
        }
        if (bottomLayers !== null && bottomLayers !== undefined) {
            lines.push(`Bottom Layers: **${bottomLayers}**`);
        }

        // Surface patterns only if layers exist
        if (topLayers && topLayers > 0 && specs.top_fill_pattern) {
            const patternDisplay = specs.top_fill_pattern.replace('monotonicline', 'Monotonic Line').replace('rectilinear', 'Rectilinear');
            lines.push(`Top Surface Pattern: ${patternDisplay.charAt(0).toUpperCase() + patternDisplay.slice(1)}`);
        }
        if (bottomLayers && bottomLayers > 0 && specs.bottom_fill_pattern) {
            const patternDisplay = specs.bottom_fill_pattern.replace('archimedeanchords', 'Archimedes Chords').replace('rectilinear', 'Rectilinear');
            lines.push(`Bottom Surface Pattern: ${patternDisplay.charAt(0).toUpperCase() + patternDisplay.slice(1)}`);
        }

        // Supporting Structure
        lines.push("");  // Blank line separator
        if (specs.brim_type && specs.brim_type !== 'no_brim') {
            const brimDisplay = specs.brim_type.replace(/_/g, ' ');
            lines.push(`Brim: ${brimDisplay.charAt(0).toUpperCase() + brimDisplay.slice(1)}`);
        }
        if (specs.skirt_loops) {
            lines.push(`Skirt: **${specs.skirt_loops}** loops`);
        }
        if (specs.print_sequence && specs.print_sequence.toLowerCase() !== 'by object') {
            const printSeqDisplay = specs.print_sequence.replace('by object', 'By Object').replace('by layer', 'By Layer');
            lines.push(`Wall Print Order: ${printSeqDisplay.charAt(0).toUpperCase() + printSeqDisplay.slice(1)}`);
        }

        // Special Effects
        lines.push("");  // Blank line separator
        if (specs.spiral_vase) {
            lines.push(`Spiral Vase: **Yes**`);
        }
        if (specs.fuzzy_skin) {
            lines.push(`Fuzzy Texture: Enabled`);
        }
        if (specs.ironing_type && specs.ironing_type !== 'no ironing') {
            const ironingDisplay = specs.ironing_type.replace(/_/g, ' ');
            lines.push(`Ironing: ${ironingDisplay.charAt(0).toUpperCase() + ironingDisplay.slice(1)}`);
        }
        if (specs.support_material) {
            lines.push(`Supports: **Yes**`);
        }
        if (specs.seam_position && specs.seam_position !== 'aligned') {
            const seamDisplay = specs.seam_position.charAt(0).toUpperCase() + specs.seam_position.slice(1);
            lines.push(`Seam Position: ${seamDisplay}`);
        }

        // Join with newlines and add trailing newline for multi-part pasting
        let md = lines.join("\n") + "\n";

        return md;
    }

    function generateHTML(specs) {
        // Generate simplified HTML format matching the Python output
        let html = "";

        // Title (cleaned filename)
        const cleanedName = cleanFilenameForDisplay(specs.filename);
        html += `<p><strong>${cleanedName}</strong></p>`;

        // Print Time only (no filament details)
        const timeStr = formatTime(specs.print_time_s);
        if (timeStr) {
            html += `<p></p>`;  // Blank line
            html += `<p>${timeStr}</p>`;
        }

        // Layer Settings
        html += `<p></p>`;  // Blank line separator
        if (specs.layer_height) {
            html += `<p>Layer Height: <strong>${specs.layer_height.toFixed(2)}mm</strong></p>`;
        }
        if (specs.perimeters) {
            html += `<p>Walls: <strong>${specs.perimeters}</strong></p>`;
        }
        if (specs.variable_layer_height) {
            html += `<p>Variable Layer Height: <strong>Yes</strong></p>`;
        }

        // Infill & Surface
        if (specs.infill_density !== null && specs.infill_density > 0) {
            let infillStr = `<strong>${specs.infill_density.toFixed(0)}%</strong>`;
            if (specs.infill_pattern) {
                infillStr += ` (${specs.infill_pattern.charAt(0).toUpperCase() + specs.infill_pattern.slice(1)})`;
            }
            html += `<p>Infill: ${infillStr}</p>`;
        }

        // Top/Bottom Layers
        const topLayers = specs.top_shell_layers;
        const bottomLayers = specs.bottom_shell_layers;
        if (topLayers !== null && topLayers !== undefined) {
            html += `<p>Top Layers: <strong>${topLayers}</strong></p>`;
        }
        if (bottomLayers !== null && bottomLayers !== undefined) {
            html += `<p>Bottom Layers: <strong>${bottomLayers}</strong></p>`;
        }

        // Surface patterns if layers exist
        if (topLayers && topLayers > 0 && specs.top_fill_pattern) {
            const patternDisplay = specs.top_fill_pattern.replace('monotonicline', 'Monotonic Line').replace('rectilinear', 'Rectilinear');
            html += `<p>Top Surface Pattern: ${patternDisplay.charAt(0).toUpperCase() + patternDisplay.slice(1)}</p>`;
        }
        if (bottomLayers && bottomLayers > 0 && specs.bottom_fill_pattern) {
            const patternDisplay = specs.bottom_fill_pattern.replace('archimedeanchords', 'Archimedes Chords').replace('rectilinear', 'Rectilinear');
            html += `<p>Bottom Surface Pattern: ${patternDisplay.charAt(0).toUpperCase() + patternDisplay.slice(1)}</p>`;
        }

        // Vase-style note
        if (topLayers === 0 && bottomLayers === 0) {
            html += `<p>Top/Bottom: <strong>None</strong></p>`;
        }

        // Supporting Structure
        html += `<p></p>`;  // Blank line separator
        if (specs.brim_type && specs.brim_type !== 'no_brim') {
            const brimDisplay = specs.brim_type.replace(/_/g, ' ');
            html += `<p>Brim: ${brimDisplay.charAt(0).toUpperCase() + brimDisplay.slice(1)}</p>`;
        }
        if (specs.skirt_loops) {
            html += `<p>Skirt: <strong>${specs.skirt_loops}</strong> loops</p>`;
        }
        if (specs.print_sequence) {
            const printSeqDisplay = specs.print_sequence.replace('by object', 'By Object').replace('by layer', 'By Layer');
            html += `<p>Wall Print Order: ${printSeqDisplay.charAt(0).toUpperCase() + printSeqDisplay.slice(1)}</p>`;
        }

        // Special Effects
        html += `<p></p>`;  // Blank line separator
        if (specs.spiral_vase) {
            html += `<p>Spiral Vase: <strong>Yes</strong></p>`;
        }
        if (specs.fuzzy_skin) {
            const fuzzyDisplay = specs.fuzzy_skin.replace('allwalls', 'All Walls').replace('outside', 'Outside Only').replace('displacement', 'Displacement');
            html += `<p>Fuzzy Texture: ${fuzzyDisplay.charAt(0).toUpperCase() + fuzzyDisplay.slice(1)}</p>`;
        }
        if (specs.ironing_type && specs.ironing_type !== 'no ironing') {
            const ironingDisplay = specs.ironing_type.replace(/_/g, ' ');
            html += `<p>Ironing: ${ironingDisplay.charAt(0).toUpperCase() + ironingDisplay.slice(1)}</p>`;
        }
        if (specs.support_material) {
            html += `<p>Supports: <strong>Yes</strong></p>`;
        }
        if (specs.seam_position && specs.seam_position !== 'aligned') {
            const seamDisplay = specs.seam_position.charAt(0).toUpperCase() + specs.seam_position.slice(1);
            html += `<p>Seam Position: ${seamDisplay}</p>`;
        }

        return html;
    }

    function cleanFilenameForDisplay(filename) {
        // Remove extension
        let name = filename.replace(/\.(gcode|md|html|json)$/i, '');
        // Remove time patterns like _3m12s, _1h30m
        name = name.replace(/_\d+h?\d*m\d*s?/g, '');
        // Remove filament type suffix
        name = name.replace(/(PLA|PETG|ABS|TPU|ASA)$/i, '');
        // Remove common prefixes
        name = name.replace(/^CE3E3V2[_ ]?/i, '');
        name = name.replace(/^MC3D[_ ]?/i, '');
        name = name.replace(/[_ ]?MC3D[_ ]?/gi, ' ');
        // Replace hyphens and underscores with spaces
        name = name.replace(/[-_]/g, ' ');
        // Collapse multiple spaces
        name = name.replace(/\s+/g, ' ').trim();
        return name;
    }

    function generateSettingsHTML(specs) {
        // Generate HTML table for all extracted settings
        if (!specs || !specs.all_settings || Object.keys(specs.all_settings).length === 0) {
            return "<p style='color: #999;'>No additional settings found.</p>";
        }

        let html = `<table style="width: 100%; border-collapse: collapse; font-size: 0.9em; table-layout: auto; min-width: 0;"><thead><tr style="background: #f5f5f5;"><th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; min-width: 150px;">Setting</th><th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; min-width: 200px; word-break: break-word;">Value</th></tr></thead><tbody>`;

        // Sort settings alphabetically
        const sortedKeys = Object.keys(specs.all_settings).sort();
        for (const key of sortedKeys) {
            const displayName = key
                .replace(/_/g, ' ')
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            const value = specs.all_settings[key];
            const displayValue = value && value.length > 150 ? value.substring(0, 150) + '...' : value;

            html += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; min-width: 150px;">${displayName}</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; color: #666; min-width: 200px; word-break: break-word;">${displayValue}</td></tr>`;
        }

        html += "</tbody></table>";
        return html;
    }
});
