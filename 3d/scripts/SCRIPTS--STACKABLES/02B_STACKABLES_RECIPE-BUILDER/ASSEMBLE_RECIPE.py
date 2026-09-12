import bpy
import os

# --- ASSEMBLY CONFIGURATION ---
# These can be overridden when calling this script from a recipe config
if 'RECIPE_NAME' not in locals():
    RECIPE_NAME = "Default_Stack"

if 'ASSEMBLY_PARTS' not in locals():
    ASSEMBLY_PARTS = [
        ("ETSY_EXPORTS-AND-PACKAGING/02-ALIGNED-STLS/01_Stackable--Ribbed-Flat/Bottom/bottom--flat--02--sm-24.8mm--ribbed.stl", "Base_Compartment"),
        ("ETSY_EXPORTS-AND-PACKAGING/02-ALIGNED-STLS/01_Stackable--Ribbed-Flat/Middle/middle--flat--05--xl-67.6mm--ribbed.stl", "Main_Body"),
        ("ETSY_EXPORTS-AND-PACKAGING/02-ALIGNED-STLS/02_Stackable--Ribbed-Tube/Top/top--tube--02--sm-30.4mm--ribbed.stl", "Open_Top"),
    ]

EXPORT_STLS = True 
LIP_HEIGHT = 5.4  # Standard lip is 5.6mm; using 5.4mm provides a 0.2mm visual gap between shoulders
BASE_ROOT = "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables"
DIR_RECIPES = os.path.join(BASE_ROOT, "BLENDER_RECIPE-BUILDER")

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def assemble_stack():
    current_z = 0.0
    spawned_data = [] # List of tuples: (object, original_filename)
    
    print("\n" + "="*50)
    print(f"STARTING ASSEMBLY: {RECIPE_NAME}")
    print("="*50)
    
    # Check if list is reversed (Top to Bottom)
    # Using globals() since these are injected via exec() in some runners
    stack_dir = globals().get('STACK_DIRECTION', "BOTTOM_TO_TOP")
    if stack_dir == "TOP_TO_BOTTOM":
        print("Direction: TOP_TO_BOTTOM detected. Reversing list for processing...")
        ASSEMBLY_PARTS.reverse()
    
    for i, part_data in enumerate(ASSEMBLY_PARTS):
        # Handle both (path, label) and simple string paths
        if isinstance(part_data, tuple):
            input_path, label = part_data
        else:
            input_path = part_data
            label = f"Part_{i+1}"
            
        # SMART PATH SEARCH
        # If the input is just a filename, search for it in the project
        full_path = ""
        if "/" not in input_path and input_path.endswith(".stl"):
            print(f"[{i+1}/{len(ASSEMBLY_PARTS)}] Searching for filename: {input_path}...")
            search_dir = os.path.join(BASE_ROOT, "ETSY_EXPORTS-AND-PACKAGING", "02-ALIGNED-STLS")
            for root, dirs, files in os.walk(search_dir):
                if input_path in files:
                    full_path = os.path.join(root, input_path)
                    break
        else:
            full_path = os.path.join(BASE_ROOT, input_path)
        
        print(f"[{i+1}/{len(ASSEMBLY_PARTS)}] Importing: {label}...")
        print(f"Path: {full_path}")
        
        if not os.path.exists(full_path):
            print(f"!!! FILE NOT FOUND: {full_path}")
            continue

        try:
            # Capture the precise original filename for later export
            orig_name = os.path.basename(full_path).lower()

            # Clear selection before import
            bpy.ops.object.select_all(action='DESELECT')
            
            # Import with specific operator
            bpy.ops.wm.stl_import(filepath=full_path)
            
            # Get the newly imported object
            obj = bpy.context.selected_objects[0]
            obj.name = f"{i:02}_{label}"
            
            # --- ORIENTATION FIX FOR TOP FLAT MODELS ---
            # Top Flat models are often oriented face-down for printing.
            # Mirror them vertically so they sit correctly on the stack.
            if "top" in orig_name and "flat" in orig_name:
                print(f"   -> Top Flat detected. Mirroring vertically...")
                obj.scale.z = -1
                # Apply scale to bake the flip into the geometry
                bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
                # Recalculate normals to fix any inversion from mirroring
                bpy.context.view_layer.objects.active = obj
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='SELECT')
                bpy.ops.mesh.normals_make_consistent(inside=False)
                bpy.ops.object.mode_set(mode='OBJECT')

            spawned_data.append((obj, os.path.basename(full_path)))
            
            # Move origin to the bottom center (Z=Min)
            bpy.context.view_layer.objects.active = obj
            # Trick to move origin to bottom:
            bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
            
            # Position it at the current assembly height
            # Move object so its BOTTOM is at current_z
            # In Blender, obj.location is the origin. 
            # We move the origin to the bottom-most point of the bounding box first.
            bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
            
            # Now relocate so bottom of geometry is at current_z
            # We calculate the min Z of the bounding box relative to current location
            local_bbox_center_z = obj.location.z
            half_height = obj.dimensions.z / 2
            
            # The bottom of the object is at (location.z - half_height)
            # We want (location.z - half_height) == current_z
            # So, location.z = current_z + half_height
            obj.location = (0, 0, current_z + half_height)
            
            # Advance Z for next part
            height = obj.dimensions.z
            print(f"   -> Success. Height: {height:.2f}mm. Placed at Z={current_z:.2f}mm")
            
            # IMPORTANT: The next part's bottom should be at (Current Part Top - Lip Height)
            current_z += (height - LIP_HEIGHT)
            
        except Exception as e:
            print(f"!!! ERROR: {e}")

    print("-" * 30)
    # Grouping and Export
    if EXPORT_STLS and spawned_data:
        # Use the provided output directory or fall back to RECIPE_NAME folder
        # Check both locals and globals since this may be exec()'d from recipe_builder.py
        export_dir = None
        if 'EXPORT_DIR' in globals() and globals()['EXPORT_DIR']:
            export_dir = globals()['EXPORT_DIR']
        elif 'EXPORT_DIR' in locals() and locals()['EXPORT_DIR']:
            export_dir = locals()['EXPORT_DIR']
        
        if export_dir:
            # If current directory is SCRIPTS, go up one level to the recipe root
            if export_dir.endswith("/SCRIPTS") or export_dir.endswith("\\SCRIPTS") or export_dir.endswith("/SCRIPTS/") or export_dir.endswith("\\SCRIPTS\\"):
                out_folder = os.path.dirname(export_dir)
            else:
                out_folder = export_dir
            print(f"Using EXPORT_DIR: {out_folder}")
        else:
            out_folder = os.path.join(DIR_RECIPES, RECIPE_NAME)
            print(f"Using fallback DIR_RECIPES: {out_folder}")
            
        os.makedirs(out_folder, exist_ok=True)
        
        # Export Combined Only
        bpy.ops.object.select_all(action='DESELECT')
        for o, orig_name in spawned_data: o.select_set(True)
        bpy.context.view_layer.objects.active = spawned_data[0][0]
        
        combined_path = os.path.join(out_folder, f"{RECIPE_NAME}--COMBINED.stl")
        try:
            bpy.ops.wm.stl_export(filepath=combined_path, export_selected_objects=True)
            print(f"EXPORTED COMBINED: {combined_path}")
        except Exception as e:
            print(f"!!! COMBINED EXPORT FAILED: {e}")

    print("="*50)
    print("ASSEMBLY COMPLETE")
    print("="*50 + "\n")

if __name__ == "__main__":
    clear_scene()
    assemble_stack()
    
    # Simple View All for modern Blender versions
    # This avoids the complex context overriding that causes the 1-2 args error
    try:
        bpy.ops.view3d.view_all('INVOKE_DEFAULT')
    except Exception as e:
        print(f"Could not auto-focus view: {e}")
    
    print("Stack assembly complete.")
