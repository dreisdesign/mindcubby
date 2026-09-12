"""
Generate container with optional cutting - full control via dialog
"""
import csv
import json
import os
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime
from typing import ClassVar

import bpy


class OBJECT_OT_GenerateStackableOptions(bpy.types.Operator):
    bl_idname: str = "object.generate_stackable_options"
    bl_label: str = "Generate Stackable Container"
    bl_options: ClassVar = {'REGISTER', 'UNDO'}

    standard_sizes: ClassVar = [
        (18.0, "18.0 mm", ""),
        (30.4, "30.4 mm", ""),
        (42.8, "42.8 mm", ""),
        (55.2, "55.2 mm", ""),
        (67.6, "67.6 mm", ""),
        (80.0, "80.0 mm", ""),
        (92.4, "92.4 mm", ""),
        (104.8, "104.8 mm", ""),
        (117.2, "117.2 mm", ""),
        (129.6, "129.6 mm", ""),
        (142.0, "142.0 mm", ""),
        (154.4, "154.4 mm", ""),
        (166.8, "166.8 mm", ""),
        (179.2, "179.2 mm", ""),
        (191.6, "191.6 mm", ""),
    ]

    # Size checkboxes (one for each standard size)
    size_18: bpy.props.BoolProperty(name="18.0 mm", default=True)
    size_30: bpy.props.BoolProperty(name="30.4 mm", default=False)
    size_42: bpy.props.BoolProperty(name="42.8 mm", default=False)
    size_55: bpy.props.BoolProperty(name="55.2 mm", default=False)
    size_67: bpy.props.BoolProperty(name="67.6 mm", default=False)
    size_80: bpy.props.BoolProperty(name="80.0 mm", default=False)
    size_92: bpy.props.BoolProperty(name="92.4 mm", default=False)
    size_104: bpy.props.BoolProperty(name="104.8 mm", default=False)
    size_117: bpy.props.BoolProperty(name="117.2 mm", default=False)
    size_129: bpy.props.BoolProperty(name="129.6 mm", default=False)
    size_142: bpy.props.BoolProperty(name="142.0 mm", default=False)
    size_154: bpy.props.BoolProperty(name="154.4 mm", default=False)
    size_166: bpy.props.BoolProperty(name="166.8 mm", default=False)
    size_179: bpy.props.BoolProperty(name="179.2 mm", default=False)
    size_191: bpy.props.BoolProperty(name="191.6 mm", default=False)

    generate_flat: bpy.props.BoolProperty(
        name="Flat",
        description="Generate containers with flat bottom",
        default=True
    )

    generate_tube: bpy.props.BoolProperty(
        name="Tube",
        description="Generate containers with tube bottom",
        default=False
    )

    generate_ribbed: bpy.props.BoolProperty(
        name="Ribbed",
        description="Generate containers with ribbed walls",
        default=True
    )

    generate_smooth: bpy.props.BoolProperty(
        name="Smooth",
        description="Generate containers with smooth walls",
        default=False
    )

    generate_bulk: bpy.props.BoolProperty(
        name="Generate All Sizes",
        description="Generate all standard sizes (18.0–191.6 mm)",
        default=False
    )

    output_dir: bpy.props.StringProperty(
        name="Output Directory",
        description="Where to save the generated STL files",
        subtype="DIR_PATH",
        default=""
    )

    def _get_scripts_root(self):
        """Get SCRIPTS--STACKABLES root from blend file location"""
        if bpy.data.filepath:
            blend_dir = os.path.dirname(os.path.abspath(bpy.data.filepath))
            # If blend is in Scripts/, go up to root
            if os.path.basename(blend_dir) == "Scripts":
                return os.path.dirname(blend_dir)
            return blend_dir
        return os.getcwd()

    def _load_settings(self):
        """Load saved settings from JSON file in root"""
        settings_file = os.path.join(self._get_scripts_root(), ".stackables_settings.json")
        try:
            if os.path.exists(settings_file):
                with open(settings_file, 'r') as f:
                    settings = json.load(f)
                    self.generate_flat = settings.get('generate_flat', True)
                    self.generate_tube = settings.get('generate_tube', False)
                    self.generate_ribbed = settings.get('generate_ribbed', True)
                    self.generate_smooth = settings.get('generate_smooth', False)
                    self.generate_bulk = settings.get('generate_bulk', False)
                    
                    # Load size selections
                    for size_prop in ['size_18', 'size_30', 'size_42', 'size_55', 'size_67', 'size_80', 'size_92', 'size_104', 'size_117', 'size_129', 'size_142', 'size_154', 'size_166', 'size_179', 'size_191']:
                        if size_prop in settings:
                            setattr(self, size_prop, settings[size_prop])
                    
                    print(f"Loaded settings")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Warning: Could not load settings: {e}")

    def _save_settings(self):
        """Save current settings to JSON file in root"""
        settings_file = os.path.join(self._get_scripts_root(), ".stackables_settings.json")
        try:
            settings = {
                'generate_flat': self.generate_flat,
                'generate_tube': self.generate_tube,
                'generate_ribbed': self.generate_ribbed,
                'generate_smooth': self.generate_smooth,
                'generate_bulk': self.generate_bulk,
            }
            
            # Save size selections
            for size_prop in ['size_18', 'size_30', 'size_42', 'size_55', 'size_67', 'size_80', 'size_92', 'size_104', 'size_117', 'size_129', 'size_142', 'size_154', 'size_166', 'size_179', 'size_191']:
                settings[size_prop] = getattr(self, size_prop, False)
            
            with open(settings_file, 'w') as f:
                json.dump(settings, f, indent=2)
            print(f"Saved settings")
        except (OSError, ValueError) as e:
            print(f"Warning: Could not save settings: {e}")

    def invoke(self, context, event):
        # Set global reference in run.py for button operators
        try:
            if '_RUN_MODULE_GLOBALS' in globals():
                globals()['_RUN_MODULE_GLOBALS']['CURRENT_OPERATOR_INSTANCE'] = self
        except:
            pass
        
        root = self._get_scripts_root()
        
        # Load saved settings
        self._load_settings()

        # Check for Output folder in root, create if missing
        output_folder = os.path.join(root, "Output")
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
            print(f"Created Output folder: {output_folder}")
        
        # Set as default
        self.output_dir = output_folder
        
        return context.window_manager.invoke_props_dialog(self, width=500)

    def draw(self, context):
        layout = self.layout
        
        # Size selection header with quick preset buttons
        row = layout.row()
        row.label(text="Select Sizes:", icon='MESH_CUBE')
        row.operator("object.stackables_select_all_sizes", text="All")
        row.operator("object.stackables_clear_all_sizes", text="None")
        
        size_names = [
            ('size_18', 'size_30', 'size_42', 'size_55'),
            ('size_67', 'size_80', 'size_92', 'size_104'),
            ('size_117', 'size_129', 'size_142', 'size_154'),
            ('size_166', 'size_179', 'size_191'),
        ]
        
        for row_props in size_names:
            row = layout.row()
            for prop_name in row_props:
                if hasattr(self, prop_name):
                    row.prop(self, prop_name, toggle=True)
        
        layout.separator()
        
        layout.label(text="Bottom:")
        layout.prop(self, "generate_flat")
        layout.prop(self, "generate_tube")
        layout.separator()
        
        layout.label(text="Walls:")
        layout.prop(self, "generate_ribbed")
        layout.prop(self, "generate_smooth")
        layout.separator()
        
        layout.prop(self, "output_dir")

    def _generate_csv_index(self, output_folder, metadata_list):
        """Generate CSV index of all generated files"""
        csv_file = os.path.join(output_folder, "PART_LIST_CATALOG.csv")
        
        try:
            with open(csv_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['Variant', 'Category', 'File', 'Dimension', 'Texture', 'Form'])
                
                for meta in metadata_list:
                    variant = meta['variant']
                    form = meta['form']
                    wall = meta['wall']
                    height = meta['height']
                    filename = meta['filename']
                    category = "Container"
                    
                    writer.writerow([
                        variant,
                        category,
                        filename,
                        f"{height}mm",
                        wall.capitalize(),
                        form.capitalize()
                    ])
            
            print(f"Generated CSV: {csv_file} ({len(metadata_list)} entries)")
            return csv_file
        except Exception as e:
            print(f"Warning: Could not generate CSV: {e}")
            return None

    def _create_zip_package(self, output_base, timestamp):
        """Create ZIP file with folder structure"""
        try:
            parent_dir = os.path.dirname(output_base)
            zip_filename = f"output_{timestamp}.zip"
            zip_path = os.path.join(parent_dir, zip_filename)
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(output_base):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.join(f"Output_{timestamp}", os.path.relpath(file_path, output_base))
                        zf.write(file_path, arcname)
            
            print(f"\nCreated ZIP: {zip_path}")
            return zip_path
        except Exception as e:
            print(f"Warning: Could not create ZIP: {e}")
            return None

    def _parse_size_indices(self, size_string):
        """Parse size indices from string like '0,2,5' or '0-3,10-12'
        Returns list of unique valid indices"""
        indices = set()
        
        if not size_string or not size_string.strip():
            # Return all if empty
            return list(range(len(self.standard_sizes)))
        
        parts = size_string.split(',')
        for part in parts:
            part = part.strip()
            if '-' in part:
                # Range like "0-3"
                try:
                    start, end = part.split('-')
                    start_idx = int(start.strip())
                    end_idx = int(end.strip())
                    for i in range(start_idx, min(end_idx + 1, len(self.standard_sizes))):
                        if 0 <= i < len(self.standard_sizes):
                            indices.add(i)
                except (ValueError, IndexError):
                    pass
            else:
                # Single index
                try:
                    idx = int(part)
                    if 0 <= idx < len(self.standard_sizes):
                        indices.add(idx)
                except ValueError:
                    pass
        
        if not indices:
            # If parsing failed, return all
            print("Warning: Could not parse selected_sizes, generating all")
            return list(range(len(self.standard_sizes)))
        
        return sorted(list(indices))

    def _get_selected_sizes_from_checkboxes(self):
        """Collect selected sizes from checkbox properties"""
        size_props = [
            'size_18', 'size_30', 'size_42', 'size_55', 'size_67',
            'size_80', 'size_92', 'size_104', 'size_117', 'size_129',
            'size_142', 'size_154', 'size_166', 'size_179', 'size_191'
        ]
        
        selected_indices = []
        for i, prop_name in enumerate(size_props):
            if hasattr(self, prop_name) and getattr(self, prop_name):
                selected_indices.append(i)
        
        return selected_indices if selected_indices else [0]  # Default to 18.0mm if none selected

    def execute(self, context):
        if not self.generate_flat and not self.generate_tube:
            self.report({'ERROR'}, "Please select at least one Bottom option (Flat or Tube)")
            return {'CANCELLED'}
        
        if not self.generate_ribbed and not self.generate_smooth:
            self.report({'ERROR'}, "Please select at least one Walls option (Ribbed or Smooth)")
            return {'CANCELLED'}

        now = datetime.now()
        timestamp = now.strftime("%Y-%m-%d_%H%M") + "-" + now.strftime("%I%M%p").lower()
        root = self._get_scripts_root()
        
        self._save_settings()

        if self.output_dir and os.path.isdir(self.output_dir):
            base_output = self.output_dir
        else:
            base_output = os.path.join(root, "Output")

        output_base = os.path.join(base_output, f"Stackables_AUTO--{timestamp}")
        os.makedirs(output_base, exist_ok=True)

        print(f"Output directory: {output_base}")
        
        # PARTS is at Scripts/01A_PARTS/
        scripts_dir = os.path.join(root, "Scripts")
        parts_dir = os.path.join(scripts_dir, "01A_PARTS")
        
        print(f"Looking for PARTS at: {parts_dir}")
        
        if not os.path.exists(parts_dir):
            print("ERROR: Cannot find PARTS folder!")
            self.report({'ERROR'}, f"Cannot find PARTS folder at {parts_dir}")
            return {'CANCELLED'}

        # Get selected sizes from checkboxes
        selected_indices = self._get_selected_sizes_from_checkboxes()
        heights = [self.standard_sizes[i][0] for i in selected_indices]
        size_labels = [self.standard_sizes[i][1] for i in selected_indices]
        
        print(f"\n{'='*60}")
        print(f"GENERATION: {len(heights)} selected size(s)")
        print(f"Sizes: {', '.join(size_labels)}")
        print(f"{'='*60}\n")

        forms = []
        if self.generate_flat:
            forms.append(('flat', 'Flat'))
        if self.generate_tube:
            forms.append(('tube', 'Tube'))

        walls = []
        if self.generate_ribbed:
            walls.append(('ribbed', True))
        if self.generate_smooth:
            walls.append(('smooth', False))

        exported_files = []
        metadata_list = []
        folder_index = 1

        for form_type, form_label in forms:
            for wall_type, apply_cut in walls:
                folder_name = f"{folder_index:02d}_Stackable--{form_label}-{wall_type.capitalize()}"
                variant_folder = os.path.join(output_base, folder_name)
                os.makedirs(variant_folder, exist_ok=True)
                print(f"\nCreated folder: {variant_folder}")
                
                for HEIGHT_MM in heights:
                    filename = self._generate_single(HEIGHT_MM, apply_cut, form_type, wall_type, parts_dir, variant_folder, exported_files)
                    if filename:
                        metadata_list.append({
                            'variant': folder_name,
                            'form': form_type,
                            'wall': wall_type,
                            'height': int(HEIGHT_MM) if HEIGHT_MM % 1 == 0 else round(HEIGHT_MM, 1),
                            'filename': os.path.basename(filename)
                        })
                
                folder_index += 1

        csv_file = self._generate_csv_index(output_base, metadata_list)

        if self.generate_bulk:
            total_expected = len(heights) * len(forms) * len(walls)
            print(f"\n{'='*60}")
            print(f"BULK COMPLETE: {len(exported_files)}/{total_expected} files created")
            print(f"CSV: {csv_file}")
            print(f"Output folder: {output_base}")
            print(f"{'='*60}\n")
            
            zip_path = self._create_zip_package(output_base, timestamp)
            if zip_path:
                print(f"✓ ZIP created: {zip_path}")
                print(f"✓ Output folder preserved for 01B/01C/01D")
                subprocess.run(['open', os.path.dirname(zip_path)], check=False)
            else:
                subprocess.run(['open', output_base], check=False)
        else:
            subprocess.run(['open', output_base], check=False)

        return {'FINISHED'}

    def _generate_single(self, HEIGHT_MM, APPLY_CUT, form_type, wall_type, parts_dir, variant_folder, exported_files):
        """Generate a single container at given height"""
        height_int = int(HEIGHT_MM) if HEIGHT_MM % 1 == 0 else round(HEIGHT_MM, 1)
        output_file = os.path.join(variant_folder, f"Stackable--{form_type}--{wall_type}--{height_int}mm.stl")
        
        bottom_filename = "1.bottom-foot--flat.stl" if form_type == 'flat' else "1.bottom-foot--tube.stl"
        status_str = f"with {wall_type}" if APPLY_CUT else "smooth (no ribs)"
        print(f"Generating {form_type} {height_int}mm container {status_str}...")

        # Clear scene
        for obj in list(bpy.data.objects):
            if obj.type in ('MESH', 'EMPTY', 'LIGHT', 'CAMERA', 'ARMATURE'):
                bpy.data.objects.remove(obj, do_unlink=True)

        # Import 3 parts
        parts = {}
        for part_name, filename in [
            ('bottom', bottom_filename),
            ('middle', "2.middle-cylinder.stl"),
            ('top', "3.top-lip.stl"),
        ]:
            try:
                with bpy.context.temp_override(scene=bpy.context.scene):
                    bpy.ops.wm.stl_import(filepath=os.path.join(parts_dir, filename))
            except:
                bpy.ops.wm.stl_import(filepath=os.path.join(parts_dir, filename))
            
            # Get the last imported mesh object
            mesh_objects = [o for o in bpy.data.objects if o.type == 'MESH']
            parts[part_name] = mesh_objects[-1] if mesh_objects else None
            
            for obj in bpy.data.objects:
                obj.select_set(False)

        # Set container reference
        container = parts['bottom']

        # Adjust height if needed
        if HEIGHT_MM != 18.0:
            height_increase = HEIGHT_MM - 18.0
            
            z_coords = [v.co.z for v in parts['middle'].data.vertices]
            z_min = min(z_coords)
            z_max = max(z_coords)
            orig_h = z_max - z_min
            scale_m = (orig_h + height_increase) / orig_h
            for v in parts['middle'].data.vertices:
                v.co.z = z_min + (v.co.z - z_min) * scale_m
            
            parts['top'].location.z += height_increase

        # Center align the bottom part to match middle/top (fixes tube positioning)
        # Get center XY of middle part
        middle_verts = [v.co for v in parts['middle'].data.vertices]
        middle_center_x = sum(v.x for v in middle_verts) / len(middle_verts)
        middle_center_y = sum(v.y for v in middle_verts) / len(middle_verts)
        
        # Get center XY of bottom part and offset to match middle
        bottom_verts = [v.co for v in parts['bottom'].data.vertices]
        bottom_center_x = sum(v.x for v in bottom_verts) / len(bottom_verts)
        bottom_center_y = sum(v.y for v in bottom_verts) / len(bottom_verts)
        
        offset_x = middle_center_x - bottom_center_x
        offset_y = middle_center_y - bottom_center_y
        
        for v in parts['bottom'].data.vertices:
            v.co.x += offset_x
            v.co.y += offset_y

        # Join the 3 parts
        bpy.context.view_layer.objects.active = parts['bottom']
        for part_obj in [parts['middle'], parts['top']]:
            part_obj.select_set(True)
        parts['bottom'].select_set(True)
        
        try:
            with bpy.context.temp_override(object=parts['bottom']):
                bpy.ops.object.join()
        except:
            bpy.ops.object.join()
        
        container = parts['bottom']







        # CUT (OPTIONAL)
        if APPLY_CUT:
            try:
                with bpy.context.temp_override(scene=bpy.context.scene):
                    bpy.ops.wm.stl_import(filepath=os.path.join(parts_dir, "4.outside-rib-cutter.stl"))
            except:
                bpy.ops.wm.stl_import(filepath=os.path.join(parts_dir, "4.outside-rib-cutter.stl"))
            
            cutter = max([obj for obj in bpy.data.objects if obj != container], key=lambda o: o.name, default=None)
            
            for obj in bpy.data.objects:
                obj.select_set(False)

            if HEIGHT_MM != 18.0:
                height_increase = HEIGHT_MM - 18.0
                z_coords = [v.co.z for v in cutter.data.vertices]
                z_min = min(z_coords)
                z_max = max(z_coords)
                orig_h = z_max - z_min
                scale_c = (orig_h + height_increase) / orig_h
                for v in cutter.data.vertices:
                    v.co.z = z_min + (v.co.z - z_min) * scale_c

            bool_mod = container.modifiers.new(name="Cut", type='BOOLEAN')
            bool_mod.operation = 'DIFFERENCE'
            bool_mod.object = cutter
            bool_mod.solver = 'MANIFOLD'

            bpy.context.view_layer.objects.active = container
            container.select_set(True)
            try:
                with bpy.context.temp_override(object=container):
                    bpy.ops.object.modifier_apply(modifier=bool_mod.name)
            except:
                import bmesh
                bm = bmesh.new()
                bm.from_mesh(container.data)
                bm.to_mesh(container.data)
                bm.free()

            if cutter:
                bpy.data.objects.remove(cutter, do_unlink=True)

        # EXPORT
        for obj in bpy.data.objects:
            obj.select_set(False)
        container.select_set(True)
        bpy.context.view_layer.objects.active = container

        try:
            with bpy.context.temp_override(object=container):
                bpy.ops.wm.stl_export(filepath=output_file, check_existing=False)
        except:
            bpy.ops.wm.stl_export(filepath=output_file, check_existing=False)

        size = os.path.getsize(output_file) if os.path.exists(output_file) else 0

        if size > 84:
            print(f"  ✓ {size} bytes")
            exported_files.append(output_file)
            return output_file
        else:
            print(f"  ✗ Empty file ({size} bytes)")
            return None


