import bpy
import os
import zipfile
import shutil
from datetime import datetime

# --- CONFIGURATION ---
BASE_ROOT = "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables"
DIR_RAW = os.path.join(BASE_ROOT, "ETSY_EXPORTS-AND-PACKAGING", "01-RAW-STLS")
DIR_ALIGNED = os.path.join(BASE_ROOT, "ETSY_EXPORTS-AND-PACKAGING", "02-ALIGNED-STLS")
DIR_ZIPS = os.path.join(BASE_ROOT, "ETSY_EXPORTS-AND-PACKAGING", "03-PACKAGED-ZIPS", "CURRENT")
DIR_ARCHIVE = os.path.join(BASE_ROOT, "ETSY_EXPORTS-AND-PACKAGING", "03-PACKAGED-ZIPS", "ARCHIVE")
DESC_FILE = os.path.join(BASE_ROOT, "Description.txt")

# GRID SPACING
X_SPACING = 350.0  
Y_SPACING = 350.0  
ISLAND_GAP = 600.0  # Gap between Smooth (Top) and Ribbed (Bottom)

# ZIP CONFIG
MAX_BYTES = 20971520  # 20MB
COMPRESSION = zipfile.ZIP_DEFLATED

def setup_blender():
    """Wipe scene and fix units/clipping."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 0.001
    bpy.context.scene.unit_settings.length_unit = 'MILLIMETERS'
    
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.clip_start = 0.1
                    space.clip_end = 200000.0

def process_blender_logic():
    """Import, Aligns, and Exports Centered STLs into subfolders."""
    if not os.path.exists(DIR_RAW):
        print(f"ERROR: Raw Source not found: {DIR_RAW}")
        return 0

    # Ensure clean aligned output dir
    if os.path.exists(DIR_ALIGNED):
        shutil.rmtree(DIR_ALIGNED)
    os.makedirs(DIR_ALIGNED)

    count = 0
    # Process all STL files in the raw folder (recursive)
    for root, dirs, files in os.walk(DIR_RAW):
        for file in sorted(files):
            if not file.lower().endswith(".stl"): continue
            
            filepath = os.path.join(root, file)
            bpy.ops.wm.stl_import(filepath=filepath)
            
            obj = bpy.context.selected_objects[0]
            name = file.lower().replace(".stl", "")
            obj.name = name
            
            # Reset Origin
            bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
            
            # --- ALIGNMENT LOGIC ---
            try:
                size_map = {'xs':0, 'sm':1, 'md':2, 'lg':3, 'xl':4, 'xxl':5}
                col_idx = 0
                for skey, sval in size_map.items():
                    if f"--{skey}-" in name:
                        col_idx = sval
                        break
                
                is_smooth = "smooth" in name
                y_offset = 0 if is_smooth else -(6 * Y_SPACING + ISLAND_GAP)
                
                row_idx = 0
                if "middle" in name:
                    row_idx = 0 if "tube" in name else 1
                elif "bottom" in name:
                    row_idx = 2 if "flat" in name else 3
                elif "top" in name:
                    row_idx = 4 if "flat" in name else 5
                
                obj.rotation_euler = (0, 0, 0)
                obj.location.x = (col_idx * X_SPACING)
                obj.location.y = (row_idx * -Y_SPACING) + y_offset
                obj.location.z = 0
                count += 1
            except:
                pass

    # Frame View
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for region in area.regions:
                if region.type == 'WINDOW':
                    with bpy.context.temp_override(area=area, region=region):
                        bpy.ops.view3d.view_axis(type='TOP')
                        bpy.ops.view3d.view_all(center=False)
                    break

    # --- BATCH EXPORT CENTERED ---
    print(f"Exporting centered STLs...")
    for obj in bpy.data.objects:
        if "--" in obj.name:
            # Re-derive folders from name for aligned output
            is_ribbed = "ribbed" in obj.name
            is_flat = "flat" in obj.name
            
            f_main = ("01_Stackable--Ribbed-Flat" if is_flat else "02_Stackable--Ribbed-Tube") if is_ribbed else \
                     ("03_Stackable--Smooth-Flat" if is_flat else "04_Stackable--Smooth-Tube")
            
            f_sub = "Bottom" if "bottom" in obj.name else ("Middle" if "middle" in obj.name else "Top")
            
            out_dir = os.path.join(DIR_ALIGNED, f_main, f_sub)
            os.makedirs(out_dir, exist_ok=True)
            
            original_loc = obj.location.copy()
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            
            obj.location = (0, 0, 0)
            
            # --- SIZE OPTIMIZATION FOR ETSY ---
            # Ribbed geometry is >20MB zipped. Applying subtle decimation to fit.
            mod = None
            if is_ribbed:
                # First, ensure mesh is clean before decimation
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='SELECT')
                bpy.ops.mesh.remove_doubles() # Weld nearby vertices
                bpy.ops.object.mode_set(mode='OBJECT')

                mod = obj.modifiers.new(name="EtsyOptimize", type='DECIMATE')
                mod.ratio = 0.85 
                mod.use_collapse_triangulate = True # Keep mesh manifold
                bpy.context.view_layer.update()
            
            target_path = os.path.join(out_dir, f"{obj.name}.stl")
            
            try:
                bpy.ops.wm.stl_export(filepath=target_path, export_selected_objects=True)
            except:
                bpy.ops.export_mesh.stl(filepath=target_path, use_selection=True)
            
            # Cleanup optimizer
            if mod: obj.modifiers.remove(mod)
            
            obj.location = original_loc
            
    return count

def run_packaging_logic():
    """Zips the aligned STLs into Etsy-ready packages."""
    # Ensure aligned dir exists
    if not os.path.exists(DIR_ALIGNED): os.makedirs(DIR_ALIGNED)
    
    # 1. Handle Static Source Folders (like Documents)
    # Move non-STL folders from RAW to ALIGNED so they get zipped
    for item in os.listdir(DIR_RAW):
        item_path = os.path.join(DIR_RAW, item)
        if os.path.isdir(item_path) and item == "Documents":
            target_path = os.path.join(DIR_ALIGNED, item)
            if os.path.exists(target_path): shutil.rmtree(target_path)
            shutil.copytree(item_path, target_path)

    print(f"Starting Etsy Zipping...")
    if not os.path.exists(DIR_ZIPS): os.makedirs(DIR_ZIPS)
    if not os.path.exists(DIR_ARCHIVE): os.makedirs(DIR_ARCHIVE)

    # Archive existing items in CURRENT (Zips and unzipped folders)
    timestamp_str = datetime.now().strftime("%Y-%m-%d_%H%M")
    old_items = [f for f in os.listdir(DIR_ZIPS) if not f.startswith(".")]
    if old_items:
        archive_sub = os.path.join(DIR_ARCHIVE, timestamp_str)
        os.makedirs(archive_sub, exist_ok=True)
        for item in old_items:
            shutil.move(os.path.join(DIR_ZIPS, item), os.path.join(archive_sub, item))
        print(f"Archived {len(old_items)} items to {archive_sub}")

    variants = sorted([d for d in os.listdir(DIR_ALIGNED) if os.path.isdir(os.path.join(DIR_ALIGNED, d))])
    
    for variant in variants:
        variant_path = os.path.join(DIR_ALIGNED, variant)
        zip_name = f"{variant}.zip"
        zip_path = os.path.join(DIR_ZIPS, zip_name)
        
        with zipfile.ZipFile(zip_path, 'w', COMPRESSION, compresslevel=9) as zf:
            for root, dirs, files in os.walk(variant_path):
                for f in files:
                    if f.startswith("."): continue
                    abs_path = os.path.join(root, f)
                    # Use variant_path as base to avoid redundant folder nesting
                    rel_path = os.path.relpath(abs_path, variant_path)
                    zf.write(abs_path, rel_path)
            
            # Inject Description ONLY to Documents.zip to avoid duplicates across bundles
            if variant == "Documents" and os.path.exists(DESC_FILE):
                zf.write(DESC_FILE, os.path.basename(DESC_FILE))
        
        size = os.path.getsize(zip_path)
        status = "PASS" if size < MAX_BYTES else "!!! FAIL (TOO LARGE) !!!"
        print(f"Created {zip_name:35} | {size/1024/1024:5.2f}MB | {status}")

def generate_report(count):
    log_name = "WORKFLOW_REPORT"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_path = os.path.join(BASE_ROOT, "ETSY_EXPORTS-AND-PACKAGING", "SCRIPTS", "WORKFLOW_REPORT.txt")
    
    content = []
    content.append("=== ULTIMATE MODULAR WORKFLOW REPORT ===")
    content.append(f"Timestamp: {timestamp}")
    content.append(f"Source Files: {count}")
    content.append(f"Output: {DIR_ZIPS}")
    content.append("-" * 40)
    
    final_text = "\n".join(content)
    
    if log_name not in bpy.data.texts: bpy.data.texts.new(log_name)
    bpy.data.texts[log_name].clear()
    bpy.data.texts[log_name].write(final_text)
    
    with open(report_path, "w") as f: f.write(final_text)

def main():
    print(f"--- STARTING ULTIMATE WORKFLOW ---")
    setup_blender()
    file_count = process_blender_logic()
    run_packaging_logic()
    generate_report(file_count)
    print(f"--- WORKFLOW COMPLETE: {file_count} Parts Processed ---")

if __name__ == "__main__":
    main()
