#!/usr/bin/env python3
"""
Batch render 3D STL models to PNG thumbnails via Blender.

Usage (in Blender):
  1. Open Blender and save a .blend file
  2. Go to Scripting workspace
  3. Paste this entire script into the text editor
  4. Run the script (Alt+P)
  5. A dialog will appear - select options and click "Batch Render Thumbnails"

The script expects:
  - Blender file saved in a directory
  - STL files in: {blend_file_directory}/STL/
  - Creates: {blend_file_directory}/THUMBNAILS/

Directory structure:
  STL/
  ├── variant_1/
  │   ├── Top/
  │   ├── Middle/
  │   └── Bottom/
  └── variant_2/
"""

import bpy
import os
import math
from pathlib import Path

# Render settings (global)
RESOLUTION_X = 512
RESOLUTION_Y = 512
RENDER_SAMPLES = 32        # EEVEE samples
USE_CYCLES = False         # False = EEVEE (faster), True = Cycles (better quality)
FORCE_RERENDER = False     # True = re-render all, False = skip existing

# Color scheme (RGBA tuples)
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
    bg_node.inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
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

    # Add sun light
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
    is_smooth = "smooth" in lower
    
    if "top" in lower:
        color = COLORS["SMOOTH_TOP"] if is_smooth else COLORS["RIBBED_TOP"]
    elif "middle" in lower:
        color = COLORS["SMOOTH_MID"] if is_smooth else COLORS["RIBBED_MID"]
    elif "bottom" in lower:
        color = COLORS["SMOOTH_BOTTOM"] if is_smooth else COLORS["RIBBED_BOTTOM"]
    else:
        color = (0.5, 0.5, 0.5, 1.0)
    
    type_color = COLORS["TYPE_FLAT"] if "flat" in lower else COLORS["TYPE_TUBE"]
    
    final = (
        color[0] * 0.8 + type_color[0] * 0.2,
        color[1] * 0.8 + type_color[1] * 0.2,
        color[2] * 0.8 + type_color[2] * 0.2,
        1.0
    )
    
    return final


def render_thumbnails(stl_dir: str, output_dir: str) -> int:
    """Walk input directory and render STLs to PNGs."""
    if not os.path.exists(stl_dir):
        print(f"ERROR: Input directory not found: {stl_dir}")
        return 0

    os.makedirs(output_dir, exist_ok=True)
    
    print("\n" + "="*60)
    print("🎬 THUMBNAIL GENERATOR")
    print("="*60)
    print(f"Input:  {stl_dir}")
    print(f"Output: {output_dir}")
    print()

    render_count = 0

    for variant in sorted(os.listdir(stl_dir)):
        variant_path = os.path.join(stl_dir, variant)
        if not os.path.isdir(variant_path) or variant.startswith("."):
            continue

        for position in sorted(os.listdir(variant_path)):
            pos_path = os.path.join(variant_path, position)
            if not os.path.isdir(pos_path):
                continue

            out_dir = os.path.join(output_dir, variant, position)
            os.makedirs(out_dir, exist_ok=True)

            for filename in sorted(os.listdir(pos_path)):
                if not filename.lower().endswith(".stl"):
                    continue

                stl_path = os.path.join(pos_path, filename)
                png_name = filename.replace(".stl", ".png")
                png_path = os.path.join(out_dir, png_name)

                if not FORCE_RERENDER and os.path.exists(png_path):
                    print(f"  ⊘ {variant}/{position}/{png_name} (exists)")
                    continue

                print(f"  ◌ Rendering {variant}/{position}/{png_name}...")

                try:
                    bpy.ops.wm.stl_import(filepath=stl_path)
                    obj = bpy.context.selected_objects[0]
                except Exception as e:
                    print(f"    ERROR importing: {e}")
                    continue

                bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
                obj.location = (0, 0, 0)

                mat = bpy.data.materials.new(name=f"Material_{filename}")
                mat.use_nodes = True
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                bsdf.inputs['Base Color'].default_value = get_color_for_file(filename)
                obj.data.materials.append(mat)

                try:
                    bpy.context.scene.render.filepath = png_path
                    bpy.ops.render.render(write_still=True)
                    print(f"    ✓ {png_path}")
                    render_count += 1
                except Exception as e:
                    print(f"    ERROR rendering: {e}")

                bpy.ops.object.delete()

    print()
    print("="*60)
    print(f"✓ Rendered {render_count} thumbnails")
    print("="*60 + "\n")
    
    return render_count


