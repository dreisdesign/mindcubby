"""
Test examples for generate-thumbnails modules.
Run these to validate individual components.
"""

import os
from pathlib import Path

# Test configuration module
def test_config():
    from config import Config
    
    print("\n🧪 Testing Config module...")
    
    # Test default config
    config = Config()
    assert config.get("render.resolution_x") == 512
    print("  ✓ Default config loaded")
    
    # Test set/get with dot notation
    config.set("render.resolution_x", 1024)
    assert config.get("render.resolution_x") == 1024
    print("  ✓ Set/get with dot notation works")
    
    # Test nested dict structure
    assert isinstance(config.get("scene"), dict)
    print("  ✓ Nested dict access works")
    
    # Test validation
    config.set("paths.input_dir", "/nonexistent")
    config.set("paths.output_dir", "/tmp")
    valid, error = config.validate()
    assert not valid  # Should fail - input dir doesn't exist
    print(f"  ✓ Validation catches missing paths: {error}")
    
    print("✅ Config module tests passed\n")


def test_stl_importer():
    print("\n🧪 Testing STLImporter module...")
    
    try:
        from stl_importer import STLImporter
    except ImportError as e:
        print(f"  ⊘ Cannot import STLImporter: {e}")
        print("  ⊘ (Requires Blender bpy module)")
        return
    
    # Test with a real directory if available
    test_dir = "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables/ETSY_EXPORTS-AND-PACKAGING/02-ALIGNED-STLS"
    
    if Path(test_dir).exists():
        variants = STLImporter.find_stl_files(test_dir)
        print(f"  ✓ Found {len(variants)} variant folders")
        
        if variants:
            first_variant = list(variants.keys())[0]
            print(f"  ✓ Example variant: {first_variant}")
            print(f"    Files: {len(variants[first_variant])}")
    else:
        print("  ⊘ Test directory not found, skipping file discovery test")
    
    # Test that it handles missing directories
    try:
        STLImporter.find_stl_files("/nonexistent")
        assert False, "Should have raised FileNotFoundError"
    except FileNotFoundError:
        print("  ✓ Correctly raises error for missing directory")
    
    print("✅ STLImporter module tests passed\n")


def test_blender_scene_setup():
    print("\n🧪 Testing BlenderSceneSetup module...")
    print("  ⊘ Requires Blender, skipping (will test in Blender context)")
    print()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🧪 GENERATE-THUMBNAILS MODULE TESTS")
    print("=" * 60)
    
    test_config()
    test_stl_importer()
    test_blender_scene_setup()
    
    print("=" * 60)
    print("✅ All available tests passed!")
    print("=" * 60)
    print("\nNote: Some tests require running inside Blender.")
    print("Full integration testing should be done with:")
    print("  blender --background --python generate-thumbnails.py \\")
    print("    --config stackables-config.yaml --test-limit 2")
