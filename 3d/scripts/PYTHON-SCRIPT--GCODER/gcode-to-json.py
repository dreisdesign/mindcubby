#!/usr/bin/env python3
"""
G-Code to JSON Processor
Autodetects and processes the most recently saved .gcode file
Saves JSON next to the gcode file and reveals it in Finder
"""

import sys
import json
import re
import subprocess
from pathlib import Path

# Search paths for gcode files (in order of priority)
SEARCH_PATHS = [
    Path.home() / "Desktop" / "G-CODER",
    Path.home() / "Desktop",
    Path.home() / "Downloads",
    Path.home() / "Documents",
    Path.home(),
]

def extract_gcode_specs(gcode_file):
    """Extract specifications from G-code (mirrors G-coder app logic)."""
    filename = gcode_file.name
    content = gcode_file.read_text(encoding='utf-8', errors='ignore')
    
    specs = {
        "filename": filename,
        "slicer": None,
        "printer_model": None,
        "printer_vendor": None,
        "nozzle_temp": None,
        "bed_temp": None,
        "layer_height": None,
        "nozzle_diameter": None,
        "filament_material": None,
        "infill_density": None,
        "infill_pattern": None,
        "top_fill_pattern": None,
        "bottom_fill_pattern": None,
        "top_shell_layers": None,
        "bottom_shell_layers": None,
        "perimeters": None,
        "filament_used_g": None,
        "print_time_s": None,
        "spiral_vase": None,
        "variable_layer_height": None,
        "support_material": None,
        "fuzzy_skin": None,
        "seam_position": None,
        "skirt_loops": None,
        "brim_type": None,
        "print_sequence": None,
        "ironing_type": None,
    }
    
    try:
        # Extract ALL settings from G-code comments using regex (like G-coder)
        settings_regex = r'; ([\w_]+) = (.+?)(?=\n|$)'
        all_settings = {}
        object_level_settings = {}  # Track OBJECT_* prefixed settings separately
        global_settings = {}
        different_settings_list = []  # Track which settings are different from system defaults
        
        for match in re.finditer(settings_regex, content):
            key = match.group(1)
            value = match.group(2).strip()
            all_settings[key] = value
            
            # Track object-level overrides (e.g., ; OBJECT_top_shell_layers = 0)
            if key.startswith('OBJECT_'):
                actual_key = key[7:]  # Remove 'OBJECT_' prefix
                object_level_settings[actual_key] = value
            else:
                global_settings[key] = value
            
            # Parse OrcaSlicer's "different_settings_to_system" list
            # This marks which settings are per-object overrides
            if key == 'different_settings_to_system':
                different_settings_list = [s.strip() for s in value.split(';') if s.strip()]
            
            # Map settings to specs object
            if key == 'printer_model':
                specs['printer_model'] = 'Ender 3 V2' if value == 'ENDER3V2' else value
            elif key == 'printer_vendor':
                specs['printer_vendor'] = value
            elif key == 'layer_height':
                specs['layer_height'] = float(value)
            elif key == 'nozzle_diameter':
                specs['nozzle_diameter'] = float(value)
            elif key == 'fill_density':
                specs['infill_density'] = float(value)
            elif key == 'infill_pattern':
                specs['infill_pattern'] = value
            elif key == 'top_fill_pattern':
                specs['top_fill_pattern'] = value
            elif key == 'bottom_fill_pattern':
                specs['bottom_fill_pattern'] = value
            elif key in ('top_solid_layers', 'top_shell_layers'):
                specs['top_shell_layers'] = int(value)
            elif key in ('bottom_solid_layers', 'bottom_shell_layers'):
                specs['bottom_shell_layers'] = int(value)
            elif key == 'perimeters':
                specs['perimeters'] = int(value)
            elif key == 'first_layer_temperature':
                specs['nozzle_temp'] = int(value)
            elif key == 'bed_temperature':
                specs['bed_temp'] = int(value)
            elif key == 'spiral_mode' or key == 'spiral_vase':
                specs['spiral_vase'] = value == '1'
            elif key == 'variable_layer_height':
                specs['variable_layer_height'] = value == '1'
            elif key == 'support_material':
                specs['support_material'] = value == '1'
            elif key == 'fuzzy_skin' and value != 'none':
                specs['fuzzy_skin'] = value
            elif key == 'fuzzy_skin_thickness' and float(value) > 0 and not specs['fuzzy_skin']:
                specs['fuzzy_skin'] = 'displacement'
            elif key == 'seam_position':
                specs['seam_position'] = value
            elif key == 'brim_type':
                specs['brim_type'] = value
            elif key == 'skirt_loops':
                specs['skirt_loops'] = int(value)
            elif key == 'print_sequence':
                specs['print_sequence'] = value
            elif key == 'ironing_type':
                specs['ironing_type'] = value
        
        # Detect Slicer
        if 'PrusaSlicer' in content or 'SuperSlicer' in content:
            specs['slicer'] = 'PrusaSlicer'
        elif 'Cura' in content:
            specs['slicer'] = 'Cura'
        elif 'OrcaSlicer' in content or all_settings.get('sparse_infill_density'):
            specs['slicer'] = 'OrcaSlicer'
        
        # Material from filename (e.g., "Cube_200C_PLA_5m39s.gcode")
        material_match = re.search(r'_(\d{2,3}C)_(PLA|PETG|ABS|TPU|NYLON|RESIN|ASA|CF)', filename, re.I)
        if material_match:
            specs['filament_material'] = material_match.group(2).upper()
        
        # Fallback temperature extraction from M-codes if not in settings
        if not specs['nozzle_temp']:
            nozzle_match = re.search(r'M104 S(\d+)|;Nozzle Temp:\s*(\d+)', content)
            if nozzle_match:
                specs['nozzle_temp'] = int(nozzle_match.group(1) or nozzle_match.group(2))
        
        if not specs['bed_temp']:
            bed_match = re.search(r'M140 S(\d+)|;Bed Temp:\s*(\d+)', content)
            if bed_match:
                specs['bed_temp'] = int(bed_match.group(1) or bed_match.group(2))
        
        # Filament weight
        weight_match = re.search(r'; filament used \[g\] = ([\d.]+)', content)
        if weight_match:
            specs['filament_used_g'] = float(weight_match.group(1))
        
        # Print time - try filename first (most reliable)
        # Filename format: Cube_0.2mm_PLA_5m31s.gcode
        filename_time_match = re.search(r'_(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?\.gcode$', filename)
        if filename_time_match:
            hours = int(filename_time_match.group(1) or 0)
            minutes = int(filename_time_match.group(2) or 0)
            seconds = int(filename_time_match.group(3) or 0)
            if hours or minutes or seconds:  # Only set if we found something
                specs['print_time_s'] = (hours * 3600) + (minutes * 60) + seconds
        
        # Fallback: parse from G-code footer
        if 'print_time_s' not in specs or specs['print_time_s'] == 18000:
            # Read last 2000 bytes for footer
            try:
                with open(gcode_file, 'rb') as f:
                    f.seek(-2000, 2)
                    footer = f.read().decode('utf-8', errors='ignore')
                
                # Match "estimated printing time (normal mode) = 5m 31s"
                footer_time = re.search(r'; estimated printing time.*?=\s*(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?', footer)
                if footer_time:
                    h = int(footer_time.group(1) or 0)
                    m = int(footer_time.group(2) or 0)
                    s = int(footer_time.group(3) or 0)
                    specs['print_time_s'] = (h * 3600) + (m * 60) + s
            except:
                pass
        
        # === IDENTIFY OBJECT-LEVEL OVERRIDES ===
        # If OrcaSlicer marked settings as "different_settings_to_system", those are per-object overrides
        if different_settings_list:
            for override_key in different_settings_list:
                # Find matching settings by checking various naming conventions
                if override_key in all_settings:
                    object_level_settings[override_key] = all_settings[override_key]
                # Also check for alternate names (e.g., top_solid_layers vs top_shell_layers)
                elif override_key == 'top_shell_layers' and 'top_solid_layers' in all_settings:
                    object_level_settings[override_key] = all_settings['top_solid_layers']
                elif override_key == 'bottom_shell_layers' and 'bottom_solid_layers' in all_settings:
                    object_level_settings[override_key] = all_settings['bottom_solid_layers']
                elif override_key == 'wall_loops' and 'perimeters' in all_settings:
                    object_level_settings[override_key] = all_settings['perimeters']
        
        # Remove None values from main specs
        specs = {k: v for k, v in specs.items() if v is not None}
        
        # === BUILD COMPREHENSIVE OVERRIDE MAP ===
        # Track global vs object-level settings for AI troubleshooting
        
        # === BUILD ACTUAL SETTINGS (What Will Actually Print) ===
        # Priority: object-level > global
        actual_settings = {}
        
        # Mappings from G-code setting names to canonical names
        settings_mappings = {
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
        }
        
        # Start with global settings
        for gcode_name, actual_name in settings_mappings.items():
            if gcode_name in all_settings:
                actual_settings[actual_name] = all_settings[gcode_name]
        
        # Apply object-level overrides (these take precedence)
        for key, value in object_level_settings.items():
            actual_settings[key] = value
        
        # === BUILD SETTINGS MAP (For troubleshooting) ===
        # Shows where each setting comes from
        settings_map = {}
        for key, value in actual_settings.items():
            source = 'OBJECT_LEVEL' if key in object_level_settings else 'GLOBAL'
            # Find the original G-code name for this setting
            global_value = None
            for gcode_name, actual_name in settings_mappings.items():
                if actual_name == key and gcode_name in all_settings:
                    global_value = all_settings[gcode_name]
                    break
            
            settings_map[key] = {
                'actual_value': value,
                'source': source,
                'global_value': global_value,
                'object_override': object_level_settings.get(key),
                'differs_from_global': key in object_level_settings and object_level_settings.get(key) != global_value
            }
        
        # Add all_settings (like G-coder does)
        specs['all_settings'] = all_settings
        specs['global_settings'] = global_settings
        specs['object_level_settings'] = object_level_settings
        specs['actual_settings'] = actual_settings
        specs['settings_map'] = settings_map
        
        return specs
        
    except Exception as e:
        print(f"❌ Error parsing: {e}")
        return specs

