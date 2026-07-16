"""
Configuration management for PDF Catalog Generator.
Supports YAML files, environment variables (PDF_* prefix), and CLI overrides.
"""

import os
import yaml
from pathlib import Path


class Config:
    """Hierarchical configuration with dot-notation access."""
    
    def __init__(self):
        """Initialize with default configuration."""
        self.data = {
            "paths": {
                "input_dir": "./thumbnails",
                "output_pdf": "./catalog.pdf",
                "branding_text": "",  # Optional branding for footer
            },
            "grid": {
                "images_per_row": 6,
                "rows_per_page": 3,
            },
            "image": {
                "width_inches": 1.3,
                "height_inches": 1.3,
                "horizontal_spacing_inches": 0.35,
                "vertical_spacing_inches": 2.3,
            },
            "layout": {
                "margin_lr_inches": 0.6,
                "title_area_inches": 1.4,
                "footer_area_inches": 0.5,
                "page_orientation": "landscape",  # portrait or landscape
            },
            "text": {
                "title_font": "Helvetica-Bold",
                "title_size": 26,
                "subtitle_font": "Helvetica",
                "subtitle_size": 11,
                "label_font": "Helvetica-Bold",
                "label_size": 9,
                "footer_font": "Helvetica",
                "footer_size": 8,
            },
            "colors": {
                "title": "#222222",
                "subtitle": "#666666",
                "label_primary": "#111111",
                "label_secondary": "#555555",
                "label_filename": "#AAAAAA",
                "footer": "#999999",
                "image_background": "#FFFFFF",
            },
            "metadata": {
                "pattern": "auto",  # auto-detect from filename
                "separator": "--",
                "components": ["position", "type", "size_label", "size_value", "texture"],
            },
            "batch": {
                "variant_pattern": "*",  # glob pattern for variant folders
                "test_mode": 0,  # 0 = all, or limit per folder
            },
        }
    
    def load_yaml(self, yaml_path: str) -> None:
        """Load configuration from YAML file."""
        path = Path(yaml_path)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {yaml_path}")
        
        with open(path, 'r') as f:
            yaml_data = yaml.safe_load(f)
        
        if yaml_data:
            self._deep_update(self.data, yaml_data)
    
    def load_env(self, prefix: str = "PDF_") -> None:
        """Load configuration from environment variables (prefix_path_separated_by_underscore)."""
        for env_key, env_value in os.environ.items():
            if not env_key.startswith(prefix):
                continue
            
            # Remove prefix and convert to dot notation
            key_path = env_key[len(prefix):].lower()
            parts = key_path.split("_")
            
            # Try to parse as number or boolean
            value = self._parse_value(env_value)
            
            self.set(key_path.replace("_", "."), value)
    
    def set(self, key_path: str, value) -> None:
        """Set value using dot notation (e.g., 'grid.images_per_row')."""
        parts = key_path.split(".")
        current = self.data
        
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        
        current[parts[-1]] = value
    
    def get(self, key_path: str, default=None):
        """Get value using dot notation."""
        parts = key_path.split(".")
        current = self.data
        
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return default
        
        return current
    
    def validate(self) -> tuple:
        """Validate configuration. Returns (is_valid, error_message)."""
        errors = []
        
        # Check required paths
        input_dir = self.get("paths.input_dir")
        if not input_dir:
            errors.append("paths.input_dir is required")
        
        output_pdf = self.get("paths.output_pdf")
        if not output_pdf:
            errors.append("paths.output_pdf is required")
        
        # Check grid dimensions
        images_per_row = self.get("grid.images_per_row", 0)
        rows_per_page = self.get("grid.rows_per_page", 0)
        
        if images_per_row <= 0:
            errors.append("grid.images_per_row must be > 0")
        if rows_per_page <= 0:
            errors.append("grid.rows_per_page must be > 0")
        
        # Check image dimensions
        width = self.get("image.width_inches", 0)
        height = self.get("image.height_inches", 0)
        
        if width <= 0:
            errors.append("image.width_inches must be > 0")
        if height <= 0:
            errors.append("image.height_inches must be > 0")
        
        return (len(errors) == 0, "; ".join(errors) if errors else "")
    
    @staticmethod
    def _deep_update(target_dict: dict, update_dict: dict) -> None:
        """Recursively update target_dict with update_dict."""
        for key, value in update_dict.items():
            if isinstance(value, dict) and key in target_dict and isinstance(target_dict[key], dict):
                Config._deep_update(target_dict[key], value)
            else:
                target_dict[key] = value
    
    @staticmethod
    def _parse_value(value: str):
        """Parse string value into appropriate type."""
        if value.lower() in ("true", "yes", "1"):
            return True
        if value.lower() in ("false", "no", "0"):
            return False
        if value.isdigit():
            return int(value)
        try:
            return float(value)
        except ValueError:
            return value
