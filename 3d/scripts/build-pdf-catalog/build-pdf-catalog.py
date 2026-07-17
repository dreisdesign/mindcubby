#!/usr/bin/env python3
"""
Generate multi-page PDF catalog from thumbnail images.

Usage:
  python3 build-pdf-catalog.py

Configuration:
  INPUT_DIR:   Directory containing thumbnails organized by variant/{position}/
  OUTPUT_PDF:  Path to generated PDF file
  GRID_COLS:   Number of columns in grid (default: 6)
  GRID_ROWS:   Number of rows per page (default: 3)

Filename format (required):
  {position}--{type}--{index}--{size_label}-{size_value}--{texture}.png
  Example: top--tube--01--xs-18.0mm--smooth.png
"""

import os
import sys
from pathlib import Path
from PIL import Image
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, "thumbnails")      # Rendered PNGs
OUTPUT_PDF = os.path.join(BASE_DIR, "catalog.pdf")    # Output PDF

# Grid layout
GRID_COLS = 6
GRID_ROWS = 3
IMAGES_PER_PAGE = GRID_COLS * GRID_ROWS

# Dimensions (all in inches)
IMAGE_WIDTH = 1.3
IMAGE_HEIGHT = 1.3
H_SPACING = 0.35      # Horizontal spacing between images
V_SPACING = 2.3       # Vertical spacing (includes label space)
MARGIN_LR = 0.6       # Left/right margin
TITLE_AREA = 1.4      # Space for title at top
FOOTER_AREA = 0.5     # Space for footer at bottom

# Test mode: 0 = all images, >0 = limit images per variant
TEST_MODE = 0

# Variants (in order they appear in catalog)
VARIANTS = [
    "01_Stackable--Ribbed-Flat",
    "02_Stackable--Ribbed-Tube",
    "03_Stackable--Smooth-Flat",
    "04_Stackable--Smooth-Tube",
]


def get_variant_title(folder_name: str) -> str:
    """Extract friendly title from variant folder name.
    
    Example: "01_Stackable--Ribbed-Flat" → "Stackables | Ribbed, Flat"
    """
    clean = folder_name
    
    # Remove leading number
    if "_" in clean and clean[:2].isdigit():
        clean = clean.split("_", 1)[1]
    
    # Remove "Stackable--"
    clean = clean.replace("Stackable--", "")
    
    # Split and format
    parts = clean.split("--")
    texture_type = parts[0]
    subparts = texture_type.split("-")
    
    texture = subparts[0].capitalize()
    variant_type = subparts[1].capitalize() if len(subparts) > 1 else ""
    
    return f"Stackables | {texture}, {variant_type}"


def parse_filename_metadata(filename: str) -> dict:
    """Parse structured metadata from filename.
    
    Format: position--type--size_index--size_label-value--texture.png
    Example: top--tube--01--xs-18.0mm--smooth.png
    """
    name = filename.replace(".png", "").replace(".jpg", "")
    parts = name.split("--")
    
    metadata = {
        "position": parts[0].capitalize() if len(parts) > 0 else "?",
        "type": parts[1].capitalize() if len(parts) > 1 else "?",
        "size_label": "",
        "size_value": "",
        "texture": parts[-1].capitalize() if len(parts) > 0 else "?",
        "filename": filename,
    }
    
    # Parse size: "xs-18.0mm"
    if len(parts) > 3:
        size_part = parts[3]
        if "-" in size_part:
            size_split = size_part.split("-", 1)
            metadata["size_label"] = size_split[0].upper()
            metadata["size_value"] = size_split[1] if len(size_split) > 1 else ""
    
    return metadata


def collect_images(variant_folder: str) -> list:
    """Collect all images from variant folder (recursive)."""
    images = []
    variant_path = os.path.join(INPUT_DIR, variant_folder)
    
    if not os.path.exists(variant_path):
        print(f"  ⚠ Folder not found: {variant_path}")
        return images
    
    # Walk through all subdirs (Top, Middle, Bottom, etc.)
    for root, dirs, files in os.walk(variant_path):
        for file in sorted(files):
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                full_path = os.path.join(root, file)
                images.append(full_path)
    
    # Apply test limit
    if TEST_MODE > 0:
        images = images[:TEST_MODE]
    
    return images


