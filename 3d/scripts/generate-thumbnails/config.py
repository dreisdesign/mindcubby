"""
Configuration system for thumbnail generator.
Load from YAML or environment variables.
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Tuple

DEFAULT_CONFIG = {
    "paths": {
        "input_dir": None,  # Required
        "output_dir": None,  # Required
    },
    "render": {
        "resolution_x": 512,
        "resolution_y": 512,
        "samples": 16,
        "engine": "EEVEE",  # EEVEE or CYCLES
        "force_rerender": False,
    },
    "scene": {
        "camera_location": (110, -110, 90),
        "camera_rotation": (75, 0, 45),  # in degrees
        "light_location": (100, -100, 200),
        "light_energy": 5.0,
        "light_rotation": (45, 0, 30),  # in degrees
        "background_color": (1, 1, 1, 1),  # RGBA
    },
    "output": {
        "format": "PNG",
        "include_alpha": True,
    },
    "batch": {
        "skip_existing": False,
        "variant_pattern": "*",  # glob pattern for variants to process
        "test_mode": 0,  # 0 = all, or number to limit per folder
    },
}


class Config:
    def __init__(self):
        self.data = DEFAULT_CONFIG.copy()
    
    def load_yaml(self, yaml_path: str) -> None:
        """Load configuration from YAML file."""
        path = Path(yaml_path)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {yaml_path}")
        
        with open(path, 'r') as f:
            user_config = yaml.safe_load(f) or {}
        
        # Merge user config with defaults (deep merge for nested dicts)
        self._merge_dicts(self.data, user_config)
    
    def load_env(self, prefix: str = "TG_") -> None:
        """Load configuration from environment variables.
        
        Examples:
            TG_PATHS_INPUT_DIR=/path/to/input
            TG_RENDER_RESOLUTION_X=1024
            TG_SCENE_CAMERA_LOCATION="110,110,90"
        """
        for key, value in os.environ.items():
            if not key.startswith(prefix):
                continue
            
            # Parse key: TG_PATHS_INPUT_DIR -> ["paths", "input_dir"]
            parts = key[len(prefix):].lower().split("_")
            
            # Navigate/create nested dict
            current = self.data
            for part in parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]
            
            # Set value (try to parse as int/float/bool/list)
            current[parts[-1]] = self._parse_value(value)
    
    def set(self, key_path: str, value: Any) -> None:
        """Set value using dot notation.
        
        Examples:
            config.set("paths.input_dir", "/path/to/input")
            config.set("render.resolution_x", 1024)
        """
        parts = key_path.split(".")
        current = self.data
        
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        
        current[parts[-1]] = value
    
    def get(self, key_path: str, default=None) -> Any:
        """Get value using dot notation."""
        parts = key_path.split(".")
        current = self.data
        
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return default
        
        return current
    
    def validate(self) -> Tuple[bool, str]:
        """Validate required fields."""
        input_dir = self.get("paths.input_dir")
        output_dir = self.get("paths.output_dir")
        
        if not input_dir:
            return False, "paths.input_dir is required"
        if not output_dir:
            return False, "paths.output_dir is required"
        
        if not Path(input_dir).exists():
            return False, f"Input directory does not exist: {input_dir}"
        
        return True, ""
    
    @staticmethod
    def _merge_dicts(base: Dict, updates: Dict) -> None:
        """Recursively merge updates into base dict."""
        for key, value in updates.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                Config._merge_dicts(base[key], value)
            else:
                base[key] = value
    
    @staticmethod
    def _parse_value(value: str) -> Any:
        """Parse environment variable value to appropriate type."""
        if value.lower() in ("true", "yes", "1"):
            return True
        if value.lower() in ("false", "no", "0"):
            return False
        if "," in value:
            return tuple(float(v.strip()) if "." in v else int(v.strip()) for v in value.split(","))
        try:
            return int(value)
        except ValueError:
            try:
                return float(value)
            except ValueError:
                return value
