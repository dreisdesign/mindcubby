#!/usr/bin/env python3
"""
Thumbnail Generator - Generate PNG thumbnails from 3D STL models.

This script can run in two contexts:
1. Standalone (for testing/demo)
2. Inside Blender (for production)

Usage:
  # In Blender:
  exec(open('/path/to/generate_thumbnails.py').read())
  
  # From command line:
  python generate_thumbnails.py --config config.yaml
  
  # With overrides:
  python generate_thumbnails.py --config config.yaml --input /path/input --output /path/output
"""

import sys
import os
from pathlib import Path

# Try to detect if running inside Blender
IN_BLENDER = False
try:
    import bpy
    IN_BLENDER = True
except ImportError:
    pass

# Import our modules
from config import Config
from cli import create_parser, print_config_summary
from blender_scene_setup import BlenderSceneSetup
from stl_importer import STLImporter
from thumbnail_renderer import ThumbnailRenderer


def main_blender(config_path: str = None, **kwargs) -> None:
    """Run from within Blender."""
    import bpy
    
    print("\n" + "=" * 60)
    print("🎬 THUMBNAIL GENERATOR (Blender Mode)")
    print("=" * 60)
    
    # Load configuration
    config = Config()
    
    if config_path:
        config.load_yaml(config_path)
    
    # Apply overrides from kwargs
    for key, value in kwargs.items():
        if value is not None:
            config.set(key, value)
    
    # Validate
    valid, error = config.validate()
    if not valid:
        print(f"❌ Configuration error: {error}")
        return
    
    print_config_summary(config.data)
    
    # Setup scene
    print("🎨 Setting up Blender scene...")
    scene_setup = BlenderSceneSetup(config.data)
    scene_setup.setup_complete_scene()
    
    # Find STLs
    print("🔍 Scanning for STL files...")
    input_dir = config.get("paths.input_dir")
    variant_pattern = config.get("batch.variant_pattern", "*")
    
    stl_variants = STLImporter.find_stl_files(input_dir, variant_pattern)
    
    if not stl_variants:
        print("❌ No STL files found!")
        return
    
    print(f"Found {len(stl_variants)} variants, {sum(len(v) for v in stl_variants.values())} files total")
    
    # Render thumbnails
    print("\n📸 Rendering thumbnails...")
    renderer = ThumbnailRenderer(config.data)
    output_dir = config.get("paths.output_dir")
    force_rerender = config.get("render.force_rerender", False)
    test_limit = config.get("batch.test_mode", 0)
    
    stats = renderer.batch_render(
        stl_variants, 
        output_dir,
        variant_filter=variant_pattern,
        test_limit=test_limit
    )
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ Rendering complete!")
    print(f"  Variants processed: {stats['total_variants']}")
    print(f"  Files rendered: {stats['total_rendered']}")
    print(f"  Files skipped: {stats['total_skipped']}")
    print(f"  Render failures: {stats['total_failed']}")
    print("=" * 60 + "\n")


def main_cli() -> None:
    """Run from command line."""
    parser = create_parser()
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("🎬 THUMBNAIL GENERATOR (CLI Mode)")
    print("=" * 60)
    
    # Load configuration
    config = Config()
    
    if args.config:
        try:
            config.load_yaml(args.config)
        except FileNotFoundError as e:
            print(f"❌ {e}")
            sys.exit(1)
    
    # Apply CLI overrides
    if args.input:
        config.set("paths.input_dir", args.input)
    if args.output:
        config.set("paths.output_dir", args.output)
    if args.resolution:
        config.set("render.resolution_x", args.resolution[0])
        config.set("render.resolution_y", args.resolution[1])
    if args.engine:
        config.set("render.engine", args.engine)
    if args.force_rerender:
        config.set("render.force_rerender", True)
    if args.test_limit:
        config.set("batch.test_mode", args.test_limit)
    if args.variant_pattern != "*":
        config.set("batch.variant_pattern", args.variant_pattern)
    
    # Validate
    valid, error = config.validate()
    if not valid:
        print(f"❌ Configuration error: {error}")
        sys.exit(1)
    
    print_config_summary(config.data)
    
    if args.validate_only:
        print("✅ Configuration is valid")
        sys.exit(0)
    
    if args.dry_run:
        print("📋 DRY RUN - Configuration validated but not running")
        sys.exit(0)
    
    if not IN_BLENDER:
        print("❌ This script must run inside Blender!")
        print("   Use: blender --background --python generate_thumbnails.py")
        sys.exit(1)
    
    # Run in Blender
    main_blender(
        config_path=args.config,
        input_dir=args.input,
        output_dir=args.output,
    )


if __name__ == "__main__":
    if IN_BLENDER:
        # When executed inside Blender, run with default config
        main_blender()
    else:
        # When run from CLI, parse arguments
        main_cli()
