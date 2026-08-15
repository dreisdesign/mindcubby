// Helper function to format setting values (handle arrays without JSON brackets)
function formatSettingValue(value) {
    if (Array.isArray(value)) {
        // Extract first element if array has items, otherwise return empty string
        if (value.length === 0) return '';
        // Recursively format the first element in case it's also nested
        return formatSettingValue(value[0]);
    }
    if (typeof value === 'object' && value !== null) {
        // Only stringify complex objects, not simple values
        return JSON.stringify(value);
    }
    // Convert to string and return
    return String(value);
}

// Setting category mapping for hierarchical display
const SETTING_CATEGORIES = {
    'Filament': {
        'Temperature': ['nozzle_temperature', 'bed_temperature', 'first_layer_temperature'],
        'Cooling': ['additional_cooling_fan_speed', 'filament_cooling_moves', 'filament_cooling_initial_speed'],
        'Retraction': ['filament_retraction_speed', 'filament_z_hop', 'filament_z_hop_types'],
        'Flow & Pressure': ['filament_flow_ratio', 'filament_max_volumetric_speed', 'pressure_advance']
    },
    'Process': {
        'Layer': ['layer_height', 'first_layer_height', 'max_layer_height', 'min_layer_height'],
        'Walls': ['wall_loops', 'outer_wall_speed', 'inner_wall_speed', 'outer_wall_acceleration', 'precise_outer_wall', 'reduce_crossing_wall'],
        'Infill': ['infill_density', 'infill_pattern', 'sparse_infill_density'],
        'Top/Bottom': ['top_shell_layers', 'bottom_shell_layers', 'top_solid_infill_flow_ratio'],
        'Quality': ['elefant_foot_compensation', 'first_layer_flow_ratio', 'initial_layer_line_width'],
        'Features': ['extra_perimeters_on_overhangs', 'seam_position', 'brim_type', 'skirt_loops'],
        'Speed': ['full_fan_speed_layer', 'slow_down_layer_time']
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const resultsSection = document.getElementById('resultsSection');
    const previewArea = document.getElementById('previewArea');
    const settingsArea = document.getElementById('settingsArea');
    const rawMarkdown = document.getElementById('rawMarkdown');
    const statusMessage = document.getElementById('statusMessage');

    const btnCopyRich = document.getElementById('btnCopyRich');
    const btnDownload = document.getElementById('btnDownload');
    const btnReprocess = document.getElementById('btnReprocess');
    const processTime = document.getElementById('processTime');

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
        const settingsHTML = generateSettingsHTML(specs);

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

    // === HANDLE .gcode.3mf ZIP FILE ===
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        currentFileName = file.name;
        fileNameDisplay.textContent = file.name;
        statusMessage.textContent = 'Processing...';
        statusMessage.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (file.name.endsWith('.gcode')) {
                    // Plain G-code file
                    const gcodeContent = event.target.result;
                    currentFileContent = { gcodeContent };
                    const specs = parseGcode(gcodeContent, file.name, null, null);
                    saveSession(specs, file.name);
                    displayResults(specs);
                } else if (file.name.endsWith('.3mf')) {
                    // OrcaSlicer .3mf file (ZIP archive)
                    const arrayBuffer = event.target.result;
                    const zip = new JSZip();
                    const zipContents = await zip.loadAsync(arrayBuffer);

                    let gcodeContent = null;
                    let configContent = null;
                    let layerRangesContent = null;

                    for (const fileName in zipContents.files) {
                        if (fileName.startsWith('Metadata/plate_') && fileName.endsWith('.gcode')) {
                            gcodeContent = await zipContents.files[fileName].async('string');
                        }
                        if (fileName === 'Metadata/project_settings.config') {
                            configContent = await zipContents.files[fileName].async('string');
                        }
                        if (fileName === 'Metadata/layer_config_ranges.xml') {
                            layerRangesContent = await zipContents.files[fileName].async('string');
                        }
                    }

                    if (!gcodeContent) {
                        throw new Error('No gcode file found in ZIP');
                    }

                    currentFileContent = { gcodeContent, configContent, layerRangesContent };
                    const specs = parseGcode(gcodeContent, file.name, configContent, layerRangesContent);
                    saveSession(specs, file.name);
                    displayResults(specs);
                } else {
                    throw new Error('Unsupported file type. Please select a .gcode or .3mf file.');
                }
            } catch (err) {
                console.error(err);
                statusMessage.textContent = 'Error processing file: ' + err.message;
                clearSession();
            }
        };

        if (file.name.endsWith('.gcode')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });

    // === REPROCESS FILE WITH CURRENT APP VERSION ===
    function updateProcessTime() {
        // Guard against null reference
        if (!processTime) {
            console.warn('processTime element not found in DOM');
            return;
        }
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
            const specs = parseGcode(
                currentFileContent.gcodeContent,
                currentFileName,
                currentFileContent.configContent,
                currentFileContent.layerRangesContent
            );
            saveSession(specs, currentFileName);
            displayResults(specs);
            updateProcessTime();
        } catch (err) {
            console.error(err);
            statusMessage.textContent = 'Error reprocessing file.';
            statusMessage.classList.remove('hidden');
        }
    });

    // Hide Printables-related UI elements
    if (btnCopyRich) btnCopyRich.style.display = 'none';

    // Helper function to detect if extracted and computed values differ
    function valuesDiffer(extracted, computed) {
        // Normalize for comparison (handle string/number conversions)
        const normExtracted = String(extracted).toLowerCase().trim();
        const normComputed = String(computed).toLowerCase().trim();
        return normExtracted !== normComputed;
    }

    // Download All Settings as JSON
    // Hide markdown download button and preview area
    if (btnDownload) btnDownload.style.display = 'none';
    if (previewArea) previewArea.style.display = 'none';

    function showToast(element, msg) {
        const originalText = element.textContent;
        element.textContent = msg;
        setTimeout(() => {
            element.textContent = originalText;
        }, 2000);
    }

    // Helper function to format print time
    function formatTime(seconds) {
        if (!seconds) return null;
        const totalMinutes = Math.ceil(seconds / 60);
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return mins === 0
                ? `${hours} Hour${hours > 1 ? 's' : ''}`
                : `${hours}h ${mins}m`;
        }
        return `${totalMinutes} Minute${totalMinutes > 1 ? 's' : ''}`;
    }

    // === SHARED EXPORT DATA BUILDER ===
    // Builds hierarchical export data matching the display order exactly
    function buildHierarchicalExportData() {
        if (!currentSpecs) return [];
        
        const rows = [];
        
        // === PROFILE SETTINGS (from object_level_settings) ===
        if (currentSpecs.hierarchy && currentSpecs.hierarchy.object_level_settings) {
            const objectSettings = currentSpecs.hierarchy.object_level_settings;
            if (Object.keys(objectSettings).length > 0) {
                rows.push({ type: 'section_header', label: 'Profile Settings' });
                
                // Organize by categories (matching display logic)
                const categorizedSettings = {};
                for (const [category, subcategories] of Object.entries(SETTING_CATEGORIES)) {
                    categorizedSettings[category] = {};
                    for (const [subcategory, settingsList] of Object.entries(subcategories)) {
                        categorizedSettings[category][subcategory] = [];
                        for (const setting of settingsList) {
                            if (objectSettings.hasOwnProperty(setting)) {
                                const val = objectSettings[setting];
                                const displayValue = formatSettingValue(val);
                                categorizedSettings[category][subcategory].push({ setting, value: displayValue });
                            }
                        }
                    }
                    // Remove empty subcategories
                    for (const subcat in categorizedSettings[category]) {
                        if (categorizedSettings[category][subcat].length === 0) {
                            delete categorizedSettings[category][subcat];
                        }
                    }
                    // Remove empty categories
                    if (Object.keys(categorizedSettings[category]).length === 0) {
                        delete categorizedSettings[category];
                    }
                }
                
                // Add rows for each category/subcategory
                for (const [category, subcategories] of Object.entries(categorizedSettings)) {
                    rows.push({ type: 'category_header', label: `${category} Profile` });
                    for (const [subcategory, settings] of Object.entries(subcategories)) {
                        rows.push({ type: 'subcategory_header', label: subcategory });
                        for (const { setting, value } of settings) {
                            rows.push({ type: 'setting', key: setting, value, section: `${category}: ${subcategory}` });
                        }
                    }
                }
            }
        }
        
        // === LAYER RANGES ===
        if (currentSpecs.hierarchy && currentSpecs.hierarchy.layer_ranges && currentSpecs.hierarchy.layer_ranges.length > 0) {
            rows.push({ type: 'section_header', label: 'Layer Ranges' });
            for (let i = 0; i < currentSpecs.hierarchy.layer_ranges.length; i++) {
                const range = currentSpecs.hierarchy.layer_ranges[i];
                const min_z = range.z_range.min;
                const max_z = range.z_range.max;
                rows.push({ type: 'range_header', label: `Layer Range ${min_z}–${max_z}mm` });
                for (const [key, value] of Object.entries(range.merged_effective || {})) {
                    const displayValue = formatSettingValue(value);
                    rows.push({ type: 'setting', key, value: displayValue, section: `Layer Range ${min_z}–${max_z}mm` });
                }
            }
        }
        
        // === GLOBAL SETTINGS ===
        if (currentSpecs.hierarchy && currentSpecs.hierarchy.global_settings) {
            const globalSettings = currentSpecs.hierarchy.global_settings;
            if (Object.keys(globalSettings).length > 0) {
                rows.push({ type: 'section_header', label: 'Global Settings' });
                for (const [key, value] of Object.entries(globalSettings)) {
                    const displayValue = formatSettingValue(value);
                    rows.push({ type: 'setting', key, value: displayValue, section: 'Global' });
                }
            }
        }
        
        return rows;
    }

    // Export as JSON (hierarchical, matching display)
    const btnExportJSON = document.getElementById('btnExportJSON');
    if (btnExportJSON) {
        btnExportJSON.addEventListener('click', () => {
            if (!currentSpecs) {
                alert('No settings available. Parse a G-code file first.');
                return;
            }

            const exportRows = buildHierarchicalExportData();
            
            // Convert to hierarchical JSON structure
            const hierarchicalJSON = {
                file: currentFileName,
                slicer: currentSpecs.slicer || 'Unknown',
                printer: currentSpecs.printer_model || 'Unknown',
                hierarchy: {
                    profile_settings: currentSpecs.hierarchy?.object_level_settings || {},
                    layer_ranges: (currentSpecs.hierarchy?.layer_ranges || []).map(r => ({
                        z_range: r.z_range,
                        settings: r.merged_effective || {}
                    })),
                    global_settings: currentSpecs.hierarchy?.global_settings || {}
                }
            };

            const pureJSON = JSON.stringify(hierarchicalJSON, null, 2);
            const blob = new Blob([pureJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName.replace(/\.gcode$/i, '') + '_SETTINGS.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(btnExportJSON, 'Downloaded!');
        });
    }

    // Export as CSV (hierarchical, matching display order)
    const btnExportCSV = document.getElementById('btnExportCSV');
    if (btnExportCSV) {
        btnExportCSV.addEventListener('click', () => {
            if (!currentSpecs) {
                alert('No settings available. Parse a G-code file first.');
                return;
            }

            const exportRows = buildHierarchicalExportData();
            
            // Build CSV matching display structure
            let csvContent = 'Setting,Value\n';
            
            for (const row of exportRows) {
                if (row.type === 'section_header') {
                    // Add blank line before section
                    csvContent += '\n';
                    csvContent += `${row.label}\n`;
                } else if (row.type === 'category_header') {
                    csvContent += `${row.label}\n`;
                } else if (row.type === 'subcategory_header') {
                    csvContent += `${row.label}\n`;
                } else if (row.type === 'range_header') {
                    csvContent += `${row.label}\n`;
                } else if (row.type === 'setting') {
                    // Escape quotes in values for CSV
                    const escapedValue = String(row.value).replace(/"/g, '""');
                    csvContent += `"${row.key}","${escapedValue}"\n`;
                }
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName.replace(/\.gcode$/i, '') + '_SETTINGS.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(btnExportCSV, 'Downloaded!');
        });
    }




    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // --- PARSING LOGIC (Ported from Python) ---

    function parseGcode(content, filename, configContent = null, layerRangesContent = null) {
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
        const extractionLog = {};  // Track raw G-code lines for verification

        while ((match = settingsRegex.exec(content)) !== null) {
            const key = match[1];
            const value = match[2].trim();
            const rawLine = match[0];  // Full extracted line
            allSettings[key] = value;
            extractionLog[key] = {
                raw_line: rawLine,
                extracted_value: value,
                is_override: key.startsWith('OBJECT_'),
                computed_value: null  // Will be set after processing
            };

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

        // === IDENTIFY OBJECT-LEVEL OVERRIDES FROM ORCASLICER ===
        // OrcaSlicer marks per-object overrides in "different_settings_to_system" list
        if (allSettings['different_settings_to_system']) {
            const differentSettingsList = allSettings['different_settings_to_system']
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const overrideKey of differentSettingsList) {
                // Find matching settings by checking various naming conventions
                if (allSettings[overrideKey]) {
                    objectLevelSettings[overrideKey] = allSettings[overrideKey];
                }
                // Also check for alternate names
                else if (overrideKey === 'top_shell_layers' && allSettings['top_solid_layers']) {
                    objectLevelSettings[overrideKey] = allSettings['top_solid_layers'];
                }
                else if (overrideKey === 'bottom_shell_layers' && allSettings['bottom_solid_layers']) {
                    objectLevelSettings[overrideKey] = allSettings['bottom_solid_layers'];
                }
                else if (overrideKey === 'wall_loops' && allSettings['perimeters']) {
                    objectLevelSettings[overrideKey] = allSettings['perimeters'];
                }
            }
        }

        // Apply object-level setting overrides (from post-processing script injection)
        // These take priority over global settings
        if (objectLevelSettings['wall_loops']) {
            specs.perimeters = parseInt(objectLevelSettings['wall_loops']);
            extractionLog['perimeters'] = extractionLog['perimeters'] || {};
            extractionLog['perimeters'].computed_value = specs.perimeters;
            extractionLog['perimeters'].override_source = 'OBJECT_wall_loops';
        }
        if (objectLevelSettings['top_shell_layers']) {
            specs.top_shell_layers = parseInt(objectLevelSettings['top_shell_layers']);
            extractionLog['top_shell_layers'] = extractionLog['top_shell_layers'] || {};
            extractionLog['top_shell_layers'].computed_value = specs.top_shell_layers;
            extractionLog['top_shell_layers'].override_source = 'OBJECT_top_shell_layers';
        }
        if (objectLevelSettings['bottom_shell_layers']) {
            specs.bottom_shell_layers = parseInt(objectLevelSettings['bottom_shell_layers']);
            extractionLog['bottom_shell_layers'] = extractionLog['bottom_shell_layers'] || {};
            extractionLog['bottom_shell_layers'].computed_value = specs.bottom_shell_layers;
            extractionLog['bottom_shell_layers'].override_source = 'OBJECT_bottom_shell_layers';
        }
        if (objectLevelSettings['fuzzy_skin']) {
            specs.fuzzy_skin = objectLevelSettings['fuzzy_skin'];
            extractionLog['fuzzy_skin'] = extractionLog['fuzzy_skin'] || {};
            extractionLog['fuzzy_skin'].computed_value = specs.fuzzy_skin;
            extractionLog['fuzzy_skin'].override_source = 'OBJECT_fuzzy_skin';
        }
        if (objectLevelSettings['fuzzy_skin_thickness']) {
            const thickness = parseFloat(objectLevelSettings['fuzzy_skin_thickness']);
            if (thickness > 0 && !specs.fuzzy_skin) {
                specs.fuzzy_skin = 'displacement';
            }
            extractionLog['fuzzy_skin_thickness'] = extractionLog['fuzzy_skin_thickness'] || {};
            extractionLog['fuzzy_skin_thickness'].computed_value = specs.fuzzy_skin;
            extractionLog['fuzzy_skin_thickness'].override_source = 'OBJECT_fuzzy_skin_thickness';
        }
        if (objectLevelSettings['fuzzy_skin_point_distance']) {
            const distance = parseFloat(objectLevelSettings['fuzzy_skin_point_distance']);
            if (distance > 0 && !specs.fuzzy_skin) {
                specs.fuzzy_skin = 'displacement';
            }
            extractionLog['fuzzy_skin_point_distance'] = extractionLog['fuzzy_skin_point_distance'] || {};
            extractionLog['fuzzy_skin_point_distance'].computed_value = specs.fuzzy_skin;
            extractionLog['fuzzy_skin_point_distance'].override_source = 'OBJECT_fuzzy_skin_point_distance';
        }
        if (objectLevelSettings['seam_position']) {
            specs.seam_position = objectLevelSettings['seam_position'];
            extractionLog['seam_position'] = extractionLog['seam_position'] || {};
            extractionLog['seam_position'].computed_value = specs.seam_position;
            extractionLog['seam_position'].override_source = 'OBJECT_seam_position';
        }
        if (objectLevelSettings['brim_type']) {
            specs.brim_type = objectLevelSettings['brim_type'];
            extractionLog['brim_type'] = extractionLog['brim_type'] || {};
            extractionLog['brim_type'].computed_value = specs.brim_type;
            extractionLog['brim_type'].override_source = 'OBJECT_brim_type';
        }

        // Update computed_value in extraction log for all mapped specs
        // This creates the side-by-side comparison for verification
        const computedValueMap = {
            'printer_model': specs.printer_model,
            'printer_vendor': specs.printer_vendor,
            'layer_height': specs.layer_height,
            'nozzle_diameter': specs.nozzle_diameter,
            'fill_density': specs.infill_density,
            'infill_pattern': specs.infill_pattern,
            'top_fill_pattern': specs.top_fill_pattern,
            'bottom_fill_pattern': specs.bottom_fill_pattern,
            'top_shell_layers': specs.top_shell_layers,
            'bottom_shell_layers': specs.bottom_shell_layers,
            'perimeters': specs.perimeters,
            'first_layer_temperature': specs.nozzle_temp,
            'bed_temperature': specs.bed_temp,
            'spiral_vase': specs.spiral_vase,
            'variable_layer_height': specs.variable_layer_height,
            'support_material': specs.support_material,
            'fuzzy_skin': specs.fuzzy_skin,
            'seam_position': specs.seam_position,
            'brim_type': specs.brim_type,
            'skirt_loops': specs.skirt_loops,
            'print_sequence': specs.print_sequence,
            'ironing_type': specs.ironing_type
        };

        // Special handling for fields that should keep their extracted values
        // fuzzy_skin_* parameters should show their actual values, not the parent fuzzy_skin state
        // spiral_mode should show "0"/"1" not boolean conversion
        const preserveExtractedValue = new Set([
            'fuzzy_skin_mode',
            'fuzzy_skin_thickness',
            'fuzzy_skin_point_distance',
            'spiral_mode'
        ]);

        for (const [key, value] of Object.entries(computedValueMap)) {
            if (extractionLog[key] && extractionLog[key].computed_value === null) {
                extractionLog[key].computed_value = value;
            }
        }

        // For preserved fields, keep extracted value as computed value
        for (const key of preserveExtractedValue) {
            if (extractionLog[key]) {
                extractionLog[key].computed_value = extractionLog[key].extracted_value;
            }
        }

        // Store all extracted settings and extraction log for verification
        specs.all_settings = allSettings;
        specs.extraction_log = extractionLog;

        // === BUILD COMPREHENSIVE OVERRIDE MAP ===
        // Track global vs object-level settings for AI troubleshooting
        const globalSettings = {};
        const objectSettings = {};

        for (const [key, value] of Object.entries(allSettings)) {
            if (!key.startsWith('OBJECT_')) {
                globalSettings[key] = value;
            }
        }

        for (const [key, value] of Object.entries(objectLevelSettings)) {
            objectSettings[key] = value;
        }

        // === BUILD ACTUAL SETTINGS (What Will Actually Print) ===
        // Priority: object-level > global
        const actualSettings = {};

        // Map global settings to actual settings
        const settingsMappings = {
            'top_shell_layers': 'top_shell_layers',
            'top_solid_layers': 'top_shell_layers',
            'bottom_shell_layers': 'bottom_shell_layers',
            'bottom_solid_layers': 'bottom_shell_layers',
            'wall_loops': 'perimeters',
            'perimeters': 'perimeters',
            'layer_height': 'layer_height',
            'nozzle_diameter': 'nozzle_diameter',
            'fill_density': 'infill_density',
            'infill_pattern': 'infill_pattern',
            'top_fill_pattern': 'top_fill_pattern',
            'bottom_fill_pattern': 'bottom_fill_pattern',
            'first_layer_temperature': 'nozzle_temp',
            'nozzle_temperature': 'nozzle_temp',
            'bed_temperature': 'bed_temp',
            'fuzzy_skin': 'fuzzy_skin',
            'fuzzy_skin_thickness': 'fuzzy_skin_thickness',
            'fuzzy_skin_point_distance': 'fuzzy_skin_point_distance',
            'fuzzy_skin_mode': 'fuzzy_skin_mode',
            'seam_position': 'seam_position',
            'brim_type': 'brim_type',
            'skirt_loops': 'skirt_loops',
            'support_material': 'support_material',
            'spiral_vase': 'spiral_vase',
            'spiral_mode': 'spiral_mode',
            'variable_layer_height': 'variable_layer_height',
            'print_sequence': 'print_sequence',
            'ironing_type': 'ironing_type'
        };

        // Start with global settings
        for (const [gcodeName, actualName] of Object.entries(settingsMappings)) {
            if (allSettings[gcodeName] !== undefined) {
                actualSettings[actualName] = allSettings[gcodeName];
            }
        }

        // Apply object-level overrides (these take precedence)
        for (const [key, value] of Object.entries(objectSettings)) {
            actualSettings[key] = value;
        }

        // === BUILD SETTINGS MAP (For troubleshooting) ===
        // Shows where each setting comes from
        const settingsMap = {};
        for (const [key, value] of Object.entries(actualSettings)) {
            const source = objectSettings[key] !== undefined ? 'OBJECT_LEVEL' : 'GLOBAL';
            const globalValue = allSettings[Object.keys(settingsMappings).find(k => settingsMappings[k] === key)];

            settingsMap[key] = {
                actual_value: value,
                source: source,
                global_value: globalValue || null,
                object_override: objectSettings[key] || null,
                differs_from_global: objectSettings[key] !== undefined && objectSettings[key] !== globalValue
            };
        }

        // Store override tracking in specs for JSON export
        specs.global_settings = globalSettings;
        specs.object_level_settings = objectSettings;
        specs.actual_settings = actualSettings;
        specs.settings_map = settingsMap;

        // Detect Slicer
        if (content.includes('PrusaSlicer') || content.includes('SuperSlicer')) {
            specs.slicer = 'PrusaSlicer';
        } else if (content.includes('Cura')) {
            specs.slicer = 'Cura';
        } else if (content.includes('OrcaSlicer')) {
            specs.slicer = 'OrcaSlicer';
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

        // === BUILD 3-LEVEL SETTINGS HIERARCHY (from .3mf config and layer ranges) ===
        if (configContent || layerRangesContent) {
            specs.hierarchy = {
                global_settings: {},
                object_level_settings: {},
                layer_ranges: []
            };

            // Parse global settings from project_settings.config JSON
            if (configContent) {
                try {
                    const config = JSON.parse(configContent);
                    // Filter out null/empty values for cleaner display
                    for (const [key, value] of Object.entries(config)) {
                        if (value !== null && value !== undefined && value !== '' && value !== []) {
                            specs.hierarchy.global_settings[key] = value;
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse project_settings.config:', e);
                }
            }

            // Extract object-level overrides from gcode
            specs.hierarchy.object_level_settings = objectLevelSettings;

            // Parse layer ranges from XML if available
            if (layerRangesContent) {
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(layerRangesContent, 'text/xml');
                    const ranges = xmlDoc.querySelectorAll('range');

                    ranges.forEach(rangeEl => {
                        const rangeData = {
                            z_range: {
                                min: parseFloat(rangeEl.getAttribute('min_z')),
                                max: parseFloat(rangeEl.getAttribute('max_z'))
                            },
                            merged_effective: {}
                        };

                        // Parse settings within this range (stored as option elements with opt_key and text content)
                        const options = rangeEl.querySelectorAll('option');
                        options.forEach(optEl => {
                            const key = optEl.getAttribute('opt_key');
                            const value = optEl.textContent.trim();
                            if (key && value) {
                                rangeData.merged_effective[key] = value;
                            }
                        });

                        specs.hierarchy.layer_ranges.push(rangeData);
                    });
                } catch (e) {
                    console.warn('Failed to parse layer_config_ranges.xml:', e);
                }
            }
        }

        return specs;
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
        if (!specs) {
            return "<p>No settings found.</p>";
        }

        let html = '';
        let totalSettings = 0;
        let globalCount = 0;
        let objectCount = 0;
        let rangeCount = 0;

        if (specs.hierarchy) {
            globalCount = Object.keys(specs.hierarchy.global_settings || {}).length;
            objectCount = Object.keys(specs.hierarchy.object_level_settings || {}).length;
            rangeCount = (specs.hierarchy.layer_ranges || []).length;
            totalSettings = globalCount + objectCount;
        }

        // === SUMMARY ===
        html += `<div style="margin-bottom: 2rem;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1em; font-weight: 600;">Summary</h3>
            <div style="font-family: monospace; font-size: 0.9em; line-height: 1.6; color: #333;">
                <strong>Global:</strong> ${globalCount} | <strong>Profiles:</strong> ${objectCount} | <strong>Ranges:</strong> ${rangeCount} | <strong>Total:</strong> ${totalSettings}
            </div>
        </div>`;

        // === CATEGORIZED PROFILE SETTINGS (HIERARCHICAL) ===
        if (specs.hierarchy && specs.hierarchy.object_level_settings) {
            const objectSettings = specs.hierarchy.object_level_settings;
            if (Object.keys(objectSettings).length > 0) {
                // Organize settings by category
                const categorizedSettings = {};

                for (const [category, subcategories] of Object.entries(SETTING_CATEGORIES)) {
                    categorizedSettings[category] = {};
                    for (const [subcategory, settingsList] of Object.entries(subcategories)) {
                        categorizedSettings[category][subcategory] = [];
                        for (const setting of settingsList) {
                            if (objectSettings.hasOwnProperty(setting)) {
                                const val = objectSettings[setting];
                                const displayValue = formatSettingValue(val);
                                categorizedSettings[category][subcategory].push({ setting, value: displayValue });
                            }
                        }
                    }
                    // Remove empty subcategories
                    for (const subcat in categorizedSettings[category]) {
                        if (categorizedSettings[category][subcat].length === 0) {
                            delete categorizedSettings[category][subcat];
                        }
                    }
                    // Remove empty categories
                    if (Object.keys(categorizedSettings[category]).length === 0) {
                        delete categorizedSettings[category];
                    }
                }

                // Display categorized settings in a single table per category (for proper column alignment)
                for (const [category, subcategories] of Object.entries(categorizedSettings)) {
                    const categoryCount = Object.values(subcategories).reduce((sum, items) => sum + items.length, 0);

                    html += `<div style="margin-bottom: 2rem;">
                        <h3 style="margin: 0 0 1rem 0; font-size: 1em; font-weight: 600;">${category} Profile (${categoryCount})</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; font-size: 0.9em; border-bottom: 2px solid #333; width: 100%;">
                            <div style="padding: 8px; font-weight: 600; background: #f0f0f0; border-bottom: 2px solid #333; text-align: left;">Setting</div>
                            <div style="padding: 8px; font-weight: 600; background: #f0f0f0; border-bottom: 2px solid #333; text-align: left;">Value</div>`;

                    let isFirstSubcategory = true;
                    for (const [subcategory, settings] of Object.entries(subcategories)) {
                        // Add simple group header row for subcategory
                        if (!isFirstSubcategory) {
                            html += `<div style="grid-column: 1 / -1; height: 1px; background: #e0e0e0; padding: 0;"></div>`;
                        }
                        html += `<div style="grid-column: 1 / -1; padding: 6px 8px; font-size: 0.85em; font-weight: 600; color: #333; border-bottom: 1px solid #ddd; white-space: nowrap; overflow: hidden;">
                            ${subcategory}
                        </div>`;

                        for (const { setting, value } of settings) {
                            html += `<div style="padding: 6px 8px; font-family: monospace; color: #333; white-space: nowrap; overflow: hidden; border-bottom: 1px solid #eee; text-align: left;">${setting}</div>
                            <div style="padding: 6px 8px; font-family: monospace; color: #666; white-space: nowrap; overflow: hidden; border-bottom: 1px solid #eee; text-align: left;">${value}</div>`;
                        }

                        isFirstSubcategory = false;
                    }

                    html += `</div></div>`;
                }
            }
        }

        // === LAYER RANGES ===
        if (specs.hierarchy && specs.hierarchy.layer_ranges && specs.hierarchy.layer_ranges.length > 0) {
            for (let i = 0; i < specs.hierarchy.layer_ranges.length; i++) {
                const range = specs.hierarchy.layer_ranges[i];
                const min_z = range.z_range.min;
                const max_z = range.z_range.max;
                const settingsCount = Object.keys(range.merged_effective || {}).length;

                html += `<div style="margin-bottom: 2rem;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1em; font-weight: 600;">Layer Range ${min_z}–${max_z}mm (${settingsCount})</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; font-size: 0.9em; border-bottom: 2px solid #333; width: 100%;">
                        <div style="padding: 8px; font-weight: 600; background: #f0f0f0; border-bottom: 2px solid #333; text-align: left;">Setting</div>
                        <div style="padding: 8px; font-weight: 600; background: #f0f0f0; border-bottom: 2px solid #333; text-align: left;">Value</div>`;

                for (const [key, value] of Object.entries(range.merged_effective || {})) {
                    const displayValue = formatSettingValue(value);
                    html += `<div style="padding: 6px 8px; font-family: monospace; color: #333; white-space: nowrap; overflow: hidden; border-bottom: 1px solid #eee; text-align: left;">${key}</div>
                    <div style="padding: 6px 8px; font-family: monospace; color: #666; white-space: nowrap; overflow: hidden; border-bottom: 1px solid #eee; text-align: left;">${displayValue}</div>`;
                }
                html += `</div></div>`;
            }
        }

        // === GLOBAL SETTINGS TABLE ===
        if (specs.hierarchy && specs.hierarchy.global_settings) {
            const globalSettings = specs.hierarchy.global_settings;
            if (Object.keys(globalSettings).length > 0) {
                html += `<div style="margin-bottom: 2rem;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1em; font-weight: 600;">Global Settings (${Object.keys(globalSettings).length})</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; font-size: 0.9em; border-bottom: 2px solid #333; width: 100%;">
                        <div style="padding: 8px; font-weight: 600; background: #f0f0f0; border-bottom: 2px solid #333; text-align: left;">Setting</div>
                        <div style="padding: 8px; font-weight: 600; background: #f0f0f0; border-bottom: 2px solid #333; text-align: left;">Value</div>`;

                for (const [key, value] of Object.entries(globalSettings)) {
                    const displayValue = formatSettingValue(value);
                    html += `<div style="padding: 6px 8px; font-family: monospace; color: #333; white-space: nowrap; overflow: hidden; border-bottom: 1px solid #eee; text-align: left;">${key}</div>
                    <div style="padding: 6px 8px; font-family: monospace; color: #666; white-space: nowrap; overflow: hidden; border-bottom: 1px solid #eee; text-align: left;">${displayValue}</div>`;
                }
                html += `</div></div>`;
            }
        }

        return html;
    }

    // === COPY HIERARCHY TO CLIPBOARD ===
});
