"""
STL file handling and import module.
"""

import os
from pathlib import Path
from typing import List, Tuple

# Only import bpy when actually needed (not during imports)
try:
    import bpy
    HAS_BPY = True
except ImportError:
    HAS_BPY = False


class STLImporter:
    """Handle STL file discovery and import."""
    
    @staticmethod
    def find_stl_files(directory: str, variant_pattern: str = "*") -> dict:
        """Discover STL files organized by variant folders.
        
        Args:
            directory: Root directory containing variant folders
            variant_pattern: Glob pattern for variant folder names
        
        Returns:
            Dict mapping variant names to lists of STL file paths
            Example: {
                "01_Variant_A": ["/path/file1.stl", "/path/file2.stl"],
                "02_Variant_B": ["/path/file3.stl"],
            }
        """
        variants = {}
        base_path = Path(directory)
        
        if not base_path.exists():
            raise FileNotFoundError(f"Directory not found: {directory}")
        
        for variant_dir in sorted(base_path.glob(variant_pattern)):
            if not variant_dir.is_dir() or variant_dir.name.startswith("."):
                continue
            
            stl_files = sorted(variant_dir.glob("*.stl"))
            if stl_files:
                variants[variant_dir.name] = [str(f) for f in stl_files]
        
        return variants
    
    @staticmethod
    def import_stl(filepath: str) -> Tuple[object, bool]:
        """Import STL file into Blender.
        
        Args:
            filepath: Path to .stl file
        
        Returns:
            Tuple of (imported_object, success)
        """
        if not HAS_BPY:
            raise RuntimeError("bpy not available - must run inside Blender")
        
        try:
            filepath_str = str(filepath)
            
            # Check file exists
            if not Path(filepath_str).exists():
                return None, False
            
            # Import STL
            bpy.ops.import_mesh.stl(filepath=filepath_str)
            
            # Get imported object
            if bpy.context.selected_objects:
                obj = bpy.context.selected_objects[0]
                return obj, True
            
            return None, False
        except Exception as e:
            print(f"Error importing STL: {e}")
            return None, False
    
    @staticmethod
    def center_object(obj: object) -> None:
        """Center object at world origin."""
        try:
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            
            # Set origin to geometry center
            bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
            
            # Move to world origin
            obj.location = (0, 0, 0)
            bpy.ops.object.transform_apply(location=True)
        except Exception as e:
            print(f"Error centering object: {e}")
    
    @staticmethod
    def cleanup_import(obj: object) -> None:
        """Clean up imported object (remove empties, etc)."""
        try:
            # Select and delete any parent empties
            if obj.parent and obj.parent.type == 'EMPTY':
                parent = obj.parent
                obj.parent = None
                bpy.data.objects.remove(parent, do_unlink=True)
        except Exception as e:
            print(f"Error cleaning up object: {e}")
