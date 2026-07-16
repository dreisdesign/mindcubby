"""
PDF Catalog Generator - Build beautiful PDF catalogs from thumbnail images.

Modular, configurable, and reusable for any project.

Usage:
  # With config file:
  python build-pdf-catalog.py --config config.yaml
  
  # With CLI overrides:
  python build-pdf-catalog.py \\
    --config config.yaml \\
    --input thumbnails/ \\
    --output catalog.pdf \\
    --grid 6x3
"""

__version__ = "1.0.0"
__author__ = "MindCubby"
