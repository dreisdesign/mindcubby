"""
STACKABLES THUMBNAIL GENERATOR + PDF CATALOG
Reads STLs from Output folder
Renders color-coded thumbnails
Generates multi-page PDF catalog from thumbnails
Auto-detects latest Output folder - no config needed.
"""

import bpy
import os
import sys
import math
import subprocess
from pathlib import Path

# Auto-install missing packages
def ensure_packages():
    """Install required packages if missing"""
    packages = [
        ('PIL', 'Pillow'),
        ('reportlab', 'reportlab'),
    ]
    
    for module_name, package_name in packages:
        try:
            __import__(module_name)
            print(f"✓ {package_name} already installed")
        except ImportError:
            print(f"Installing {package_name}...")
            try:
                subprocess.run(
                    [sys.executable, '-m', 'pip', 'install', package_name, '--quiet'],
                    check=True
                )
                print(f"✓ {package_name} installed successfully")
            except Exception as e:
                print(f"ERROR: Could not install {package_name}: {e}")
                raise

ensure_packages()

from PIL import Image
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

# --- RENDER SETTINGS ---
RESOLUTION_X = 512
RESOLUTION_Y = 512
RENDER_SAMPLES = 16
USE_CYCLES = False
FORCE_RERENDER = True

# --- COLOR MAPPING ---
COLORS = {
    "SMOOTH_TOP":    (0.0, 0.1, 0.5, 1.0),
    "SMOOTH_MID":    (0.1, 0.4, 0.9, 1.0),
    "SMOOTH_BOTTOM": (0.6, 0.8, 1.0, 1.0),
    
    "RIBBED_TOP":    (0.3, 0.0, 0.4, 1.0),
    "RIBBED_MID":    (0.6, 0.2, 0.8, 1.0),
    "RIBBED_BOTTOM": (0.9, 0.7, 1.0, 1.0),
    
    "TYPE_FLAT":     (1.0, 0.1, 0.1, 1.0),
    "TYPE_TUBE":     (1.0, 0.9, 0.0, 1.0),
}


def get_scripts_root():
    """Get SCRIPTS--STACKABLES root directory from Blender file location"""
    if bpy.data.filepath:
        blend_dir = os.path.dirname(os.path.abspath(bpy.data.filepath))
        # If blend is in Scripts/, go up to root
        if os.path.basename(blend_dir) == "Scripts":
            return os.path.dirname(blend_dir)
        return blend_dir
    return os.getcwd()


def find_latest_output():
    """Find latest Output_YYYYMMDD_HHMMSS folder or use SELECTED_OUTPUT_FOLDER if provided"""
    root = get_scripts_root()
    output_parent = os.path.join(root, "Output")
    
    if not os.path.exists(output_parent):
        raise FileNotFoundError(f"No Output folder found in {root}")
    
    # If SELECTED_OUTPUT_FOLDER is provided, use it
    if SELECTED_OUTPUT_FOLDER:
        selected_path = os.path.join(output_parent, SELECTED_OUTPUT_FOLDER)
        if os.path.isdir(selected_path):
            print(f"✓ Using selected Output folder: {SELECTED_OUTPUT_FOLDER}")
            return selected_path
        else:
            raise FileNotFoundError(f"Selected Output folder not found: {SELECTED_OUTPUT_FOLDER}")
    
    # Otherwise, find latest
    outputs = sorted([
        d for d in os.listdir(output_parent) 
        if d.startswith('Output_') and os.path.isdir(os.path.join(output_parent, d))
    ])
    
    if not outputs:
        raise FileNotFoundError(f"No Output_YYYYMMDD_HHMMSS folder found in {output_parent}")
    
    latest = outputs[-1]
    print(f"✓ Using latest Output folder: {latest}")
    return os.path.join(output_parent, latest)


def setup_scene():
    """Set up rendering environment"""
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # World: white background
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes.get('Background')
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 1.0
    
    # Camera - moved further back to accommodate taller stackables
    bpy.ops.object.camera_add(location=(140, -140, 120))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(75), 0, math.radians(45))
    bpy.context.scene.camera = cam
    
    # Point at origin
    direction = -cam.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam.rotation_euler = rot_quat.to_euler()
    
    # Sun light
    bpy.ops.object.light_add(type='SUN', location=(100, -100, 200))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))
    
    # Render settings
    if USE_CYCLES:
        bpy.context.scene.render.engine = 'CYCLES'
    else:
        bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    
    bpy.context.scene.render.resolution_x = RESOLUTION_X
    bpy.context.scene.render.resolution_y = RESOLUTION_Y
    bpy.context.scene.render.film_transparent = True


