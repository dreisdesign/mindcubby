"""
Command-line interface for PDF Catalog Generator.
"""

import argparse


def create_parser():
    """Create and return argument parser."""
    parser = argparse.ArgumentParser(
        prog="build-pdf-catalog",
        description="Generate beautiful PDF catalogs from thumbnail images",
        epilog="""Examples:
  # Use config file
  python build-pdf-catalog.py --config config.yaml
  
  # Override config values
  python build-pdf-catalog.py \\
    --config config.yaml \\
    --input /path/to/thumbnails \\
    --output catalog.pdf
  
  # Test mode (limit images per variant)
  python build-pdf-catalog.py --config config.yaml --test-limit 2
  
  # Validate configuration
  python build-pdf-catalog.py --config config.yaml --validate-only
        """
    )
    
    parser.add_argument(
        "--config",
        type=str,
        help="Path to YAML configuration file"
    )
    
    parser.add_argument(
        "--input",
        type=str,
        help="Input directory containing thumbnail folders (override config)"
    )
    
    parser.add_argument(
        "--output",
        type=str,
        help="Output PDF file path (override config)"
    )
    
    parser.add_argument(
        "--grid",
        type=str,
        default="6x3",
        help="Grid layout as 'COLSxROWS' (default: 6x3, override config)"
    )
    
    parser.add_argument(
        "--test-limit",
        type=int,
        default=0,
        help="Limit images per variant (0=all, override config)"
    )
    
    parser.add_argument(
        "--variant-pattern",
        type=str,
        default="*",
        help="Glob pattern for variant folders (default: *, override config)"
    )
    
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate configuration without generating PDF"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate configuration and show what would be done"
    )
    
    return parser


def print_config_summary(config: dict) -> None:
    """Print configuration summary."""
    print("\n" + "=" * 60)
    print("Configuration Summary")
    print("=" * 60)
    print(f"Input:         {config['paths']['input_dir']}")
    print(f"Output:        {config['paths']['output_pdf']}")
    print(f"Grid:          {config['grid']['images_per_row']}x{config['grid']['rows_per_page']}")
    print(f"Image size:    {config['image']['width_inches']}\" x {config['image']['height_inches']}\"")
    print(f"Orientation:   {config['layout']['page_orientation']}")
    if config['batch']['test_mode'] > 0:
        print(f"Test mode:     ON ({config['batch']['test_mode']} per variant)")
    print("=" * 60 + "\n")