def create_catalog():
    """Generate multi-page PDF catalog."""
    if not os.path.exists(INPUT_DIR):
        print(f"ERROR: Input directory not found: {INPUT_DIR}")
        sys.exit(1)
    
    os.makedirs(os.path.dirname(OUTPUT_PDF) or ".", exist_ok=True)
    
    print("\n" + "="*60)
    print("📚 PDF CATALOG GENERATOR")
    print("="*60)
    print(f"Input:  {INPUT_DIR}")
    print(f"Output: {OUTPUT_PDF}")
    print(f"Grid:   {GRID_COLS} cols × {GRID_ROWS} rows")
    print(f"Test:   {'ON (limit: ' + str(TEST_MODE) + ')' if TEST_MODE > 0 else 'OFF'}")
    print()

    # Create PDF in landscape
    page_width, page_height = landscape(letter)
    c = canvas.Canvas(OUTPUT_PDF, pagesize=landscape(letter))
    c.setTitle("PDF Catalog")
    c.setAuthor("MindCubby")

    page_num = 0
    total_variants = len(VARIANTS)

    # Process each variant
    for variant_idx, variant in enumerate(VARIANTS):
        images = collect_images(variant)
        
        if not images:
            print(f"⚠ No images found for {variant}")
            continue

        print(f"Processing {variant}...")
        print(f"  Found {len(images)} images")

        # Start new page
        c.setPageSize(landscape(letter))
        page_num += 1

        # Calculate centering
        total_grid_width = (GRID_COLS * IMAGE_WIDTH * inch) + ((GRID_COLS - 1) * H_SPACING * inch)
        start_x = (page_width - total_grid_width) / 2
        grid_top_y = page_height - (TITLE_AREA * inch)

        # Draw title
        title = get_variant_title(variant)
        c.setFont("Helvetica-Bold", 26)
        c.setFillColor(HexColor("#222222"))
        title_y = page_height - (0.75 * inch)
        c.drawString(start_x, title_y, f"{page_num}. {title}")

        # Draw page range
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(HexColor("#888888"))
        start_range = (variant_idx * 18) + 1
        range_text = f"{start_range} of 72"
        c.drawRightString(page_width - start_x, title_y, range_text)

        # Draw subtitle
        c.setFont("Helvetica", 11)
        c.setFillColor(HexColor("#666666"))
        c.drawString(start_x, title_y - (0.3 * inch), "STACKABLES MODULAR 3D PRINTABLE CONTAINER SYSTEM")

        # Draw images in grid
        img_index = 0

        for row in range(GRID_ROWS):
            for col in range(GRID_COLS):
                if img_index >= len(images):
                    break

                img_path = images[img_index]
                
                # Calculate position
                x = start_x + col * (IMAGE_WIDTH * inch + H_SPACING * inch)
                y = grid_top_y - (row * (V_SPACING * inch)) - (IMAGE_HEIGHT * inch)

                # Draw image
                try:
                    with Image.open(img_path) as img:
                        # White background
                        c.saveState()
                        c.setFillColor(HexColor("#FFFFFF"))
                        c.rect(x, y, IMAGE_WIDTH * inch, IMAGE_HEIGHT * inch, fill=1, stroke=0)
                        c.restoreState()
                        
                        # Image
                        c.drawImage(img_path, x, y, width=IMAGE_WIDTH * inch, height=IMAGE_HEIGHT * inch, mask='auto')
                        
                        # Metadata labels
                        metadata = parse_filename_metadata(os.path.basename(img_path))
                        
                        label_y = y - (0.12 * inch)
                        c.setFont("Helvetica-Bold", 9)
                        c.setFillColor(HexColor("#111111"))
                        
                        # Line 1: Position + Type
                        c.drawCentredString(x + (IMAGE_WIDTH * inch / 2), label_y, 
                                           f"{metadata['position']} - {metadata['type']}")
                        
                        # Line 2: Size
                        label_y -= (0.14 * inch)
                        if metadata['size_label']:
                            c.drawCentredString(x + (IMAGE_WIDTH * inch / 2), label_y,
                                               f"{metadata['size_label']} {metadata['size_value']}")
                        
                        # Line 3: Texture
                        label_y -= (0.14 * inch)
                        c.setFillColor(HexColor("#555555"))
                        c.setFont("Helvetica", 8)
                        c.drawCentredString(x + (IMAGE_WIDTH * inch / 2), label_y, metadata['texture'])
                        
                        # Line 4: Filename (tiny)
                        label_y -= (0.12 * inch)
                        c.setFont("Helvetica", 5.5)
                        c.setFillColor(HexColor("#AAAAAA"))
                        c.drawCentredString(x + (IMAGE_WIDTH * inch / 2), label_y, metadata['filename'])

                    img_index += 1
                except Exception as e:
                    print(f"  ERROR loading {img_path}: {e}")
                    img_index += 1

            if img_index >= len(images):
                break

        # Draw footer
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#999999"))
        footer_y = (0.3 * inch)
        
        c.drawString(MARGIN_LR * inch, footer_y, "Stackables Modular System by MindCubby")
        c.setFont("Helvetica", 8)
        c.drawCentredString(page_width / 2, footer_y, "mindcubby.etsy.com")
        
        footer_right = variant.split("--", 1)[1] if "--" in variant else variant
        c.drawRightString(page_width - (MARGIN_LR * inch), footer_y, f"{footer_right} - Page {page_num} of {total_variants}")

        c.showPage()
        print(f"  ✓ Page {page_num} complete\n")

    # Save PDF
    c.save()
    print("="*60)
    print(f"✓ PDF saved: {OUTPUT_PDF}")
    print(f"✓ Total pages: {page_num}")
    print("="*60 + "\n")


if __name__ == "__main__":
    create_catalog()
