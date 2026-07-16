#!/usr/bin/env python3
"""
Generate a PDF catalog from thumbnail images.
One page per variant folder with thumbnails arranged in a grid.
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
BASE_ROOT = "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables"
THUMBNAILS_DIR = os.path.join(BASE_ROOT, "BLENDER_THUMBNAIL-GENERATOR")
OUTPUT_DIR = os.path.join(THUMBNAILS_DIR, "OUTPUT")
OUTPUT_PDF = os.path.join(OUTPUT_DIR, "STACKABLES_CATALOG.pdf")
# Distribution path for zipping
DIST_DIR = os.path.join(BASE_ROOT, "ETSY_EXPORTS-AND-PACKAGING", "01-RAW-STLS", "Documents")
DIST_PDF = os.path.join(DIST_DIR, "STACKABLES_CATALOG.pdf")

# Grid layout
IMAGES_PER_ROW = 6
ROWS_PER_PAGE = 3
MAX_IMAGES_PER_PAGE = IMAGES_PER_ROW * ROWS_PER_PAGE
IMAGE_WIDTH = 1.3 * inch
IMAGE_HEIGHT = 1.3 * inch
HORIZONTAL_SPACING = 0.35 * inch
VERTICAL_SPACING = 2.3 * inch  # Increased for larger fonts and spacing
MARGIN_LR = 0.6 * inch  # Left/Right margin
TITLE_AREA = 1.4 * inch  # Adjusted to keep grid centered with new spacing
FOOTER_AREA = 0.5 * inch # Space at bottom

# Test mode: set to 0 for all, or a number to limit per folder
TEST_MODE = 0  # 0 = all images, or set to a number to limit per folder

# Variants to process (order matters for page layout)
VARIANTS = [
    "01_Stackable--Ribbed-Flat",
    "02_Stackable--Ribbed-Tube",
    "03_Stackable--Smooth-Flat",
    "04_Stackable--Smooth-Tube",
]


def get_variant_title(folder_name):
    """Extract clean friendly title from folder name."""
    # Input: 01_Stackable--Ribbed-Flat
    # Remove leading numbering and "Stackable--"
    clean = folder_name
    if "_" in clean and clean[:2].isdigit():
        clean = clean.split("_", 1)[1]
    
    clean = clean.replace("Stackable--", "")
    
    # Split texture and type
    parts = clean.split("--")
    texture_type = parts[0]
    
    # Format as "Stackables | Ribbed, Flat"
    subparts = texture_type.split("-")
    texture = subparts[0].capitalize()
    variant_type = subparts[1].capitalize() if len(subparts) > 1 else ""
    
    return f"Stackables | {texture}, {variant_type}"


def parse_filename_metadata(filename):
    """Parse filename into structured metadata components.
    
    Format: position--type--size_index--size_label-value--texture.png
    Example: top--tube--01--xs-18.0mm--smooth.png
    
    Returns: dict with keys: position, type, size_label, size_value, texture
    """
    # Remove .png extension
    name = filename.replace(".png", "").replace(".jpg", "")
    parts = name.split("--")
    
    metadata = {
        "position": parts[0].capitalize() if len(parts) > 0 else "?",
        "type": parts[1].capitalize() if len(parts) > 1 else "?",
        "size_label": "",
        "size_value": "",
        "texture": parts[-1].capitalize() if len(parts) > 0 else "?"
    }
    
    # Parse size info: "xs-18.0mm" format
    if len(parts) > 3:
        size_part = parts[3]  # e.g., "xs-18.0mm"
        if "-" in size_part:
            size_split = size_part.split("-", 1)
            metadata["size_label"] = size_split[0].upper()  # xs, sm, md, etc
            metadata["size_value"] = size_split[1] if len(size_split) > 1 else ""  # 18.0mm
    
    return metadata


def collect_images(variant_folder):
    """Collect all PNG images from variant folder, recursively."""
    images = []
    variant_path = os.path.join(THUMBNAILS_DIR, variant_folder)
    
    if not os.path.exists(variant_path):
        print(f"WARNING: Folder not found: {variant_path}")
        return images
    
    # Walk through all subdirs (Top, Bottom, Middle)
    for root, dirs, files in os.walk(variant_path):
        for file in sorted(files):
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                full_path = os.path.join(root, file)
                images.append(full_path)
    
    # Apply test mode limit
    if TEST_MODE > 0:
        images = images[:TEST_MODE]
    
    return images


def create_pdf_catalog():
    """Create multi-page PDF catalog."""
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Creating PDF catalog: {OUTPUT_PDF}")
    print(f"Test mode: {'ON - ' + str(TEST_MODE) + ' images per folder' if TEST_MODE > 0 else 'OFF'}")
    print()
    
    # Create PDF with landscape orientation
    page_width, page_height = landscape(letter)
    
    c = canvas.Canvas(OUTPUT_PDF, pagesize=landscape(letter))
    c.setTitle("Stackables Catalog")
    c.setAuthor("MC3D")
    
    page_num = 0
    
    # Process each variant
    for variant_idx, variant in enumerate(VARIANTS):
        images = collect_images(variant)
        
        if not images:
            print(f"⚠ No images found for {variant}")
            continue
        
        print(f"Processing {variant}...")
        print(f"  Found {len(images)} images")
        
        # Start new page for this variant
        c.setPageSize(landscape(letter))
        page_num += 1
        
        # Calculate centering
        total_grid_w = (IMAGES_PER_ROW * IMAGE_WIDTH) + ((IMAGES_PER_ROW - 1) * HORIZONTAL_SPACING)
        start_x = (page_width - total_grid_w) / 2
        
        # Grid height is roughly distance between top of row 1 and bottom of row 3 labels
        # Let's just center the rows in the space below title
        grid_top_y = page_height - TITLE_AREA
        
        # Draw title with Page Numbering
        title = get_variant_title(variant)
        c.setFont("Helvetica-Bold", 26)
        c.setFillColor(HexColor("#222222"))
        title_y = page_height - 0.75 * inch
        c.drawString(start_x, title_y, f"{page_num}. {title}")
        
        # Range Display (55 of 72)
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(HexColor("#888888"))
        start_range = (variant_idx * 18) + 1
        range_text = f"{start_range} of 72"
        c.drawRightString(page_width - start_x, title_y, range_text)
        
        # Subtitle
        c.setFont("Helvetica", 11)
        c.setFillColor(HexColor("#666666"))
        c.drawString(start_x, title_y - 0.3 * inch, "STACKABLES MODULAR 3D PRINTABLE CONTAINER SYSTEM")
        
        # Draw images in grid
        img_index = 0
        
        for row in range(ROWS_PER_PAGE):
            for col in range(IMAGES_PER_ROW):
                if img_index >= len(images):
                    break
                
                img_path = images[img_index]
                
                # Calculate position
                x = start_x + col * (IMAGE_WIDTH + HORIZONTAL_SPACING)
                y = grid_top_y - (row * VERTICAL_SPACING) - IMAGE_HEIGHT
                
                # Try to draw image
                try:
                    # Get image filename for label
                    filename = os.path.basename(img_path)
                    
                    # Check if image can be opened
                    with Image.open(img_path) as img:
                        # Draw white background rectangle behind image
                        c.saveState()
                        c.setFillColor(HexColor("#FFFFFF"))
                        c.rect(x, y, IMAGE_WIDTH, IMAGE_HEIGHT, fill=1, stroke=0)
                        c.restoreState()
                        
                        # Draw image with transparency awareness
                        c.drawImage(img_path, x, y, width=IMAGE_WIDTH, height=IMAGE_HEIGHT, mask='auto')
                        
                        # Parse and draw structured metadata
                        metadata = parse_filename_metadata(filename)
                        
                        # Draw metadata on multiple lines below image
                        label_y = y - 0.12 * inch
                        c.setFont("Helvetica-Bold", 9)
                        c.setFillColor(HexColor("#111111"))
                        
                        # Line 1: Position + Type
                        line1 = f"{metadata['position']} - {metadata['type']}"
                        c.drawCentredString(x + IMAGE_WIDTH/2, label_y, line1)
                        
                        # Line 2: Size Label + Size Value
                        label_y -= 0.14 * inch
                        if metadata['size_label']:
                            line2 = f"{metadata['size_label']} {metadata['size_value']}"
                            c.drawCentredString(x + IMAGE_WIDTH/2, label_y, line2)
                        
                        # Line 3: Texture
                        label_y -= 0.14 * inch
                        c.setFillColor(HexColor("#555555"))
                        c.setFont("Helvetica", 8)
                        c.drawCentredString(x + IMAGE_WIDTH/2, label_y, metadata['texture'])
                        
                        # Line 4: Filename (very small)
                        label_y -= 0.12 * inch
                        c.setFont("Helvetica", 5.5)
                        c.setFillColor(HexColor("#AAAAAA"))
                        c.drawCentredString(x + IMAGE_WIDTH/2, label_y, filename)

                    
                    img_index += 1
                    
                except Exception as e:
                    print(f"  ERROR loading {img_path}: {e}")
                    img_index += 1
                    continue
            
            if img_index >= len(images):
                break
        
        # Add page number and footer
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#999999"))
        footer_y = 0.3 * inch
        
        # Left branding
        c.drawString(MARGIN_LR, footer_y, "Stackables Modular System by MindCubby")
        
        # Centered URL
        c.setFont("Helvetica", 8)
        c.drawCentredString(page_width/2, footer_y, "mindcubby.etsy.com")
        
        # Clean folder name for footer right
        footer_right = variant.split("--", 1)[1] if "--" in variant else variant
        c.drawRightString(page_width - MARGIN_LR, footer_y, f"{footer_right} - Page {page_num} of {len(VARIANTS)}")
        
        # Move to next page
        c.showPage()
        print(f"  ✓ Page {page_num} complete\n")
    
    # Save PDF
    c.save()
    print(f"✓ PDF saved: {OUTPUT_PDF}")
    
    # Copy to distribution folder
    try:
        os.makedirs(DIST_DIR, exist_ok=True)
        import shutil
        shutil.copy2(OUTPUT_PDF, DIST_PDF)
        print(f"✓ Distribution copy created: {DIST_PDF}")
    except Exception as e:
        print(f"⚠ Could not create distribution copy: {e}")

    print(f"✓ Total pages: {page_num}")
    return OUTPUT_PDF


if __name__ == "__main__":
    try:
        create_pdf_catalog()
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
