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

class BatchProcessSVGOperator(bpy.types.Operator):
    bl_idname = "object.batch_process_svg"
    bl_label = "Batch Process SVGs"
    bl_options = {'REGISTER', 'UNDO'}

    # We dynamically load these defaults in the invoke() method below
    target_width: bpy.props.FloatProperty(
        name="Width (mm)",
        description="Target width of the exported STL in millimeters",
        min=0.1
    )
    
    target_height: bpy.props.FloatProperty(
        name="Height (mm)",
        description="Target Z-height (thickness) in millimeters",
        min=0.01
    )

    mirror_on_x: bpy.props.BoolProperty(
        name="Mirror on X-axis (for text face-down)",
        description="Mirror the model on the X-axis for face-down printing (essential for readable text)",
        default=True
    )

    overwrite_existing: bpy.props.BoolProperty(
        name="Overwrite Existing STLs",
        description="Uncheck to skip files that already have an exported STL",
        default=True
    )

    def draw(self, context):
        layout = self.layout
        
        layout.prop(self, "target_width")
        layout.prop(self, "target_height")
        layout.prop(self, "mirror_on_x")
        layout.prop(self, "overwrite_existing")
        
        blend_filepath = bpy.data.filepath
        if blend_filepath:
            root_dir = os.path.dirname(blend_filepath)
            svg_dir = os.path.join(root_dir, "SVG")
            if os.path.exists(svg_dir):
                svg_files = [f for f in os.listdir(svg_dir) if f.lower().endswith('.svg')]
                if svg_files:
                    layout.separator()
                    box = layout.box()
                    box.label(text="Files to process:", icon='FILE_FOLDER')
                    for f in svg_files:
                        box.label(text=f"  • {f}", icon='CURVE_DATA')

    def execute(self, context):
        blend_filepath = bpy.data.filepath
        if not blend_filepath:
            self.report({'ERROR'}, "Please save your Blender file before running this script.")
            return {'CANCELLED'}

        # PERSISTENCE: Save current inputs to the scene data block before exporting
        context.scene["svg_batch_last_width"] = self.target_width
        context.scene["svg_batch_last_height"] = self.target_height
        context.scene["svg_batch_last_mirror_on_x"] = self.mirror_on_x

        root_dir = os.path.dirname(blend_filepath)
        svg_dir = os.path.join(root_dir, "SVG")
        stl_dir = os.path.join(root_dir, "STL")

        svg_files = [f for f in os.listdir(svg_dir) if f.lower().endswith('.svg')]
        if not svg_files:
            open_folder_natively(stl_dir)
            return {'FINISHED'}

        processed_any = False
        unit_scale = context.scene.unit_settings.scale_length

        for svg_filename in svg_files:
            svg_filepath = os.path.join(svg_dir, svg_filename)
            
            base_name = os.path.splitext(svg_filename)[0]
            dimension_suffix = f"_W-{self.target_width:.1f}mm_H-{self.target_height:.2f}mm"
            export_filepath = os.path.join(stl_dir, f"{base_name}{dimension_suffix}.stl")

            if os.path.exists(export_filepath) and not self.overwrite_existing:
                print(f"Skipping: {svg_filename} (STL already exists)")
                continue

            print(f"Processing: {svg_filename}...")
            processed_any = True

            pre_import_objects = set(bpy.data.objects)
            bpy.ops.import_curve.svg(filepath=svg_filepath)
            imported_curves = [obj for obj in bpy.data.objects if obj not in pre_import_objects and obj.type == 'CURVE']

            if not imported_curves:
                print(f"Warning: No curves found in {svg_filename}")
                continue

            bpy.ops.object.select_all(action='DESELECT')
            for obj in imported_curves:
                obj.select_set(True)

            parent_empties = [obj.parent for obj in imported_curves if obj.parent and obj.parent.type == 'EMPTY']
            bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')

            if parent_empties:
                bpy.ops.object.select_all(action='DESELECT')
                for empty in parent_empties:
                    empty.select_set(True)
                bpy.ops.object.delete()

            for obj in imported_curves:
                obj.select_set(True)

            bpy.context.view_layer.objects.active = imported_curves[0]
            bpy.ops.object.join()
            active_obj = bpy.context.active_object

            active_obj.data.resolution_u = 24
            active_obj.data.dimensions = '2D'
            active_obj.data.fill_mode = 'BOTH'
            
            base_thickness = 0.0001 / unit_scale  
            active_obj.data.extrude = base_thickness

            bpy.ops.object.convert(target='MESH')

            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.remove_doubles(threshold=1e-5)
            bpy.ops.mesh.normals_make_consistent(inside=False)
            bpy.ops.object.mode_set(mode='OBJECT')

            bpy.ops.object.transform_apply(scale=True, rotation=True, location=True)

            target_width_m = (self.target_width / 1000.0) / unit_scale
            target_z_dimension = (self.target_height / 1000.0) / unit_scale

            bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
            active_obj.location = (0, 0, 0)
            bpy.ops.object.transform_apply(location=True)

            if self.mirror_on_x:
                active_obj.scale.x *= -1
                bpy.ops.object.transform_apply(scale=True)
                bpy.context.view_layer.update()

            current_width = active_obj.dimensions.x
            if current_width > 0:
                scale_factor = target_width_m / current_width
                active_obj.scale.x = scale_factor
                active_obj.scale.y = scale_factor

            current_thickness = active_obj.dimensions.z
            if current_thickness > 0:
                active_obj.scale.z = target_z_dimension / current_thickness
            else:
                active_obj.scale.z = 1.0

            bpy.ops.object.transform_apply(scale=True)
            bpy.context.view_layer.update()

            bbox = [active_obj.matrix_world @ mathutils.Vector(corner) for corner in active_obj.bound_box]
            min_z = min(c.z for c in bbox)

            active_obj.location.x = 0
            active_obj.location.y = 0
            active_obj.location.z = -min_z
            bpy.ops.object.transform_apply(location=True)

            bpy.ops.wm.stl_export(
                filepath=export_filepath, 
                export_selected_objects=True,
                global_scale=1000.0
            )

            bpy.ops.object.select_all(action='DESELECT')
            active_obj.select_set(True)
            bpy.ops.object.delete()

        if processed_any:
            print("Batch processing complete.")
        else:
            print("All STL files are already up-to-date. No processing needed.")

        open_folder_natively(stl_dir)
        return {'FINISHED'}

    def invoke(self, context, event):
        blend_filepath = bpy.data.filepath
        if not blend_filepath:
            self.report({'ERROR'}, "Please save your Blender file before running this script.")
            return {'CANCELLED'}

        # PERSISTENCE: Check if the scene already has saved values. If not, use standard defaults.
        self.target_width = context.scene.get("svg_batch_last_width", 50.0)
        self.target_height = context.scene.get("svg_batch_last_height", 0.2)
        self.mirror_on_x = context.scene.get("svg_batch_last_mirror_on_x", True)

        root_dir = os.path.dirname(blend_filepath)
        svg_dir = os.path.join(root_dir, "SVG")
        stl_dir = os.path.join(root_dir, "STL")

        os.makedirs(svg_dir, exist_ok=True)
        os.makedirs(stl_dir, exist_ok=True)

        svg_files = [f for f in os.listdir(svg_dir) if f.lower().endswith('.svg')]

        if not svg_files:
            open_folder_natively(root_dir)
            
            def draw_popup(self, context):
                self.layout.label(text="No SVG files found!")
                self.layout.label(text="Created 'SVG' and 'STL' folders alongside your .blend file.")
                self.layout.label(text="Please add SVGs to the 'SVG' folder and run this script again.")
            
            context.window_manager.popup_menu(draw_popup, title="Folder Structure Ready", icon='INFO')
            return {'FINISHED'}

        return context.window_manager.invoke_props_dialog(self)

try:
    bpy.utils.unregister_class(BatchProcessSVGOperator)
except Exception:
    pass

bpy.utils.register_class(BatchProcessSVGOperator)
bpy.ops.object.batch_process_svg('INVOKE_DEFAULT')