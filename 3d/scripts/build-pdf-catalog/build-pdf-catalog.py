#!/usr/bin/env python3
"""
PDF Catalog Generator - Generate beautiful PDF catalogs from thumbnail images.

This script generates multi-page PDF catalogs from thumbnail images organized
by variant folders. Perfect for product catalogs, portfolio books, and more.

Usage:
  # With config file:
  python build-pdf-catalog.py --config config.yaml
  
  # With CLI overrides:
  python build-pdf-catalog.py \\
    --config config.yaml \\
    --input /path/to/thumbnails \\
    --output catalog.pdf \\
    --grid 6x3
"""

import sys
import os
from pathlib import Path

# Import our modules
from config import Config
from cli import create_parser, print_config_summary
from thumbnail_scanner import ThumbnailScanner
from pdf_builder import PDFBuilder


def main_cli() -> None:
    """Run from command line."""
    parser = create_parser()
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("📚 PDF CATALOG GENERATOR")
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
        config.set("paths.output_pdf", args.output)
    
    if args.grid != "6x3":
        try:
            cols, rows = args.grid.split("x")
            config.set("grid.images_per_row", int(cols))
            config.set("grid.rows_per_page", int(rows))
        except (ValueError, AttributeError):
            print(f"❌ Invalid grid format: {args.grid} (use COLSxROWS like 6x3)")
            sys.exit(1)
    
    if args.test_limit > 0:
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
    
    # Scan for images
    print("🔍 Scanning for thumbnails...")
    input_dir = config.get("paths.input_dir")
    variant_pattern = config.get("batch.variant_pattern", "*")
    test_limit = config.get("batch.test_mode", 0)
    
    try:
        variants = ThumbnailScanner.find_images(input_dir, variant_pattern, test_limit)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)
    
    if not variants:
        print("❌ No thumbnail variants found!")
        sys.exit(1)
    
    total_images = sum(len(imgs) for imgs in variants.values())
    print(f"Found {len(variants)} variants, {total_images} images total\n")
    
    # Generate PDF
    print("📖 Generating PDF catalog...")
    output_pdf = config.get("paths.output_pdf")
    
    try:
        builder = PDFBuilder(config.data)
        pages = builder.generate_catalog(variants, output_pdf)
        
        print("\n" + "=" * 60)
        print("✅ Catalog generation complete!")
        print(f"  PDF:        {output_pdf}")
        print(f"  Pages:      {pages}")
        print(f"  Variants:   {len(variants)}")
        print(f"  Images:     {total_images}")
        print("=" * 60 + "\n")
    
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main_cli()
