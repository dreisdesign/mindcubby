#!/usr/bin/env python3
"""
Batch render 3D STL models to PNG thumbnails via Blender.

Usage (in Blender):
  1. Open Blender
  2. Go to Scripting workspace
  3. Paste this entire script into the text editor
  4. Adjust configuration at the top as needed
  5. Run the script (Alt+P)

Configuration:
  DIR_INPUT:    Directory containing STL models organized by {variant}/{position}/
  DIR_OUTPUT:   Directory to save rendered PNG thumbnails
  RESOLUTION:   Thumbnail size in pixels (512x512 default)
  RENDER_SAMPLES: Number of samples for EEVEE (more = higher quality, slower)
"""

import bpy
import os
import math
from pathlib import Path

# --- CONFIGURATION ---
# Modify these paths for your project
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIR_INPUT = os.path.join(BASE_DIR, "input_stls")      # Directory with STL files
DIR_OUTPUT = os.path.join(BASE_DIR, "output_thumbnails")  # Where to save PNGs

# Render settings
RESOLUTION_X = 512
RESOLUTION_Y = 512
RENDER_SAMPLES = 32        # EEVEE samples (32 = good balance)
USE_CYCLES = False         # False = EEVEE (faster), True = Cycles (better quality)
FORCE_RERENDER = False     # True = re-render all, False = skip existing

# Color scheme (RGBA tuples)
# Base colors by texture (smooth/ribbed) and position (top/middle/bottom)
COLORS = {
    "SMOOTH_TOP":    (0.0, 0.1, 0.5, 1.0),   # Dark blue
    "SMOOTH_MID":    (0.1, 0.4, 0.9, 1.0),   # Medium blue
    "SMOOTH_BOTTOM": (0.6, 0.8, 1.0, 1.0),   # Light blue
    
    "RIBBED_TOP":    (0.3, 0.0, 0.4, 1.0),   # Dark purple
    "RIBBED_MID":    (0.6, 0.2, 0.8, 1.0),   # Medium purple
    "RIBBED_BOTTOM": (0.9, 0.7, 1.0, 1.0),   # Light purple
    
    "TYPE_FLAT":     (1.0, 0.1, 0.1, 1.0),   # Red highlight
    "TYPE_TUBE":     (1.0, 0.9, 0.0, 1.0),   # Yellow highlight
}


def setup_scene():
    """Initialize Blender scene with studio lighting and camera."""
    # Clear all existing objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Configure world background (white)
    bpy.context.scene.world.use_nodes = True
    bg_node = bpy.context.scene.world.node_tree.nodes.get('Background')
    bg_node.inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)  # White
    bg_node.inputs[1].default_value = 1.0

    # Add camera
    bpy.ops.object.camera_add(location=(110, -110, 90))
    camera = bpy.context.active_object
    camera.rotation_euler = (math.radians(75), 0, math.radians(45))
    bpy.context.scene.camera = camera
    
    # Point camera at origin
    direction = -camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()

    # Add sun light for fill
    bpy.ops.object.light_add(type='SUN', location=(100, -100, 200))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))

    # Configure render engine
    bpy.context.scene.render.engine = 'BLENDER_EEVEE' if not USE_CYCLES else 'CYCLES'
    bpy.context.scene.render.resolution_x = RESOLUTION_X
    bpy.context.scene.render.resolution_y = RESOLUTION_Y
    bpy.context.scene.render.film_transparent = True


def get_color_for_file(filename: str) -> tuple:
    """Determine color based on filename patterns."""
    lower = filename.lower()
    
    # Base color: smooth=blue, ribbed=purple
    is_smooth = "smooth" in lower
    
    # Position shade: top=dark, middle=medium, bottom=light
    if "top" in lower:
        color = COLORS["SMOOTH_TOP"] if is_smooth else COLORS["RIBBED_TOP"]
    elif "middle" in lower:
        color = COLORS["SMOOTH_MID"] if is_smooth else COLORS["RIBBED_MID"]
    elif "bottom" in lower:
        color = COLORS["SMOOTH_BOTTOM"] if is_smooth else COLORS["RIBBED_BOTTOM"]
    else:
        color = (0.5, 0.5, 0.5, 1.0)  # Default gray
    
    # Type highlight: flat=red, tube=yellow (blend 20%)
    type_color = COLORS["TYPE_FLAT"] if "flat" in lower else COLORS["TYPE_TUBE"]
    
    # Blend: 80% position/texture, 20% type highlight
    final = (
        color[0] * 0.8 + type_color[0] * 0.2,
        color[1] * 0.8 + type_color[1] * 0.2,
        color[2] * 0.8 + type_color[2] * 0.2,
        1.0
    )
    
    return final


def render_thumbnails():
    """Walk input directory and render STLs to PNGs."""
    if not os.path.exists(DIR_INPUT):
        print(f"ERROR: Input directory not found: {DIR_INPUT}")
        return

    os.makedirs(DIR_OUTPUT, exist_ok=True)
    
    print("\n" + "="*60)
    print("🎬 THUMBNAIL GENERATOR")
    print("="*60)
    print(f"Input:  {DIR_INPUT}")
    print(f"Output: {DIR_OUTPUT}")
    print()

    render_count = 0

    # Walk through variants/{position}/*.stl
    for variant in sorted(os.listdir(DIR_INPUT)):
        variant_path = os.path.join(DIR_INPUT, variant)
        if not os.path.isdir(variant_path) or variant.startswith("."):
            continue

        # Walk through position folders (Top, Middle, Bottom)
        for position in sorted(os.listdir(variant_path)):
            pos_path = os.path.join(variant_path, position)
            if not os.path.isdir(pos_path):
                continue

            # Create output directory
            out_dir = os.path.join(DIR_OUTPUT, variant, position)
            os.makedirs(out_dir, exist_ok=True)

            # Process each STL file
            for filename in sorted(os.listdir(pos_path)):
                if not filename.lower().endswith(".stl"):
                    continue

                stl_path = os.path.join(pos_path, filename)
                png_name = filename.replace(".stl", ".png")
                png_path = os.path.join(out_dir, png_name)

                # Skip if exists (unless FORCE_RERENDER)
                if not FORCE_RERENDER and os.path.exists(png_path):
                    print(f"  ⊘ {variant}/{position}/{png_name} (exists)")
                    continue

                print(f"  ◌ Rendering {variant}/{position}/{png_name}...")

                # Import STL
                try:
                    bpy.ops.wm.stl_import(filepath=stl_path)
                    obj = bpy.context.selected_objects[0]
                except Exception as e:
                    print(f"    ERROR importing: {e}")
                    continue

                # Center geometry at origin
                bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
                obj.location = (0, 0, 0)

                # Apply material with color
                mat = bpy.data.materials.new(name=f"Material_{filename}")
                mat.use_nodes = True
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                bsdf.inputs['Base Color'].default_value = get_color_for_file(filename)
                obj.data.materials.append(mat)

                # Render
                try:
                    bpy.context.scene.render.filepath = png_path
                    bpy.ops.render.render(write_still=True)
                    print(f"    ✓ {png_path}")
                    render_count += 1
                except Exception as e:
                    print(f"    ERROR rendering: {e}")

                # Clean up for next STL
                bpy.ops.object.delete()

    print()
    print("="*60)
    print(f"✓ Rendered {render_count} thumbnails")
    print("="*60 + "\n")


# --- MAIN ---
if __name__ == "__main__":
    setup_scene()
    render_thumbnails()
