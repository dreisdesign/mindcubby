"""
Generate Thumbnails - Modular 3D STL to PNG Thumbnail Pipeline

A flexible, testable system for batch-rendering 3D models to thumbnails.
Designed for both standalone use and integration into larger workflows.

Modules:
  - config: Configuration management (YAML, env vars, overrides)
  - blender_scene_setup: Blender scene/lighting/camera configuration
  - stl_importer: STL file discovery and import
  - thumbnail_renderer: Core rendering logic
  - cli: Command-line interface

Quick start:
  python generate_thumbnails.py --config config.yaml
"""

__version__ = "0.1.0"

from config import Config
from blender_scene_setup import BlenderSceneSetup
from stl_importer import STLImporter
from thumbnail_renderer import ThumbnailRenderer

__all__ = [
    "Config",
    "BlenderSceneSetup",
    "STLImporter", 
    "ThumbnailRenderer",
]
