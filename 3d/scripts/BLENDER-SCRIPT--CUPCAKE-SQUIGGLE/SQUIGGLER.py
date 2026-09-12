bl_info = {
    "name": "Hostess Squiggle Generator",
    "author": "",
    "version": (1, 19),
    "blender": (3, 0, 0),
    "location": "View3D > Add > Curve",
    "description": "Generates a Hostess squiggle with adjustable quality and tube side sliders",
    "category": "Add Curve",
}

import bpy
import math
import json
import os

def get_config_path():
    return os.path.join(bpy.utils.user_resource('CONFIG'), "hostess_squiggle_config.json")

def load_config():
    config_path = get_config_path()
    default_data = {
        "scale_factor": 3.0,
        "num_loops": 7,
        "radius_y": 1.2,
        "loop_width": 2.35,
        "slant": 0.40,
        "corkscrew_height": 0.30,
        "icing_radius": 0.25,
        "tube_sides": 28,
        "curve_resolution": 36
    }
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                data = json.load(f)
                for k in default_data:
                    if k not in data:
                        data[k] = default_data[k]
                return data
        except:
            pass
    return default_data

def save_config(data):
    config_path = get_config_path()
    try:
        with open(config_path, 'w') as f:
            json.dump(data, f)
    except:
        pass

