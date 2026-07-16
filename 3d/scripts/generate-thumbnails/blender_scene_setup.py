"""
Blender scene setup module.
Handles camera, lighting, and render engine configuration.
"""

import math
import bpy
from mathutils import Vector
from typing import Tuple


class BlenderSceneSetup:
    """Configure Blender scene for 3D rendering."""
    
    def __init__(self, config: dict):
        self.config = config
    
    def clear_scene(self) -> None:
        """Delete all objects in scene."""
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()
    
    def setup_world(self, bg_color: Tuple[float, float, float, float] = (1, 1, 1, 1)) -> None:
        """Setup world background and ambient lighting."""
        bpy.context.scene.world.use_nodes = True
        bg = bpy.context.scene.world.node_tree.nodes.get('Background')
        if bg:
            bg.inputs[0].default_value = bg_color
            bg.inputs[1].default_value = 1.0
    
    def add_camera(self, location: Tuple[float, float, float], 
                   rotation_deg: Tuple[float, float, float]) -> object:
        """Add and configure camera.
        
        Args:
            location: (x, y, z) position
            rotation_deg: (rx, ry, rz) rotation in degrees
        
        Returns:
            Camera object
        """
        bpy.ops.object.camera_add(location=location)
        cam = bpy.context.active_object
        
        # Convert degrees to radians
        cam.rotation_euler = tuple(math.radians(d) for d in rotation_deg)
        
        # Point camera at origin
        direction = -cam.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot_quat.to_euler()
        
        bpy.context.scene.camera = cam
        return cam
    
    def add_sun_light(self, location: Tuple[float, float, float], 
                      energy: float,
                      rotation_deg: Tuple[float, float, float]) -> object:
        """Add sun light.
        
        Args:
            location: (x, y, z) position
            energy: Light strength
            rotation_deg: (rx, ry, rz) rotation in degrees
        
        Returns:
            Light object
        """
        bpy.ops.object.light_add(type='SUN', location=location)
        light = bpy.context.active_object
        light.data.energy = energy
        light.rotation_euler = tuple(math.radians(d) for d in rotation_deg)
        return light
    
    def set_render_engine(self, engine: str, samples: int = 16) -> None:
        """Set render engine and quality.
        
        Args:
            engine: 'EEVEE' or 'CYCLES'
            samples: Number of samples (for Cycles)
        """
        bpy.context.scene.render.engine = engine
        
        if engine == 'CYCLES':
            bpy.context.scene.cycles.samples = samples
    
    def set_render_output(self, resolution_x: int, resolution_y: int, 
                         transparent_bg: bool = True) -> None:
        """Configure render output settings."""
        bpy.context.scene.render.resolution_x = resolution_x
        bpy.context.scene.render.resolution_y = resolution_y
        bpy.context.scene.render.film_transparent = transparent_bg
    
    def setup_complete_scene(self) -> None:
        """Full scene setup using config values."""
        scene_cfg = self.config.get("scene", {})
        render_cfg = self.config.get("render", {})
        
        self.clear_scene()
        
        bg_color = tuple(scene_cfg.get("background_color", (1, 1, 1, 1)))
        self.setup_world(bg_color)
        
        cam_loc = tuple(scene_cfg.get("camera_location", (110, -110, 90)))
        cam_rot = tuple(scene_cfg.get("camera_rotation", (75, 0, 45)))
        self.add_camera(cam_loc, cam_rot)
        
        light_loc = tuple(scene_cfg.get("light_location", (100, -100, 200)))
        light_energy = scene_cfg.get("light_energy", 5.0)
        light_rot = tuple(scene_cfg.get("light_rotation", (45, 0, 30)))
        self.add_sun_light(light_loc, light_energy, light_rot)
        
        engine = render_cfg.get("engine", "EEVEE")
        samples = render_cfg.get("samples", 16)
        self.set_render_engine(engine, samples)
        
        res_x = render_cfg.get("resolution_x", 512)
        res_y = render_cfg.get("resolution_y", 512)
        transparent = render_cfg.get("transparent_bg", True)
        self.set_render_output(res_x, res_y, transparent)
