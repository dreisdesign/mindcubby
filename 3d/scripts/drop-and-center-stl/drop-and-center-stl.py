import bpy
import mathutils
import os
import subprocess
import platform

def open_folder_natively(path):
    if platform.system() == 'Darwin':
        subprocess.run(["open", path])
    elif platform.system() == 'Windows':
        os.startfile(path)
    else:
        subprocess.run(["xdg-open", path])

class BatchCenterSTLOperator(bpy.types.Operator):
    bl_idname = "object.batch_center_stl"
    bl_label = "Batch Center STLs"
    bl_options = {'REGISTER', 'UNDO'}

    center_xy: bpy.props.BoolProperty(
        name="Center XY",
        description="Center model on XY plane",
        default=True
    )

    ground_z: bpy.props.BoolProperty(
        name="Ground Z (Z=0 at bottom)",
        description="Move bottom of model to Z=0 (build plate)",
        default=True
    )

    overwrite_existing: bpy.props.BoolProperty(
        name="Overwrite Existing STLs",
        description="Uncheck to save to 'CENTERED' subfolder instead",
        default=True
    )

    def draw(self, context):
        layout = self.layout
        
        layout.prop(self, "center_xy")
        layout.prop(self, "ground_z")
        layout.prop(self, "overwrite_existing")
        
        blend_filepath = bpy.data.filepath
        if blend_filepath:
            root_dir = os.path.dirname(blend_filepath)
            stl_dir = os.path.join(root_dir, "STL")
            if os.path.exists(stl_dir):
                stl_files = [f for f in os.listdir(stl_dir) if f.lower().endswith('.stl')]
                if stl_files:
                    layout.separator()
                    box = layout.box()
                    box.label(text="Files to process:", icon='FILE_FOLDER')
                    for f in stl_files[:10]:  # Show first 10
                        box.label(text=f"  • {f}", icon='MESH_DATA')
                    if len(stl_files) > 10:
                        box.label(text=f"  ... and {len(stl_files) - 10} more")

    def execute(self, context):
        blend_filepath = bpy.data.filepath
        if not blend_filepath:
            self.report({'ERROR'}, "Please save your Blender file before running this script.")
            return {'CANCELLED'}

        # PERSISTENCE: Save current inputs to the scene data block
        context.scene["center_stl_center_xy"] = self.center_xy
        context.scene["center_stl_ground_z"] = self.ground_z
        context.scene["center_stl_overwrite"] = self.overwrite_existing

        root_dir = os.path.dirname(blend_filepath)
        stl_dir = os.path.join(root_dir, "STL")
        centered_dir = os.path.join(stl_dir, "CENTERED") if not self.overwrite_existing else None

        stl_files = [f for f in os.listdir(stl_dir) if f.lower().endswith('.stl')]
        if not stl_files:
            open_folder_natively(stl_dir)
            return {'FINISHED'}

        if centered_dir:
            os.makedirs(centered_dir, exist_ok=True)

        unit_scale = context.scene.unit_settings.scale_length
        processed_count = 0

        for stl_filename in stl_files:
            stl_filepath = os.path.join(stl_dir, stl_filename)
            
            if self.overwrite_existing:
                output_filepath = stl_filepath
            else:
                output_filepath = os.path.join(centered_dir, stl_filename)

            print(f"Centering: {stl_filename}...")
            processed_count += 1

            # Clear scene
            bpy.ops.object.select_all(action='SELECT')
            bpy.ops.object.delete()

            # Import STL
            bpy.ops.wm.stl_import(filepath=stl_filepath)
            imported_obj = bpy.context.selected_objects[0] if bpy.context.selected_objects else None

            if not imported_obj:
                print(f"Warning: Could not import {stl_filename}")
                continue

            bpy.context.view_layer.objects.active = imported_obj
            imported_obj.select_set(True)

            # Get bounding box in world space
            bbox = [imported_obj.matrix_world @ mathutils.Vector(corner) for corner in imported_obj.bound_box]
            min_x = min(c.x for c in bbox)
            max_x = max(c.x for c in bbox)
            min_y = min(c.y for c in bbox)
            max_y = max(c.y for c in bbox)
            min_z = min(c.z for c in bbox)

            # Calculate offsets to center on XY and ground on Z
            if self.center_xy:
                center_x = (min_x + max_x) / 2
                center_y = (min_y + max_y) / 2
                imported_obj.location.x -= center_x
                imported_obj.location.y -= center_y

            if self.ground_z:
                imported_obj.location.z -= min_z

            # Apply transforms to actually move the geometry vertices
            bpy.ops.object.transform_apply(location=True)
            bpy.context.view_layer.update()

            # Ensure selected before export
            bpy.ops.object.select_all(action='DESELECT')
            imported_obj.select_set(True)
            bpy.context.view_layer.objects.active = imported_obj

            # Export centered STL
            bpy.ops.wm.stl_export(
                filepath=output_filepath,
                export_selected_objects=True,
                global_scale=1000.0
            )

            print(f"  ✓ Saved to {os.path.basename(output_filepath)}")

            # Cleanup
            bpy.ops.object.select_all(action='SELECT')
            bpy.ops.object.delete()

        output_folder = centered_dir if centered_dir else stl_dir
        print(f"Batch processing complete. {processed_count} files centered.")
        open_folder_natively(output_folder)
        return {'FINISHED'}

    def invoke(self, context, event):
        blend_filepath = bpy.data.filepath
        if not blend_filepath:
            self.report({'ERROR'}, "Please save your Blender file before running this script.")
            return {'CANCELLED'}

        # PERSISTENCE: Restore last-used values
        self.center_xy = context.scene.get("center_stl_center_xy", True)
        self.ground_z = context.scene.get("center_stl_ground_z", True)
        self.overwrite_existing = context.scene.get("center_stl_overwrite", True)

        root_dir = os.path.dirname(blend_filepath)
        stl_dir = os.path.join(root_dir, "STL")

        os.makedirs(stl_dir, exist_ok=True)

        stl_files = [f for f in os.listdir(stl_dir) if f.lower().endswith('.stl')]

        if not stl_files:
            open_folder_natively(root_dir)

            def draw_popup(self, context):
                self.layout.label(text="No STL files found!")
                self.layout.label(text="Created 'STL' folder alongside your .blend file.")
                self.layout.label(text="Please add STL files and run this script again.")

            context.window_manager.popup_menu(draw_popup, title="Folder Structure Ready", icon='INFO')
            return {'FINISHED'}

        return context.window_manager.invoke_props_dialog(self)

try:
    bpy.utils.unregister_class(BatchCenterSTLOperator)
except Exception:
    pass

bpy.utils.register_class(BatchCenterSTLOperator)
bpy.ops.object.batch_center_stl('INVOKE_DEFAULT')