class OBJECT_OT_generate_hostess_squiggle(bpy.types.Operator):
    bl_idname = "object.generate_hostess_squiggle"
    bl_label = "Generate Hostess Squiggle"
    bl_options = {'REGISTER', 'UNDO'}
    
    scale_factor: bpy.props.FloatProperty(
        name="Overall Scale",
        description="Overall size of the squiggle",
        default=3.0,
        min=0.5,
        max=15.0
    )
    num_loops: bpy.props.IntProperty(
        name="Number of Loops",
        description="Total loops in the squiggle",
        default=7,
        min=1,
        max=20
    )
    radius_y: bpy.props.FloatProperty(
        name="Loop Height",
        description="Height of the loops",
        default=1.2,
        min=0.2,
        max=5.0
    )
    loop_width: bpy.props.FloatProperty(
        name="Loop Width",
        description="Horizontal width of individual loops independent of overall span",
        default=2.35,
        min=0.2,
        max=10.0
    )
    slant: bpy.props.FloatProperty(
        name="Loop Slant",
        description="Cursive lean of the loops (set to 0 for vertical loops)",
        default=0.40,
        min=-2.0,
        max=4.0
    )
    corkscrew_height: bpy.props.FloatProperty(
        name="Corkscrew Height",
        description="Vertical separation height where the loop crosses over itself",
        default=0.30,
        min=0.01,
        max=2.0
    )
    icing_radius: bpy.props.FloatProperty(
        name="Icing Thickness",
        description="Thickness of the piped pastry bag profile",
        default=0.25,
        min=0.01,
        max=5.0
    )
    tube_sides: bpy.props.IntProperty(
        name="Tube Sides (Quality)",
        description="Cross-section resolution (higher means a rounder tube)",
        default=28,
        min=12,
        max=48
    )
    curve_resolution: bpy.props.IntProperty(
        name="Path Resolution",
        description="Detail density along the length of the curve",
        default=36,
        min=16,
        max=64
    )
    
    def invoke(self, context, event):
        config = load_config()
        self.scale_factor = config.get("scale_factor", self.scale_factor)
        self.num_loops = config.get("num_loops", self.num_loops)
        self.radius_y = config.get("radius_y", self.radius_y)
        self.loop_width = config.get("loop_width", self.loop_width)
        self.slant = config.get("slant", self.slant)
        self.corkscrew_height = config.get("corkscrew_height", self.corkscrew_height)
        self.icing_radius = config.get("icing_radius", self.icing_radius)
        self.tube_sides = config.get("tube_sides", self.tube_sides)
        self.curve_resolution = config.get("curve_resolution", self.curve_resolution)
        
        return context.window_manager.invoke_props_dialog(self, width=400)

    def execute(self, context):
        config = {
            "scale_factor": self.scale_factor,
            "num_loops": self.num_loops,
            "radius_y": self.radius_y,
            "loop_width": self.loop_width,
            "slant": self.slant,
            "corkscrew_height": self.corkscrew_height,
            "icing_radius": self.icing_radius,
            "tube_sides": self.tube_sides,
            "curve_resolution": self.curve_resolution
        }
        save_config(config)

        name = "Hostess_Squiggle"
        num_loops = self.num_loops
        scale = self.scale_factor
        
        forward_speed = 0.5 * scale
        radius_y = self.radius_y
        radius_x = self.loop_width  
        slant = self.slant
        overlap_z = self.corkscrew_height
        icing_radius = self.icing_radius
        
        resolution = self.curve_resolution
        resolution_u = max(8, resolution // 2)
        bevel_resolution = self.tube_sides
        
        t_start = -math.pi / 1.5
        t_end = (num_loops * 2 * math.pi) + (math.pi / 1.5)
        total_points = int(num_loops * resolution + resolution)
        
        points = []
        for i in range(total_points):
            t = t_start + (t_end - t_start) * (i / (total_points - 1))
            y = -radius_y * math.cos(t) + radius_y
            x = (forward_speed * t) + (radius_x * math.sin(t)) + (slant * y)
            z = (overlap_z * -math.sin(t)) + icing_radius
            points.append((x, y, z))

        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
        if name in bpy.data.curves:
            bpy.data.curves.remove(bpy.data.curves[name], do_unlink=True)

        curve_data = bpy.data.curves.new(name, type='CURVE')
        curve_data.dimensions = '3D'
        curve_data.resolution_u = resolution_u
        curve_data.bevel_depth = icing_radius
        curve_data.bevel_resolution = bevel_resolution
        curve_data.fill_mode = 'FULL'
        curve_data.use_fill_caps = True 

        spline = curve_data.splines.new(type='NURBS')
        spline.points.add(len(points) - 1)
        spline.use_endpoint_u = True
        spline.order_u = 4

        for i, p in enumerate(points):
            spline.points[i].co = (p[0], p[1], p[2], 1.0)

        curve_obj = bpy.data.objects.new(name, curve_data)
        bpy.context.collection.objects.link(curve_obj)

        bpy.ops.object.select_all(action='DESELECT')
        curve_obj.select_set(True)
        bpy.context.view_layer.objects.active = curve_obj
        bpy.ops.object.convert(target='MESH')

        mat_name = "Icing_White"
        if mat_name not in bpy.data.materials:
            mat = bpy.data.materials.new(name=mat_name)
            mat.use_nodes = True
            nodes = mat.node_tree.nodes
            bsdf = nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs['Base Color'].default_value = (0.95, 0.93, 0.88, 1.0) 
                bsdf.inputs['Roughness'].default_value = 0.15
                if 'Specular IOR Level' in bsdf.inputs:
                    bsdf.inputs['Specular IOR Level'].default_value = 0.6
                elif 'Specular' in bsdf.inputs:
                    bsdf.inputs['Specular'].default_value = 0.6
        else:
            mat = bpy.data.materials[mat_name]

        if curve_obj.data.materials:
            curve_obj.data.materials[0] = mat
        else:
            curve_obj.data.materials.append(mat)

        bpy.ops.object.shade_smooth()

        self.report({'INFO'}, "Hostess Squiggle generated successfully!")
        return {'FINISHED'}

def menu_func(self, context):
    self.layout.operator(OBJECT_OT_generate_hostess_squiggle.bl_idname, text="Hostess Squiggle", icon="CURVE_DATA")

def register():
    bpy.utils.register_class(OBJECT_OT_generate_hostess_squiggle)
    bpy.types.VIEW3D_MT_curve_add.append(menu_func)

def unregister():
    bpy.types.VIEW3D_MT_curve_add.remove(menu_func)
    bpy.utils.unregister_class(OBJECT_OT_generate_hostess_squiggle)

if __name__ == "__main__":
    register()
    bpy.ops.object.generate_hostess_squiggle('INVOKE_DEFAULT')