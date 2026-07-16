import bpy
import mathutils
import os

class CenterSTLOperator(bpy.types.Operator):
    bl_idname = "object.center_stl"
    bl_label = "Center STL on Build Plate"
    bl_options = {'REGISTER', 'UNDO'}

    center_xy: bpy.props.BoolProperty(
        name="Center XY",
        description="Center the model on the XY plane",
        default=True
    )

    ground_z: bpy.props.BoolProperty(
        name="Ground Z (at Z=0)",
        description="Move the model so its lowest point is at Z=0 (build plate)",
        default=True
    )

    def draw(self, context):
        layout = self.layout
        layout.prop(self, "center_xy")
        layout.prop(self, "ground_z")

    def execute(self, context):
        selected_objects = [obj for obj in context.selected_objects if obj.type == 'MESH']
        
        if not selected_objects:
            self.report({'ERROR'}, "No mesh objects selected")
            return {'CANCELLED'}

        for obj in selected_objects:
            self.center_object(obj, context)

        self.report({'INFO'}, f"Centered {len(selected_objects)} object(s)")
        return {'FINISHED'}

    def center_object(self, obj, context):
        """Center a single mesh object on the build plate"""
        bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
        
        min_x = min(c.x for c in bbox)
        max_x = max(c.x for c in bbox)
        min_y = min(c.y for c in bbox)
        max_y = max(c.y for c in bbox)
        min_z = min(c.z for c in bbox)

        # Calculate center offsets
        if self.center_xy:
            center_x = (min_x + max_x) / 2
            center_y = (min_y + max_y) / 2
            obj.location.x -= center_x
            obj.location.y -= center_y

        if self.ground_z:
            z_offset = -min_z
            obj.location.z += z_offset

        # Apply transforms
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=True)
        print(f"Centered: {obj.name}")

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self)


try:
    bpy.utils.unregister_class(CenterSTLOperator)
except Exception:
    pass

bpy.utils.register_class(CenterSTLOperator)
bpy.ops.object.center_stl('INVOKE_DEFAULT')