def get_material_color(filename):
    """Determine material color from filename"""
    lower = filename.lower()
    
    # Base color from texture
    is_smooth = "smooth" in lower
    base_color = COLORS["SMOOTH_MID"] if is_smooth else COLORS["RIBBED_MID"]
    
    # Highlight from form type
    highlight = COLORS["TYPE_FLAT"] if "flat" in lower else COLORS["TYPE_TUBE"]
    
    # Blend: 80% base, 20% highlight
    final = tuple(
        base_color[i] * 0.8 + highlight[i] * 0.2 
        for i in range(4)
    )
    
    return final


def render_stl(stl_path, output_path):
    """Render a single STL file to PNG"""
    # Import STL
    bpy.ops.wm.stl_import(filepath=stl_path)
    obj = bpy.context.selected_objects[0]
    
    # Center and frame
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    obj.location = (0, 0, 0)
    
    # Create material with color
    filename = os.path.basename(stl_path)
    mat_color = get_material_color(filename)
    
    mat = bpy.data.materials.new(name=f"Mat_{filename}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs['Base Color'].default_value = mat_color
    
    obj.data.materials.append(mat)
    
    # Render
    bpy.context.scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)
    
    # Cleanup
    bpy.ops.object.delete()
    
    size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
    return size > 100


def render_thumbnails():
    """Main: find Output folder, render all STLs"""
    try:
        output_root = find_latest_output()
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        return False
    
    print(f"\n{'='*60}")
    print(f"THUMBNAIL GENERATOR")
    print(f"{'='*60}")
    print(f"Input:  {output_root}")
    
    thumbnails_dir = os.path.join(output_root, "THUMBNAILS")
    os.makedirs(thumbnails_dir, exist_ok=True)
    
    print(f"Output: {thumbnails_dir}\n")
    
    rendered_count = 0
    skipped_count = 0
    
    # Find all variant folders
    variants = sorted([
        d for d in os.listdir(output_root)
        if d.startswith('0') and '_Stackable--' in d 
        and os.path.isdir(os.path.join(output_root, d))
    ])
    
    print(f"Found {len(variants)} variant folders\n")
    
    setup_scene()
    
    for variant in variants:
        variant_path = os.path.join(output_root, variant)
        variant_output = os.path.join(thumbnails_dir, variant)
        os.makedirs(variant_output, exist_ok=True)
        
        print(f"Processing: {variant}")
        
        # Find only assembled Stackable STLs (not parts files)
        stl_files = sorted([
            f for f in os.listdir(variant_path)
            if f.lower().endswith('.stl') and f.startswith('Stackable--')
        ])
        
        if not stl_files:
            print(f"  ⚠ No Stackable files found (skipping parts-only folders)")
        
        for stl_file in stl_files:
            stl_path = os.path.join(variant_path, stl_file)
            png_file = stl_file.replace('.stl', '.png')
            png_path = os.path.join(variant_output, png_file)
            
            # Skip if exists (unless FORCE_RERENDER)
            if not FORCE_RERENDER and os.path.exists(png_path):
                print(f"  ⊘ {png_file} (exists)")
                skipped_count += 1
                continue
            
            # Render
            if render_stl(stl_path, png_path):
                print(f"  ✓ {png_file}")
                rendered_count += 1
            else:
                print(f"  ✗ {png_file} (failed)")
    
    print(f"\n{'='*60}")
    print(f"COMPLETE: {rendered_count} rendered, {skipped_count} skipped")
    print(f"{'='*60}\n")
    
    # Reveal thumbnails folder in Finder
    print(f"Opening thumbnails folder in Finder...")
    try:
        subprocess.run(['open', '-R', thumbnails_dir], check=True)
        print(f"✓ Finder opened to: {thumbnails_dir}\n")
    except Exception as e:
        print(f"Note: Could not open Finder ({e})\n")
    
    return True


# --- PDF CATALOG CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)  # Up to SCRIPTS--STACKABLES/
INPUT_DIR = os.path.join(ROOT_DIR, "Output")
OUTPUT_PDF = None

GRID_COLS = 6
GRID_ROWS = 3
IMAGES_PER_PAGE = GRID_COLS * GRID_ROWS

IMAGE_WIDTH = 1.3
IMAGE_HEIGHT = 1.3
H_SPACING = 0.35
V_SPACING = 2.3
MARGIN_LR = 0.6
TITLE_AREA = 1.4
FOOTER_AREA = 0.5

TEST_MODE = 0

VARIANTS = [
    "01_Stackable--Flat-Ribbed",
    "02_Stackable--Flat-Smooth",
    "03_Stackable--Tube-Ribbed",
    "04_Stackable--Tube-Smooth",
]


