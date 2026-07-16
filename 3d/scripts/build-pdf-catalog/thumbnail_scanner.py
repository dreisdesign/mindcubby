"""
Thumbnail scanner and metadata parser for PDF catalogs.
Discovers image files and extracts structured metadata from filenames.
"""

import os
from pathlib import Path
from typing import Dict, List, Tuple


class ThumbnailScanner:
    """Find and organize thumbnail images."""
    
    @staticmethod
    def find_images(input_dir: str, variant_pattern: str = "*", test_limit: int = 0) -> Dict[str, List[str]]:
        """
        Find all images organized by variant folder.
        
        Returns dict: {variant_name: [image_paths]}
        """
        input_path = Path(input_dir)
        if not input_path.exists():
            raise FileNotFoundError(f"Input directory not found: {input_dir}")
        
        variants = {}
        
        # Find variant folders matching pattern
        variant_folders = sorted(input_path.glob(variant_pattern))
        
        for variant_folder in variant_folders:
            if not variant_folder.is_dir():
                continue
            
            variant_name = variant_folder.name
            images = []
            
            # Recursively find all image files
            for root, dirs, files in os.walk(variant_folder):
                for file in sorted(files):
                    if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                        full_path = os.path.join(root, file)
                        images.append(full_path)
            
            # Apply test limit
            if test_limit > 0:
                images = images[:test_limit]
            
            if images:
                variants[variant_name] = images
        
        return variants
    
    @staticmethod
    def parse_filename_metadata(filename: str, separator: str = "--") -> Dict[str, str]:
        """
        Parse filename into structured metadata components.
        
        Default format: position--type--size_index--size_label-value--texture.png
        Example: top--tube--01--xs-18.0mm--smooth.png
        
        Returns dict with keys: position, type, size_label, size_value, texture, filename
        """
        # Remove extension
        name = Path(filename).stem
        parts = name.split(separator)
        
        metadata = {
            "filename": filename,
            "position": parts[0].capitalize() if len(parts) > 0 else "?",
            "type": parts[1].capitalize() if len(parts) > 1 else "?",
            "size_label": "",
            "size_value": "",
            "texture": parts[-1].capitalize() if len(parts) > 0 else "?",
        }
        
        # Parse size info: "xs-18.0mm" or "xs_18.0mm" format
        if len(parts) > 3:
            size_part = parts[3]
            
            # Try dash separator
            if "-" in size_part:
                size_split = size_part.split("-", 1)
                metadata["size_label"] = size_split[0].upper()
                metadata["size_value"] = size_split[1] if len(size_split) > 1 else ""
            # Try underscore separator
            elif "_" in size_part:
                size_split = size_part.split("_", 1)
                metadata["size_label"] = size_split[0].upper()
                metadata["size_value"] = size_split[1] if len(size_split) > 1 else ""
        
        return metadata
    
    @staticmethod
    def get_variant_title(variant_name: str) -> str:
        """
        Extract clean friendly title from variant folder name.
        
        Example: "01_Stackable--Ribbed-Flat" → "Stackables | Ribbed, Flat"
        """
        clean = variant_name
        
        # Remove leading numbering (e.g., "01_" or "01-")
        if len(clean) > 2 and clean[:2].isdigit():
            # Find where the number ends
            for i, char in enumerate(clean):
                if not char.isdigit() and char not in ("_", "-"):
                    clean = clean[i:].lstrip("_-")
                    break
        
        # Remove common prefixes
        clean = clean.replace("Stackable--", "")
        clean = clean.replace("stackable--", "")
        
        # Format with common separators
        if "--" in clean:
            parts = clean.split("--")
            return " | ".join(p.replace("-", ", ").title() for p in parts)
        elif "-" in clean:
            return clean.replace("-", ", ").title()
        else:
            return clean.title()