def main():
    # Find most recent .gcode file across all search paths
    all_gcode_files = []
    
    for search_path in SEARCH_PATHS:
        if search_path.exists():
            all_gcode_files.extend(search_path.glob('*.gcode'))
    
    if not all_gcode_files:
        print(f"❌ No .gcode files found in search paths")
        for path in SEARCH_PATHS:
            print(f"   - {path}")
        sys.exit(1)
    
    latest_gcode = max(all_gcode_files, key=lambda f: f.stat().st_mtime)
    json_file = latest_gcode.with_suffix('.json')
    
    print(f"📄 Processing: {latest_gcode.name}")
    
    specs = extract_gcode_specs(latest_gcode)
    all_settings_count = len(specs.get('all_settings', {}))
    object_overrides_count = len(specs.get('object_level_settings', {}))
    
    try:
        with open(json_file, 'w') as f:
            json.dump(specs, f, indent=2)
        print(f"✅ Generated: {json_file.name}")
        print(f"📍 Location: {json_file.parent}\n")
        print(f"📊 Summary:")
        print(f"   Total G-code settings: {all_settings_count}")
        
        # Show override status
        if object_overrides_count > 0:
            print(f"   🔍 Object-Level Overrides: {object_overrides_count}")
            for key, value in specs.get('object_level_settings', {}).items():
                print(f"      • {key} = {value}")
            print()
        
        # Show actual settings (what will print)
        actual_settings = specs.get('actual_settings', {})
        if actual_settings:
            print(f"   Actual Settings (What Will Print):")
            for key in ['top_shell_layers', 'bottom_shell_layers', 'perimeters', 'layer_height', 'infill_density']:
                if key in actual_settings:
                    print(f"      {key}: {actual_settings[key]}")
        print()
        
        # Reveal in Finder
        subprocess.run(['open', '-R', str(json_file)], check=False)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
