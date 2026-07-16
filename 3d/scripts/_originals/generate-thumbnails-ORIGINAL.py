import bpy
import os
import math

# --- CONFIGURATION ---
BASE_ROOT = "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables"
DIR_ALIGNED = os.path.join(BASE_ROOT, "ETSY_EXPORTS-AND-PACKAGING", "02-ALIGNED-STLS")
DIR_OUTPUT  = os.path.join(BASE_ROOT, "BLENDER_THUMBNAIL-GENERATOR")

# Render Settings
RESOLUTION_X = 512
RESOLUTION_Y = 512
RENDER_SAMPLES = 16 # Minimal samples for speed
USE_CYCLES = False  # Switched to EEVEE to prevent freezing
FORCE_RERENDER = True  # Set to True to re-render all existing thumbnails

# Color Mapping based on new shade system
# Smooth = Cool/Blue Shades, Ribbed = Warm/Purple Shades
# Flat = Red highlights, Tube = Yellow highlights
COLORS = {
    "SMOOTH_TOP":    (0.0, 0.1, 0.5, 1.0), # Dark Blue
    "SMOOTH_MID":    (0.1, 0.4, 0.9, 1.0), # Medium Blue
    "SMOOTH_BOTTOM": (0.6, 0.8, 1.0, 1.0), # Light Blue
    
    "RIBBED_TOP":    (0.3, 0.0, 0.4, 1.0), # Dark Purple
    "RIBBED_MID":    (0.6, 0.2, 0.8, 1.0), # Medium Purple
    "RIBBED_BOTTOM": (0.9, 0.7, 1.0, 1.0), # Light Purple
    
    "TYPE_FLAT":     (1.0, 0.1, 0.1, 1.0), # Red highlight
    "TYPE_TUBE":     (1.0, 0.9, 0.0, 1.0), # Yellow highlight
}

def setup_scene():
    """Sets up a clean studio lighting environment."""
    # Clear existing objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # World Lighting (White Background)
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes.get('Background')
    bg.inputs[0].default_value = (1, 1, 1, 1) # Pure white
    bg.inputs[1].default_value = 1.0

    # Camera
    bpy.ops.object.camera_add(location=(110, -110, 90))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(75), 0, math.radians(45))
    bpy.context.scene.camera = cam    
    # Point camera at origin (where objects will be)
    direction = -cam.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam.rotation_euler = rot_quat.to_euler()
    # Sun Light
    bpy.ops.object.light_add(type='SUN', location=(100, -100, 200))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))

    # Render Engine
    if USE_CYCLES:
        bpy.context.scene.render.engine = 'CYCLES'
    else:
        bpy.context.scene.render.engine = 'BLENDER_EEVEE'

    bpy.context.scene.render.resolution_x = RESOLUTION_X
    bpy.context.scene.render.resolution_y = RESOLUTION_Y
    bpy.context.scene.render.film_transparent = True # Transparent BG - handled in PDF

def render_thumbnails():
    """Iterates through ALIGNED-STLS and renders each one."""
    if not os.path.exists(DIR_OUTPUT):
        os.makedirs(DIR_OUTPUT)

    # Walk through the variant folders
    for variant in sorted(os.listdir(DIR_ALIGNED)):
        if variant == "Documents" or variant.startswith("."): continue
        
        variant_path = os.path.join(DIR_ALIGNED, variant)
        if not os.path.isdir(variant_path): continue

        # Subfolders: Bottom, Middle, Top
        for sub in ["Bottom", "Middle", "Top"]:
            sub_path = os.path.join(variant_path, sub)
            if not os.path.exists(sub_path): continue

            # Target Output Folder
            out_dir = os.path.join(DIR_OUTPUT, variant, sub)
            os.makedirs(out_dir, exist_ok=True)

            for f in sorted(os.listdir(sub_path)):
                if not f.endswith(".stl"): continue
                
                stl_path = os.path.join(sub_path, f)
                img_name = f.replace(".stl", ".png")
                img_path = os.path.join(out_dir, img_name)

                # Skip if already exists (unless FORCE_RERENDER is True)
                if not FORCE_RERENDER and os.path.exists(img_path):
                    print(f"Skipping {img_name}...")
                    continue

                # Import STL
                bpy.ops.wm.stl_import(filepath=stl_path)
                obj = bpy.context.selected_objects[0]
                
                # Center and Frame
                bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
                obj.location = (0, 0, 0)
                
                # Determine Color Coding
                lower_f = f.lower()
                part_color = (0.5, 0.5, 0.5, 1.0) # Default Gray
                
                # 1. Texture Base (Smooth=Blue, Ribbed=Purple)
                is_smooth = "smooth" in lower_f
                
                # 2. Position Shade (Top=Dark, Mid=Medium, Bottom=Light)
                if "top" in lower_f:
                    part_color = COLORS["SMOOTH_TOP"] if is_smooth else COLORS["RIBBED_TOP"]
                elif "middle" in lower_f:
                    part_color = COLORS["SMOOTH_MID"] if is_smooth else COLORS["RIBBED_MID"]
                elif "bottom" in lower_f:
                    part_color = COLORS["SMOOTH_BOTTOM"] if is_smooth else COLORS["RIBBED_BOTTOM"]
                
                # 3. Form Type Highlight (Flat=Red, Tube=Yellow)
                # Note: We blend the color slightly to show the property
                type_highlight = COLORS["TYPE_FLAT"] if "flat" in lower_f else COLORS["TYPE_TUBE"]
                
                # Add material with specific color
                mat = bpy.data.materials.new(name=f"Material_{f}")
                mat.use_nodes = True
                nodes = mat.node_tree.nodes
                bsdf = nodes.get("Principled BSDF")
                
                # Final Color Blend: 80% Texture/Pos, 20% Type Highlight
                final_r = (part_color[0] * 0.8) + (type_highlight[0] * 0.2)
                final_g = (part_color[1] * 0.8) + (type_highlight[1] * 0.2)
                final_b = (part_color[2] * 0.8) + (type_highlight[2] * 0.2)
                
                bsdf.inputs['Base Color'].default_value = (final_r, final_g, final_b, 1.0)
                obj.data.materials.append(mat)

                # Render
                bpy.context.scene.render.filepath = img_path
                bpy.ops.render.render(write_still=True)

                # Cleanup for next part
                bpy.ops.object.delete()
                print(f"Rendered: {img_path}")

if __name__ == "__main__":
    setup_scene()
    render_thumbnails()
    print("Done! Check Notion/PART_THUMBNAILS")
