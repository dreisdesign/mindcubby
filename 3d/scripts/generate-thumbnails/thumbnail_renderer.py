"""
Core thumbnail rendering module.
"""

import os
import bpy
from pathlib import Path
from typing import Tuple


class ThumbnailRenderer:
    """Render 3D models to image thumbnails."""
    
    def __init__(self, config: dict):
        self.config = config
        self.render_cfg = config.get("render", {})
        self.output_cfg = config.get("output", {})
    
    def render_to_file(self, output_path: str, force_rerender: bool = False) -> bool:
        """Render current scene to image file.
        
        Args:
            output_path: Full path where image will be saved
            force_rerender: If False, skip if file already exists
        
        Returns:
            True if rendered successfully
        """
        output_file = Path(output_path)
        
        # Check if already rendered
        if output_file.exists() and not force_rerender:
            print(f"  ⊘ Skipping (already exists): {output_file.name}")
            return True
        
        try:
            # Set output file
            bpy.context.scene.render.filepath = str(output_path)
            
            # Render
            bpy.ops.render.render(write_still=True)
            
            return True
        except Exception as e:
            print(f"  ✗ Render failed: {e}")
            return False
    
    def batch_render(self, stl_variants: dict, output_base: str, 
                    variant_filter: str = "*", test_limit: int = 0) -> dict:
        """Batch render multiple STL files.
        
        Args:
            stl_variants: Dict of {variant_name: [stl_paths]}
            output_base: Base output directory
            variant_filter: Only process variants matching glob
            test_limit: Limit per variant (0 = all)
        
        Returns:
            Stats dict with counts
        """
        os.makedirs(output_base, exist_ok=True)
        
        stats = {
            "total_variants": 0,
            "total_rendered": 0,
            "total_skipped": 0,
            "total_failed": 0,
        }
        
        for variant_name, stl_files in sorted(stl_variants.items()):
            stats["total_variants"] += 1
            
            # Create variant output dir
            variant_output = os.path.join(output_base, variant_name)
            os.makedirs(variant_output, exist_ok=True)
            
            print(f"\n📁 {variant_name}")
            
            # Process STLs in variant
            for idx, stl_path in enumerate(stl_files):
                if test_limit > 0 and idx >= test_limit:
                    print(f"  (Test mode: stopped at {test_limit})")
                    break
                
                stl_name = Path(stl_path).stem
                output_file = os.path.join(variant_output, f"{stl_name}.png")
                
                print(f"  ⧖ {stl_name}...", end="", flush=True)
                
                # TODO: Import STL, render, cleanup
                # This requires integration with STLImporter
                # For now, show structure
                print(" (render logic to be integrated)")
                
                stats["total_rendered"] += 1
        
        return stats
