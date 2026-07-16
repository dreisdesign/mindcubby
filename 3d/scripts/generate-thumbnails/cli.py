"""
Command-line interface for thumbnail generator.
"""

import argparse
import sys
from pathlib import Path
import yaml


def create_parser() -> argparse.ArgumentParser:
    """Create and configure argument parser."""
    parser = argparse.ArgumentParser(
        description="Generate thumbnail images from 3D STL models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use config file
  python generate_thumbnails.py --config config.yaml
  
  # Override config values
  python generate_thumbnails.py \\
    --config config.yaml \\
    --input /path/to/stls \\
    --output /path/to/output
  
  # Test mode (limit renders per variant)
  python generate_thumbnails.py --config config.yaml --test-limit 2
        """
    )
    
    parser.add_argument(
        "--config", "-c",
        type=str,
        help="Path to YAML configuration file"
    )
    
    parser.add_argument(
        "--input", "-i",
        type=str,
        help="Input directory (STLs organized by variant folder)"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Output directory for thumbnails"
    )
    
    parser.add_argument(
        "--force-rerender",
        action="store_true",
        help="Re-render existing thumbnails"
    )
    
    parser.add_argument(
        "--test-limit",
        type=int,
        default=0,
        help="Limit renders per variant (0 = all)"
    )
    
    parser.add_argument(
        "--variant-pattern",
        type=str,
        default="*",
        help="Glob pattern for variant folder names (default: *)"
    )
    
    parser.add_argument(
        "--resolution",
        type=int,
        nargs=2,
        metavar=("WIDTH", "HEIGHT"),
        help="Override render resolution"
    )
    
    parser.add_argument(
        "--engine",
        choices=["EEVEE", "CYCLES"],
        help="Override render engine"
    )
    
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate configuration and exit"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be rendered without actually rendering"
    )
    
    return parser


def print_config_summary(config: dict) -> None:
    """Print configuration summary."""
    print("\n📋 Configuration:")
    print(f"  Input:     {config.get('paths', {}).get('input_dir', 'NOT SET')}")
    print(f"  Output:    {config.get('paths', {}).get('output_dir', 'NOT SET')}")
    
    render = config.get('render', {})
    print(f"  Resolution: {render.get('resolution_x')}x{render.get('resolution_y')}")
    print(f"  Engine:    {render.get('engine')}")
    print(f"  Samples:   {render.get('samples')}")
    print()