class BatchRenderThumbnailsOperator(bpy.types.Operator):
    """Batch render STL models to PNG thumbnails."""
    bl_idname = "object.batch_render_thumbnails"
    bl_label = "Batch Render Thumbnails"
    bl_options = {'REGISTER', 'UNDO'}

    force_rerender: bpy.props.BoolProperty(
        name="Force Re-render",
        description="Re-render all images (uncheck to skip existing)",
        default=False
    )

    use_cycles: bpy.props.BoolProperty(
        name="Use Cycles Engine",
        description="Use Cycles for rendering (slower, higher quality)",
        default=False
    )

    def draw(self, context):
        layout = self.layout
        
        blend_filepath = bpy.data.filepath
        if not blend_filepath:
            layout.label(text="⚠ Save your Blender file first!", icon='ERROR')
            return
        
        root_dir = os.path.dirname(blend_filepath)
        stl_dir = os.path.join(root_dir, "STL")
        output_dir = os.path.join(root_dir, "THUMBNAILS")
        
        box = layout.box()
        box.label(text="Input:  " + stl_dir, icon='FOLDER_REDIRECT')
        box.label(text="Output: " + output_dir, icon='FOLDER_REDIRECT')
        
        if os.path.exists(stl_dir):
            stl_files = []
            for root, dirs, files in os.walk(stl_dir):
                for f in files:
                    if f.lower().endswith('.stl'):
                        stl_files.append(os.path.join(root, f))
            
            if stl_files:
                layout.separator()
                box = layout.box()
                box.label(text=f"Found {len(stl_files)} STL files to render", icon='MESH_DATA')
                
                for stl_file in stl_files[:10]:
                    rel_path = os.path.relpath(stl_file, stl_dir)
                    box.label(text=f"  • {rel_path}", icon='FILE')
                
                if len(stl_files) > 10:
                    box.label(text=f"  ... and {len(stl_files) - 10} more")
            else:
                layout.separator()
                layout.label(text="⚠ No STL files found in STL/ directory", icon='INFO')
        else:
            layout.separator()
            layout.label(text="⚠ STL directory not found", icon='ERROR')
        
        layout.separator()
        layout.prop(self, "force_rerender")
        layout.prop(self, "use_cycles")

    def execute(self, context):
        blend_filepath = bpy.data.filepath
        if not blend_filepath:
            self.report({'ERROR'}, "Please save your Blender file before running this script.")
            return {'CANCELLED'}

        root_dir = os.path.dirname(blend_filepath)
        stl_dir = os.path.join(root_dir, "STL")
        output_dir = os.path.join(root_dir, "THUMBNAILS")

        if not os.path.exists(stl_dir):
            self.report({'ERROR'}, f"STL directory not found: {stl_dir}")
            return {'CANCELLED'}

        context.scene["tg_force_rerender"] = self.force_rerender
        context.scene["tg_use_cycles"] = self.use_cycles

        global FORCE_RERENDER, USE_CYCLES
        FORCE_RERENDER = self.force_rerender
        USE_CYCLES = self.use_cycles

        setup_scene()
        render_count = render_thumbnails(stl_dir, output_dir)

        if render_count == 0:
            self.report({'INFO'}, "No new thumbnails to render (all exist, use Force Re-render to override)")
        else:
            self.report({'INFO'}, f"Rendered {render_count} thumbnails")

        return {'FINISHED'}


def register():
    bpy.utils.register_class(BatchRenderThumbnailsOperator)


def unregister():
    bpy.utils.unregister_class(BatchRenderThumbnailsOperator)


if __name__ == "__main__":
    register()
    
    # Show the operator dialog
    bpy.ops.object.batch_render_thumbnails('INVOKE_DEFAULT')
