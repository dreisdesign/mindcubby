import os
import glob
import math
import subprocess
import bpy
from mathutils import Matrix, Vector


class OBJECT_OT_GenerateChainCircleBatch(bpy.types.Operator):
    bl_idname = "object.generate_chain_circle_batch"
    bl_label = "Generate Chain Circle"
    bl_options = {'REGISTER', 'UNDO'}

    # --- LINK COUNT PROPERTIES ---
    link_mode: bpy.props.EnumProperty(
        name="Link Mode",
        description="Choose between a single link count or batch exporting a range",
        items=[
            ('SINGLE', "Single Link Count", "Generate STL(s) for a specific link count"),
            ('RANGE', "Link Count Range", "Batch generate STLs across a range of link counts")
        ],
        default='SINGLE'
    )

    total_links: bpy.props.IntProperty(
        name="Total Links",
        description="Number of links to generate in the circle chain",
        default=12,
        min=3,
        max=500
    )

    links_min: bpy.props.IntProperty(
        name="Min Links",
        description="Starting link count for range export",
        default=6,
        min=3,
        max=500
    )

    links_max: bpy.props.IntProperty(
        name="Max Links",
        description="Ending link count for range export",
        default=20,
        min=3,
        max=500
    )

    links_step: bpy.props.IntProperty(
        name="Link Step",
        description="Step increment for link count range",
        default=2,
        min=1,
        max=50
    )

    # --- CIRCLE RADIUS PROPERTIES ---
    radius_mode: bpy.props.EnumProperty(
        name="Radius Mode",
        description="Choose between generating a single radius or a batch range",
        items=[
            ('SINGLE', "Single Radius", "Generate STL(s) for a specific circle radius"),
            ('RANGE', "Radius Range", "Batch generate STL(s) across a radius range")
        ],
        default='SINGLE'
    )

    circle_radius: bpy.props.FloatProperty(
        name="Circle Radius (mm)",
        description="Radius of the circle formed by the chain",
        default=25.0,
        min=10.0,
        max=100.0,
        step=0.1,
        precision=1
    )

    radius_min: bpy.props.FloatProperty(
        name="Min Radius (mm)",
        description="Starting radius for range mode",
        default=20.0,
        min=10.0,
        max=100.0,
        step=0.1,
        precision=1
    )

    radius_max: bpy.props.FloatProperty(
        name="Max Radius (mm)",
        description="Ending radius for range mode",
        default=30.0,
        min=10.0,
        max=100.0,
        step=0.1,
        precision=1
    )

    radius_step: bpy.props.FloatProperty(
        name="Radius Step (mm)",
        description="Step increment for radius range mode",
        default=5.0,
        min=0.5,
        max=20.0,
        step=0.1,
        precision=1
    )

    # --- PITCH PROPERTIES ---
    pitch_mode: bpy.props.EnumProperty(
        name="Pitch Mode",
        description="Choose between generating a single pitch STL or a batch range",
        items=[
            ('SINGLE', "Single Pitch", "Generate STL(s) for a specific pitch"),
            ('RANGE', "Pitch Range", "Batch generate STL(s) across a pitch range")
        ],
        default='SINGLE'
    )

    single_pitch: bpy.props.FloatProperty(
        name="Pitch (mm)",
        description="Target center-to-center pitch for single mode",
        default=13.0,
        min=1.0,
        max=30.0,
        step=0.01,
        precision=2
    )

    pitch_min: bpy.props.FloatProperty(
        name="Min Pitch (mm)",
        description="Starting pitch for range mode",
        default=12.0,
        min=1.0,
        max=30.0,
        step=0.01,
        precision=2
    )

    pitch_max: bpy.props.FloatProperty(
        name="Max Pitch (mm)",
        description="Ending pitch for range mode",
        default=14.0,
        min=1.0,
        max=30.0,
        step=0.01,
        precision=2
    )

    pitch_step: bpy.props.FloatProperty(
        name="Pitch Step (mm)",
        description="Step increment for pitch range mode",
        default=0.5,
        min=0.01,
        max=2.0,
        step=0.01,
        precision=2
    )

    # --- RADIAL OFFSET PROPERTIES ---
    radial_offset_mode: bpy.props.EnumProperty(
        name="Radial Offset Mode",
        description="Choose between a single radial offset or a batch range",
        items=[
            ('SINGLE', "Single Offset", "Generate STL(s) for a specific radial offset"),
            ('RANGE', "Offset Range", "Batch generate STL(s) across a radial offset range")
        ],
        default='SINGLE'
    )

    radial_offset: bpy.props.FloatProperty(
        name="Radial Offset (mm)",
        description="Outward offset to prevent circle link contact",
        default=0.0,
        min=-5.0,
        max=10.0,
        step=0.01,
        precision=2
    )

    radial_offset_min: bpy.props.FloatProperty(
        name="Min Offset (mm)",
        description="Starting radial offset for range mode",
        default=0.0,
        min=-5.0,
        max=10.0,
        step=0.01,
        precision=2
    )

    radial_offset_max: bpy.props.FloatProperty(
        name="Max Offset (mm)",
        description="Ending radial offset for range mode",
        default=1.0,
        min=-5.0,
        max=10.0,
        step=0.01,
        precision=2
    )

    radial_offset_step: bpy.props.FloatProperty(
        name="Offset Step (mm)",
        description="Step increment for radial offset range mode",
        default=0.5,
        min=0.01,
        max=5.0,
        step=0.01,
        precision=2
    )

    def calculate_total_files(self):
        # Calculate active link variations
        if self.link_mode == 'SINGLE':
            num_links = 1
        else:
            if self.links_step <= 0 or self.links_min > self.links_max:
                num_links = 0
            else:
                num_links = len(range(self.links_min, self.links_max + 1, self.links_step))

        # Calculate active radius variations
        if self.radius_mode == 'SINGLE':
            num_radii = 1
        else:
            if self.radius_step <= 0 or self.radius_min > self.radius_max:
                num_radii = 0
            else:
                num_radii = 0
                r = self.radius_min
                while r <= self.radius_max + 1e-5:
                    num_radii += 1
                    r += self.radius_step

        # Calculate active pitch variations
        if self.pitch_mode == 'SINGLE':
            num_pitches = 1
        else:
            if self.pitch_step <= 0 or self.pitch_min > self.pitch_max:
                num_pitches = 0
            else:
                num_pitches = 0
                p = self.pitch_min
                while p <= self.pitch_max + 1e-5:
                    num_pitches += 1
                    p += self.pitch_step

        # Calculate active radial offset variations
        if self.radial_offset_mode == 'SINGLE':
            num_offsets = 1
        else:
            if self.radial_offset_step <= 0 or self.radial_offset_min > self.radial_offset_max:
                num_offsets = 0
            else:
                num_offsets = 0
                r = self.radial_offset_min
                while r <= self.radial_offset_max + 1e-5:
                    num_offsets += 1
                    r += self.radial_offset_step

        return num_links * num_radii * num_pitches * num_offsets

    def invoke(self, context, event):
        # Restore saved scene defaults if available
        scene = context.scene

        # Link Count Scene Defaults
        if "chain_link_mode" in scene:
            self.link_mode = scene["chain_link_mode"]
        if "chain_total_links" in scene:
            self.total_links = scene["chain_total_links"]
        if "chain_links_min" in scene:
            self.links_min = scene["chain_links_min"]
        if "chain_links_max" in scene:
            self.links_max = scene["chain_links_max"]
        if "chain_links_step" in scene:
            self.links_step = scene["chain_links_step"]

        # Radius Scene Defaults
        if "chain_radius_mode" in scene:
            self.radius_mode = scene["chain_radius_mode"]
        if "chain_circle_radius" in scene:
            self.circle_radius = scene["chain_circle_radius"]
        if "chain_radius_min" in scene:
            self.radius_min = scene["chain_radius_min"]
        if "chain_radius_max" in scene:
            self.radius_max = scene["chain_radius_max"]
        if "chain_radius_step" in scene:
            self.radius_step = scene["chain_radius_step"]

        # Pitch Scene Defaults
        if "chain_pitch_mode" in scene:
            self.pitch_mode = scene["chain_pitch_mode"]

        if "chain_single_pitch" in scene:
            self.single_pitch = scene["chain_single_pitch"]
        if "chain_pitch_min" in scene:
            self.pitch_min = scene["chain_pitch_min"]
        if "chain_pitch_max" in scene:
            self.pitch_max = scene["chain_pitch_max"]
        if "chain_pitch_step" in scene:
            self.pitch_step = scene["chain_pitch_step"]

        # Radial Offset Scene Defaults
        if "chain_radial_offset_mode" in scene:
            self.radial_offset_mode = scene["chain_radial_offset_mode"]
        if "chain_radial_offset" in scene:
            self.radial_offset = scene["chain_radial_offset"]
        if "chain_radial_offset_min" in scene:
            self.radial_offset_min = scene["chain_radial_offset_min"]
        if "chain_radial_offset_max" in scene:
            self.radial_offset_max = scene["chain_radial_offset_max"]
        if "chain_radial_offset_step" in scene:
            self.radial_offset_step = scene["chain_radial_offset_step"]

        return context.window_manager.invoke_props_dialog(self)

    def draw(self, context):
        layout = self.layout

        # Link Count Settings Box
        box_links = layout.box()
        box_links.label(text="Link Count Settings", icon='LINKED')
        box_links.prop(self, "link_mode")
        if self.link_mode == 'SINGLE':
            box_links.prop(self, "total_links")
        else:
            box_links.prop(self, "links_min")
            box_links.prop(self, "links_max")
            box_links.prop(self, "links_step")

        # Circle Radius Box
        box_radius = layout.box()
        box_radius.label(text="Circle Geometry Settings", icon='FORCE_CURVE')
        box_radius.prop(self, "radius_mode")
        if self.radius_mode == 'SINGLE':
            box_radius.prop(self, "circle_radius")
        else:
            box_radius.prop(self, "radius_min")
            box_radius.prop(self, "radius_max")
            box_radius.prop(self, "radius_step")

        # Pitch Settings Box
        box_pitch = layout.box()
        box_pitch.label(text="Pitch Settings", icon='MODIFIER')
        box_pitch.prop(self, "pitch_mode")
        if self.pitch_mode == 'SINGLE':
            box_pitch.prop(self, "single_pitch")
        else:
            box_pitch.prop(self, "pitch_min")
            box_pitch.prop(self, "pitch_max")
            box_pitch.prop(self, "pitch_step")

        # Radial Offset Box
        box_offset = layout.box()
        box_offset.label(text="Radial Offset Settings (Prevent Contact)", icon='ARROW_LEFTRIGHT')
        box_offset.prop(self, "radial_offset_mode")
        if self.radial_offset_mode == 'SINGLE':
            box_offset.prop(self, "radial_offset")
        else:
            box_offset.prop(self, "radial_offset_min")
            box_offset.prop(self, "radial_offset_max")
            box_offset.prop(self, "radial_offset_step")

        # Summary / Total Files Box
        total_files = self.calculate_total_files()
        box_summary = layout.box()
        if total_files > 0:
            plural_suffix = "s" if total_files != 1 else ""
            box_summary.label(text=f"Total Output: {total_files} STL file{plural_suffix} will be generated", icon='FILE_3D')
        else:
            box_summary.label(text="Total Output: Invalid range inputs (0 files)", icon='ERROR')

    def execute(self, context):
        # Save current user choices to Scene so they persist across runs
        scene = context.scene

        scene["chain_link_mode"] = self.link_mode
        scene["chain_total_links"] = self.total_links
        scene["chain_links_min"] = self.links_min
        scene["chain_links_max"] = self.links_max
        scene["chain_links_step"] = self.links_step

        scene["chain_radius_mode"] = self.radius_mode
        scene["chain_circle_radius"] = self.circle_radius
        scene["chain_radius_min"] = self.radius_min
        scene["chain_radius_max"] = self.radius_max
        scene["chain_radius_step"] = self.radius_step

        scene["chain_pitch_mode"] = self.pitch_mode
        scene["chain_single_pitch"] = self.single_pitch
        scene["chain_pitch_min"] = self.pitch_min
        scene["chain_pitch_max"] = self.pitch_max
        scene["chain_pitch_step"] = self.pitch_step

        scene["chain_radial_offset_mode"] = self.radial_offset_mode
        scene["chain_radial_offset"] = self.radial_offset
        scene["chain_radial_offset_min"] = self.radial_offset_min
        scene["chain_radial_offset_max"] = self.radial_offset_max
        scene["chain_radial_offset_step"] = self.radial_offset_step

        # --- PATH CONFIGURATION (Folder Relative) ---
        blend_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else ""
        if not blend_dir:
            blend_dir = os.getcwd()

        BLEND_SAVE_PATH = os.path.join(blend_dir, "chainmaker_circle.blend")
        INPUT_DIR = os.path.join(blend_dir, "INPUT")
        OUTPUT_DIR = os.path.join(blend_dir, "OUTPUT")

        os.makedirs(INPUT_DIR, exist_ok=True)
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Find STL files in INPUT folder, fallback to root
        stl_files = glob.glob(os.path.join(INPUT_DIR, "*.stl"))
        if not stl_files:
            stl_files = glob.glob(os.path.join(blend_dir, "*.stl"))

        if not stl_files:
            self.report({'ERROR'}, f"No STL files found in 'INPUT' folder ({INPUT_DIR}) or project root.")
            return {'CANCELLED'}
        elif len(stl_files) > 1:
            file_list_str = "\n".join([os.path.basename(f) for f in stl_files])
            self.report(
                {'ERROR'},
                f"Multiple STL files found:\n{file_list_str}\n"
                "Please keep only a single STL file in the INPUT folder or root directory."
            )
            return {'CANCELLED'}

        STL_INPUT_PATH = stl_files[0]

        # --- CLEAR SCENE ---
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

        # --- IMPORT BASE LINK STL ---
        if hasattr(bpy.ops.wm, "stl_import"):
            bpy.ops.wm.stl_import(filepath=STL_INPUT_PATH)
        else:
            bpy.ops.import_mesh.stl(filepath=STL_INPUT_PATH)

        source_obj = bpy.context.selected_objects[0]
        bpy.context.view_layer.objects.active = source_obj
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='MEDIAN')

        # Store clean mesh data and remove source object immediately to prevent rogue links
        base_mesh = source_obj.data.copy()
        bpy.data.objects.remove(source_obj, do_unlink=True)

        # --- BUILD LINK COUNT LIST ---
        if self.link_mode == 'SINGLE':
            link_counts = [self.total_links]
        else:
            link_counts = list(range(self.links_min, self.links_max + 1, self.links_step))

        # --- BUILD RADIUS LIST ---
        if self.radius_mode == 'SINGLE':
            radius_values = [round(self.circle_radius, 1)]
        else:
            radius_values = []
            r = self.radius_min
            while r <= self.radius_max + 1e-5:
                radius_values.append(round(r, 1))
                r += self.radius_step

        # --- BUILD PITCH LIST ---
        if self.pitch_mode == 'SINGLE':
            pitch_values = [round(self.single_pitch, 2)]
        else:
            pitch_values = []
            p = self.pitch_min
            while p <= self.pitch_max + 1e-5:
                pitch_values.append(round(p, 2))
                p += self.pitch_step

        # --- BUILD RADIAL OFFSET LIST ---
        if self.radial_offset_mode == 'SINGLE':
            radial_offset_values = [round(self.radial_offset, 2)]
        else:
            radial_offset_values = []
            r = self.radial_offset_min
            while r <= self.radial_offset_max + 1e-5:
                radial_offset_values.append(round(r, 2))
                r += self.radial_offset_step

        # --- GENERATE STL(S) ---
        for radial_offset in radial_offset_values:
            for pitch in pitch_values:
                for radius in radius_values:
                    for num_links in link_counts:
                        # Clear residual objects from previous iteration
                        bpy.ops.object.select_all(action='SELECT')
                        bpy.ops.object.delete()

                        # --- CALCULATE LINK POSITIONS AROUND CIRCLE ---
                        positions = []
                        angle_step = (2 * math.pi) / num_links

                        for i in range(num_links):
                            theta = i * angle_step
                            r = radius + radial_offset
                            x = r * math.cos(theta)
                            y = r * math.sin(theta)
                            positions.append((Vector((x, y, 0)), theta))

                        created_objects = []

                        # --- CREATE AND POSITION LINKS ---
                        for i in range(num_links):
                            pos_curr, theta_curr = positions[i]
                            pos_next, theta_next = positions[(i + 1) % num_links]

                            # Calculate direction to next link
                            direction = (pos_next - pos_curr).normalized()

                            # Rotation in Z plane (angle around circle)
                            rot_z = math.atan2(direction.y, direction.x)

                            new_obj = bpy.data.objects.new("link", base_mesh.copy())
                            bpy.context.collection.objects.link(new_obj)
                            created_objects.append(new_obj)

                            # Standard orientation transformations
                            mat_stand = Matrix.Rotation(math.radians(90), 4, 'X')
                            tilt_angle = 45 if i % 2 == 0 else -45
                            mat_tilt = Matrix.Rotation(math.radians(tilt_angle), 4, 'X')

                            mat_rot_z = Matrix.Rotation(rot_z, 4, 'Z')
                            mat_trans = Matrix.Translation(pos_curr)

                            new_obj.matrix_world = mat_trans @ mat_rot_z @ mat_tilt @ mat_stand

                        # --- FLATTEN TO BED (Z=0) ---
                        bpy.ops.object.select_all(action='DESELECT')
                        for obj in created_objects:
                            obj.select_set(True)
                        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

                        lowest_z = min([min([v.co.z for v in obj.data.vertices]) for obj in created_objects])

                        for obj in created_objects:
                            obj.location.z -= lowest_z

                        bpy.ops.object.transform_apply(location=True)

                        # --- JOIN & EXPORT ---
                        bpy.ops.object.select_all(action='DESELECT')
                        for obj in created_objects:
                            obj.select_set(True)
                        bpy.context.view_layer.objects.active = created_objects[0]
                        bpy.ops.object.join()

                        filename = f"chain_circle_{num_links}links_{pitch:.2f}mm_radius_{radius:.1f}mm_offset_{radial_offset:.2f}mm.stl"

                        joined_obj = bpy.context.active_object
                        joined_obj.name = f"chain_circle_{num_links}links_p{pitch:.2f}_r{radius:.1f}_o{radial_offset:.2f}"

                        output_stl_path = os.path.join(OUTPUT_DIR, filename)

                        if hasattr(bpy.ops.wm, "stl_export"):
                            bpy.ops.wm.stl_export(filepath=output_stl_path)
                        else:
                            bpy.ops.export_mesh.stl(filepath=output_stl_path)

        bpy.ops.wm.save_as_mainfile(filepath=BLEND_SAVE_PATH)

        # --- REVEAL OUTPUT FOLDER IN FINDER ---
        subprocess.call(["open", OUTPUT_DIR])
        return {'FINISHED'}


# --- REGISTER AND RUN POPUP ---
classes = [OBJECT_OT_GenerateChainCircleBatch]

for cls in classes:
    try:
        bpy.utils.unregister_class(cls)
    except Exception:
        pass
    bpy.utils.register_class(cls)

bpy.ops.object.generate_chain_circle_batch('INVOKE_DEFAULT')