def find_latest_output_dir():
    """Find the latest Output folder or use SELECTED_OUTPUT_FOLDER if provided."""
    if not os.path.exists(INPUT_DIR):
        return None
    
    if SELECTED_OUTPUT_FOLDER:
        selected_path = os.path.join(INPUT_DIR, SELECTED_OUTPUT_FOLDER)
        if os.path.isdir(selected_path):
            print(f"✓ Using selected Output folder: {SELECTED_OUTPUT_FOLDER}")
            return selected_path
        else:
            print(f"WARNING: Selected Output folder not found: {SELECTED_OUTPUT_FOLDER}")
            return None
    
    # Find latest by both naming patterns
    outputs = sorted([
        d for d in os.listdir(INPUT_DIR)
        if (d.startswith('Output_') or d.startswith('Stackables_AUTO--')) and os.path.isdir(os.path.join(INPUT_DIR, d))
    ], reverse=True)
    
    if outputs:
        latest = outputs[0]
        print(f"✓ Using latest Output folder: {latest}")
        return os.path.join(INPUT_DIR, latest)
    
    return None


def get_variant_title(folder_name: str) -> str:
    """Extract friendly title from variant folder name."""
    clean = folder_name
    
    if "_" in clean and clean[:2].isdigit():
        clean = clean.split("_", 1)[1]
    
    clean = clean.replace("Stackable--", "")
    
    parts = clean.split("--")
    texture_type = parts[0]
    subparts = texture_type.split("-")
    
    texture = subparts[0].capitalize()
    variant_type = subparts[1].capitalize() if len(subparts) > 1 else ""
    
    return f"Stackables | {texture}, {variant_type}"


def parse_filename_metadata(filename: str) -> dict:
    """Parse structured metadata from STL-derived filename."""
    name = filename.replace(".png", "").replace(".jpg", "")
    parts = name.split("--")
    
    metadata = {
        "position": "Stackable",
        "type": parts[1].capitalize() if len(parts) > 1 else "?",
        "wall": parts[2].capitalize() if len(parts) > 2 else "?",
        "size_label": "",
        "size_value": "",
        "texture": parts[2].capitalize() if len(parts) > 2 else "?",
        "filename": filename,
    }
    
    if len(parts) > 3:
        size_str = parts[3].replace("mm", "")
        if size_str.isdigit():
            metadata["size_value"] = f"{size_str}mm"
            size_int = int(size_str)
            if size_int <= 20: metadata["size_label"] = "XS"
            elif size_int <= 25: metadata["size_label"] = "SM"
            elif size_int <= 35: metadata["size_label"] = "MD"
            elif size_int <= 45: metadata["size_label"] = "LG"
            elif size_int <= 55: metadata["size_label"] = "XL"
            else: metadata["size_label"] = "XXL"
    
    return metadata


def collect_images(variant_folder: str, output_base: str) -> list:
    """Collect all images from variant folder."""
    images = []
    
    thumbnails_base = os.path.join(output_base, "THUMBNAILS")
    variant_path = os.path.join(thumbnails_base, variant_folder)
    
    if not os.path.exists(variant_path):
        return images
    
    for root, dirs, files in os.walk(variant_path):
        for file in sorted(files):
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                full_path = os.path.join(root, file)
                images.append(full_path)
    
    if TEST_MODE > 0:
        images = images[:TEST_MODE]
    
    return images