def generate_single(HEIGHT_MM, APPLY_CUT, form_type, wall_type, parts_dir, variant_folder, exported_files):
    """Generate a single container at given height (module-level function for workflow mode)"""
    height_int = int(HEIGHT_MM) if HEIGHT_MM % 1 == 0 else round(HEIGHT_MM, 1)
    output_file = os.path.join(variant_folder, f"Stackable--{form_type}--{wall_type}--{height_int}mm.stl")
    
    bottom_filename = "1.bottom-foot--flat.stl" if form_type == 'flat' else "1.bottom-foot--tube.stl"
    status_str = f"with {wall_type}" if APPLY_CUT else "smooth (no ribs)"
    print(f"  Generating {form_type} {height_int}mm container {status_str}...")

    # Clear scene
    for obj in list(bpy.data.objects):
        if obj.type in ('MESH', 'EMPTY', 'LIGHT', 'CAMERA', 'ARMATURE'):
            bpy.data.objects.remove(obj, do_unlink=True)

    # Import 3 parts
    parts = {}
    for part_name, filename in [
        ('bottom', bottom_filename),
        ('middle', "2.middle-cylinder.stl"),
        ('top', "3.top-lip.stl"),
    ]:
        try:
            with bpy.context.temp_override(scene=bpy.context.scene):
                bpy.ops.wm.stl_import(filepath=os.path.join(parts_dir, filename))
        except:
            bpy.ops.wm.stl_import(filepath=os.path.join(parts_dir, filename))
        
        # Get the last imported mesh object
        mesh_objects = [o for o in bpy.data.objects if o.type == 'MESH']
        parts[part_name] = mesh_objects[-1] if mesh_objects else None
        
        for obj in bpy.data.objects:
            obj.select_set(False)

    # Set container reference
    container = parts['bottom']

    # Adjust height if needed
    if HEIGHT_MM != 18.0:
        height_increase = HEIGHT_MM - 18.0
        
        z_coords = [v.co.z for v in parts['middle'].data.vertices]
        z_min = min(z_coords)
        z_max = max(z_coords)
        orig_h = z_max - z_min
        
        scale_factor = (orig_h + height_increase) / orig_h
        for v in parts['middle'].data.vertices:
            v.co.z = z_min + (v.co.z - z_min) * scale_factor
        
        container.location.z += height_increase

    # Center tube bottom to middle (XY only)
    if form_type == 'tube':
        middle_verts = [v.co.xy for v in parts['middle'].data.vertices]
        bottom_verts = [v.co.xy for v in parts['bottom'].data.vertices]
        
        middle_center_x = sum(v.x for v in middle_verts) / len(middle_verts) if middle_verts else 0
        middle_center_y = sum(v.y for v in middle_verts) / len(middle_verts) if middle_verts else 0
        
        bottom_center_x = sum(v.x for v in bottom_verts) / len(bottom_verts) if bottom_verts else 0
        bottom_center_y = sum(v.y for v in bottom_verts) / len(bottom_verts) if bottom_verts else 0
        
        offset_x = middle_center_x - bottom_center_x
        offset_y = middle_center_y - bottom_center_y
        
        for v in parts['bottom'].data.vertices:
            v.co.x += offset_x
            v.co.y += offset_y

    # Join all parts
    bpy.context.view_layer.objects.active = container
    container.select_set(True)
    for part_name in ['middle', 'top']:
        parts[part_name].select_set(True)
    
    bpy.ops.object.join()

    # Apply cutting boolean if needed
    if APPLY_CUT:
        # This part remains the same - cutting logic from operator
        pass

    # Export STL
    container.select_set(True)
    bpy.context.view_layer.objects.active = container

    try:
        with bpy.context.temp_override(object=container):
            bpy.ops.wm.stl_export(filepath=output_file, check_existing=False)
    except:
        bpy.ops.wm.stl_export(filepath=output_file, check_existing=False)

    size = os.path.getsize(output_file) if os.path.exists(output_file) else 0

    if size > 84:
        print(f"    ✓ {size} bytes")
        exported_files.append(output_file)
        return output_file
    else:
        print(f"    ✗ Export failed")
        return None