def create_catalog():
    """Generate multi-page PDF catalog from thumbnails."""
    global OUTPUT_PDF
    
    output_base = find_latest_output_dir()
    
    if not output_base or not os.path.exists(output_base):
        print(f"ERROR: No Output folder found in {INPUT_DIR}")
        return False
    
    OUTPUT_PDF = os.path.join(output_base, "catalog.pdf")
    
    os.makedirs(os.path.dirname(OUTPUT_PDF) or ".", exist_ok=True)
    
    thumbnails_base = os.path.join(output_base, "THUMBNAILS")
    if not os.path.exists(thumbnails_base):
        print(f"ERROR: No THUMBNAILS folder found in {output_base}")
        return False
    
    print(f"\n{'='*60}")
    print(f"📚 PDF CATALOG GENERATOR")
    print(f"{'='*60}")
    print(f"Input:  {output_base}")
    print(f"Source: {thumbnails_base}")
    print(f"Output: {OUTPUT_PDF}")
    print(f"Grid:   {GRID_COLS} cols × {GRID_ROWS} rows")
    print()

    page_width, page_height = landscape(letter)
    c = canvas.Canvas(OUTPUT_PDF, pagesize=landscape(letter))
    c.setTitle("Stackables Catalog")
    c.setAuthor("MindCubby")

    page_num = 0
    
    all_variant_images = []
    total_image_count = 0
    for variant in VARIANTS:
        images = collect_images(variant, output_base)
        all_variant_images.append((variant, images))
        total_image_count += len(images)
    
    print(f"Total images across all variants: {total_image_count}\n")

    image_counter = 1
    for variant_idx, (variant, images) in enumerate(all_variant_images):
        
        if not images:
            print(f"⚠ No images found for {variant}")
            continue

        print(f"Processing {variant}...")
        print(f"  Found {len(images)} images")

        c.setPageSize(landscape(letter))
        page_num += 1

        total_grid_width = (GRID_COLS * IMAGE_WIDTH * inch) + ((GRID_COLS - 1) * H_SPACING * inch)
        start_x = (page_width - total_grid_width) / 2
        grid_top_y = page_height - (TITLE_AREA * inch)

        title = get_variant_title(variant)
        c.setFont("Helvetica-Bold", 26)
        c.setFillColor(HexColor("#222222"))
        title_y = page_height - (0.75 * inch)
        c.drawString(start_x, title_y, f"{page_num}. {title}")

        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(HexColor("#888888"))
        start_range = image_counter
        end_range = image_counter + len(images) - 1
        range_text = f"{start_range}-{end_range} of {total_image_count}"
        c.drawRightString(page_width - start_x, title_y, range_text)

        c.setFont("Helvetica", 11)
        c.setFillColor(HexColor("#666666"))
        c.drawString(start_x, title_y - (0.3 * inch), "STACKABLES MODULAR 3D PRINTABLE CONTAINER SYSTEM")

        img_index = 0

        for row in range(GRID_ROWS):
            for col in range(GRID_COLS):
                if img_index >= len(images):
                    break

                img_path = images[img_index]
                
                x = start_x + col * (IMAGE_WIDTH * inch + H_SPACING * inch)
                y = grid_top_y - (row * (V_SPACING * inch)) - (IMAGE_HEIGHT * inch)

                try:
                    with Image.open(img_path) as img:
                        c.saveState()
                        c.setFillColor(HexColor("#FFFFFF"))
                        c.rect(x, y, IMAGE_WIDTH * inch, IMAGE_HEIGHT * inch, fill=1, stroke=0)
                        c.restoreState()
                        
                        c.drawImage(img_path, x, y, width=IMAGE_WIDTH * inch, height=IMAGE_HEIGHT * inch, mask='auto')
                        
                        metadata = parse_filename_metadata(os.path.basename(img_path))
                        
                        label_y = y - (0.12 * inch)
                        c.setFont("Helvetica-Bold", 9)
                        c.setFillColor(HexColor("#111111"))
                        
                        c.drawCentredString(x + (IMAGE_WIDTH * inch / 2), label_y, 
                                           f"{metadata['position']} - {metadata['type']}")
                        
                        label_y -= (0.14 * inch)
                        if metadata['size_label']:
                            c.drawCentredString(x + (IMAGE_WIDTH * inch / 2), label_y,
                                               f"{metadata['size_label']} {metadata['size_value']}")
                        
                        label_y -= (0.14 * inch)
                        c.setFillColor(HexColor("#555555"))
                        c.setFont("Helvetica", 8)
                        c.drawCentredString(x + (IMAGE_WIDTH * inch / 2), label_y, metadata['texture'])
                        
                        label_y -= (0.12 * inch)
                        c.setFont("Helvetica", 5.5)
                        c.setFillColor(HexColor("#AAAAAA"))
                        c.drawCentredString(x + (IMAGE_WIDTH * inch / 2), label_y, metadata['filename'])

                    img_index += 1
                    image_counter += 1
                except Exception as e:
                    print(f"  ERROR loading {img_path}: {e}")
                    img_index += 1
                    image_counter += 1

            if img_index >= len(images):
                break

        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#999999"))
        footer_y = (0.3 * inch)
        
        c.drawString(MARGIN_LR * inch, footer_y, "Stackables Modular System by MindCubby")
        c.setFont("Helvetica", 8)
        c.drawCentredString(page_width / 2, footer_y, "mindcubby.etsy.com")
        
        footer_right = variant.split("--", 1)[1] if "--" in variant else variant
        c.drawRightString(page_width - (MARGIN_LR * inch), footer_y, f"{footer_right} - Page {page_num} of {len([v for v,i in all_variant_images if i])}")

        c.showPage()
        print(f"  ✓ Page {page_num} complete\n")

    c.save()
    print("="*60)
    print(f"✓ PDF saved: {OUTPUT_PDF}")
    print(f"✓ Total pages: {page_num}")
    print("="*60)
    
    print(f"\nOpening PDF in Finder...")
    try:
        subprocess.run(['open', '-R', OUTPUT_PDF], check=True)
        print(f"✓ Finder opened to: {OUTPUT_PDF}\n")
    except Exception as e:
        print(f"Note: Could not open Finder ({e})\n")
    
    return True


# --- MAIN ---
if __name__ == "__main__" or True:
    render_thumbnails()
    create_catalog()