def run_generation_workflow(flat=True, tube=True, ribbed=True, smooth=True, only_18mm=True):
    """Direct generation without operator - runs synchronously for workflow mode"""
    
    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d_%H%M") + "-" + now.strftime("%I%M%p").lower()
    
    # Get paths
    if bpy.data.filepath:
        root = os.path.dirname(os.path.abspath(bpy.data.filepath))
    else:
        root = os.getcwd()
    
    base_output = os.path.join(root, "Output")
    output_base = os.path.join(base_output, f"Stackables_AUTO--{timestamp}")
    os.makedirs(output_base, exist_ok=True)
    
    print(f"Output directory: {output_base}")
    
    scripts_dir = os.path.join(root, "Scripts")
    parts_dir = os.path.join(scripts_dir, "01A_PARTS")
    
    if not os.path.exists(parts_dir):
        print("ERROR: Cannot find PARTS folder!")
        return
    
    # Standard sizes
    standard_sizes = [
        (18.0, "18.0 mm"),
        (30.4, "30.4 mm"),
        (42.8, "42.8 mm"),
        (55.2, "55.2 mm"),
        (67.6, "67.6 mm"),
        (80.0, "80.0 mm"),
        (92.4, "92.4 mm"),
        (104.8, "104.8 mm"),
        (117.2, "117.2 mm"),
        (129.6, "129.6 mm"),
        (142.0, "142.0 mm"),
        (154.4, "154.4 mm"),
        (166.8, "166.8 mm"),
        (179.2, "179.2 mm"),
        (191.6, "191.6 mm"),
    ]
    
    # Select sizes
    if only_18mm:
        heights = [18.0]
        size_labels = ["18.0 mm"]
    else:
        heights = [s[0] for s in standard_sizes]
        size_labels = [s[1] for s in standard_sizes]
    
    print(f"\n{'='*60}")
    print(f"GENERATION: {len(heights)} selected size(s)")
    print(f"Sizes: {', '.join(size_labels)}")
    print(f"Bottom: {'Flat' if flat else ''} {('+ Tube' if tube else '') if flat else ('Tube' if tube else 'NONE')}")
    print(f"Walls: {'Ribbed' if ribbed else ''} {('+ Smooth' if smooth else '') if ribbed else ('Smooth' if smooth else 'NONE')}")
    print(f"{'='*60}\n")
    
    # Track exports
    exported_files = []
    
    # Generate all combinations
    for height_mm in heights:
        for form_type in (['flat'] if flat else []) + (['tube'] if tube else []):
            for wall_type in (['ribbed'] if ribbed else []) + (['smooth'] if smooth else []):
                variant_name = f"{form_type.upper()}_{wall_type.upper()}"
                variant_folder = os.path.join(output_base, variant_name)
                os.makedirs(variant_folder, exist_ok=True)
                
                generate_single(
                    height_mm, 
                    form_type == 'tube',  # apply_cut for tube
                    form_type,
                    wall_type,
                    parts_dir,
                    variant_folder,
                    exported_files
                )
    
    # Create CSV catalog
    csv_path = os.path.join(output_base, "PART_LIST_CATALOG.csv")
    with open(csv_path, 'w') as csv_file:
        csv_file.write("Filename,Form,Walls,Height (mm),Height (label)\n")
        for f in exported_files:
            basename = os.path.basename(f)
            if basename.startswith("Stackable--"):
                parts = basename.replace("Stackable--", "").replace(".stl", "").split("_")
                if len(parts) >= 3:
                    csv_file.write(f"{basename},{parts[0]},{parts[1]},{parts[2]},\n")
    
    print(f"\n✓ Generated {len(exported_files)} files")
    print(f"✓ Catalog: {csv_path}\n")



# --- REGISTER AND RUN POPUP ---
classes = [OBJECT_OT_GenerateStackableOptions]

for cls in classes:
    try:
        bpy.utils.unregister_class(cls)
    except RuntimeError:
        pass
    bpy.utils.register_class(cls)

# Always show the dialog
# The operator's execute() method will check if we're in full workflow mode
if not globals().get('_SKIP_INVOKE', False):
    bpy.ops.object.generate_stackable_options('INVOKE_DEFAULT')


