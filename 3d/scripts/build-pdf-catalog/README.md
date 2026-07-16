# 📚 PDF Catalog Generator

Generate beautiful, multi-page PDF catalogs from thumbnail images with flexible configuration, metadata parsing, and grid layouts.

**Perfect for:** Product catalogs, portfolio books, image galleries, variant showcases

---

## Quick Start

### 1. Prepare Thumbnails

Organize your thumbnail images in variant folders:

```
thumbnails/
  variant-a/
    image1.png
    image2.png
  variant-b/
    image3.png
    image4.png
```

### 2. Create Config File

Copy `config-example.yaml` and customize:

```bash
cp config-example.yaml my-catalog.yaml
```

Edit paths and grid layout:

```yaml
paths:
  input_dir: ./thumbnails
  output_pdf: ./catalog.pdf
grid:
  images_per_row: 6
  rows_per_page: 3
```

### 3. Generate PDF

```bash
python build-pdf-catalog.py --config my-catalog.yaml
```

---

## Features

✅ **Flexible Grid Layouts** — Customize images per row, rows per page  
✅ **Metadata Parsing** — Automatic extraction from filenames  
✅ **YAML Configuration** — Full customization: fonts, colors, spacing  
✅ **CLI Overrides** — Command-line arguments override config  
✅ **Environment Variables** — `PDF_` prefix for environment-based config  
✅ **Test Mode** — Limit images per variant for quick previews  
✅ **Batch Processing** — Process multiple variants with glob patterns  
✅ **Modular Design** — Test and reuse components independently  

---

## Module Architecture

```
build-pdf-catalog/
├── config.py                 # Configuration management (YAML, env vars, CLI)
├── thumbnail_scanner.py      # Find images, parse metadata
├── pdf_builder.py            # ReportLab PDF generation
├── cli.py                    # Command-line argument parser
├── build-pdf-catalog.py      # Main entry point
├── test_modules.py           # Unit tests
├── config-example.yaml       # Generic configuration template
└── stackables-config.yaml    # Project-specific example (private)
```

### config.py

Hierarchical configuration with dot-notation access:

```python
from config import Config

config = Config()
config.load_yaml("my-config.yaml")
config.set("grid.images_per_row", 8)
value = config.get("grid.images_per_row")

valid, error = config.validate()
```

**Configuration Keys:**
- `paths.input_dir` — Thumbnail directory
- `paths.output_pdf` — Output PDF file
- `grid.images_per_row` — Images per row (default: 6)
- `grid.rows_per_page` — Rows per page (default: 3)
- `image.width_inches` — Image width (default: 1.3)
- `image.height_inches` — Image height (default: 1.3)
- `layout.page_orientation` — "landscape" or "portrait"
- `colors.*` — HEX color codes for styling
- `batch.test_mode` — Limit images per variant (0 = all)

### thumbnail_scanner.py

Find and organize thumbnail images, parse metadata:

```python
from thumbnail_scanner import ThumbnailScanner

# Find all images organized by variant
variants = ThumbnailScanner.find_images(
    "./thumbnails",
    variant_pattern="*",
    test_limit=0
)
# Returns: {"variant-a": [path1, path2, ...], "variant-b": [...]}

# Parse filename metadata
metadata = ThumbnailScanner.parse_filename_metadata(
    "top--tube--xs-18.0mm--smooth.png"
)
# Returns: {position: "Top", type: "Tube", size_label: "XS", 
#           size_value: "18.0mm", texture: "Smooth"}
```

### pdf_builder.py

Generate PDF with ReportLab:

```python
from pdf_builder import PDFBuilder

builder = PDFBuilder(config.data)
pages = builder.generate_catalog(variants, output_pdf)
```

Handles:
- Multi-page layout with variant-per-page
- Image grid arrangement with spacing
- Metadata label placement and styling
- Footer with branding and page numbers

---

## Usage Examples

### Basic Usage

```bash
python build-pdf-catalog.py --config config.yaml
```

### CLI Overrides

```bash
python build-pdf-catalog.py \
  --config config.yaml \
  --input /path/to/thumbnails \
  --output catalog.pdf \
  --grid 8x4
```

### Test Mode (Preview)

```bash
# Generate catalog with only first 2 images per variant
python build-pdf-catalog.py --config config.yaml --test-limit 2
```

### Validate Configuration

```bash
python build-pdf-catalog.py --config config.yaml --validate-only
```

### Dry Run

```bash
python build-pdf-catalog.py --config config.yaml --dry-run
```

### Environment Variables

```bash
export PDF_PATHS_INPUT_DIR="/data/thumbnails"
export PDF_GRID_IMAGES_PER_ROW="8"
export PDF_BATCH_TEST_MODE="2"

python build-pdf-catalog.py --config config.yaml
```

### Run Tests

```bash
python test_modules.py
```

All tests should pass without PIL or ReportLab imports:

```
📝 Running Unit Tests
==============================================================

Testing Config defaults...✓
Testing Config set/get...✓
Testing Config YAML load...✓
Testing Config validation...✓
Testing metadata parsing...✓
Testing variant title generation...✓
Testing value type parsing...✓

==============================================================
Results: 7 passed, 0 failed
==============================================================
```

---

## Filename Metadata Format

By default, filenames are parsed as:

```
POSITION--TYPE--SIZE_INDEX--SIZE_LABEL-SIZE_VALUE--TEXTURE.png
```

Example: `top--tube--01--xs-18.0mm--smooth.png`

Parsed into:

```
{
  "position": "Top",
  "type": "Tube",
  "size_label": "XS",
  "size_value": "18.0mm",
  "texture": "Smooth"
}
```

Customize the separator in config:

```yaml
metadata:
  separator: "--"                # Change to "--" or "-" as needed
```

---

## Integrating with Other Pipelines

### With Thumbnail Generator

```bash
# Step 1: Generate thumbnails
blender --background --python generate-thumbnails.py -- \
  --config thumbnails-config.yaml

# Step 2: Build PDF catalog from thumbnails
python build-pdf-catalog.py --config pdf-config.yaml
```

### With STL Alignment

```bash
# Step 1: Align STLs
blender --background --python drop-and-center-stl.py -- \
  --input raw-stls/ --output aligned-stls/

# Step 2: Render thumbnails
blender --background --python generate-thumbnails.py -- \
  --config config.yaml --input aligned-stls/

# Step 3: Build catalog
python build-pdf-catalog.py --config config.yaml
```

---

## Configuration Deep Dive

### Grid Layout

```yaml
grid:
  images_per_row: 6
  rows_per_page: 3
```

Max images per page = 6 × 3 = 18

### Image Sizing and Spacing

```yaml
image:
  width_inches: 1.3
  height_inches: 1.3
  horizontal_spacing_inches: 0.35
  vertical_spacing_inches: 2.3
```

Total row height = height + label_space (typically 0.5 inches)

### Page Orientation

```yaml
layout:
  page_orientation: "landscape"  # or "portrait"
```

Default letter size:
- Landscape: 11" × 8.5"
- Portrait: 8.5" × 11"

### Colors

All colors use HEX format:

```yaml
colors:
  title: "#222222"               # Dark gray
  subtitle: "#666666"            # Medium gray
  label_primary: "#111111"       # Black
  label_secondary: "#555555"     # Gray
  label_filename: "#AAAAAA"      # Light gray
  footer: "#999999"              # Gray
  image_background: "#FFFFFF"    # White
```

---

## Dependencies

- Python 3.7+
- PyYAML (`pip install PyYAML`)
- Pillow (`pip install Pillow`)
- ReportLab (`pip install reportlab`)

Install all:

```bash
pip install PyYAML Pillow reportlab
```

---

## Troubleshooting

### "No images found"

- Check `paths.input_dir` points to correct directory
- Verify image files have `.png`, `.jpg`, or `.jpeg` extension (case-insensitive)
- Ensure variant folders exist and contain images

### "Configuration error"

Run with `--validate-only` to see validation errors:

```bash
python build-pdf-catalog.py --config config.yaml --validate-only
```

### PDF layout issues

Adjust spacing in config:

```yaml
image:
  vertical_spacing_inches: 2.5  # Increase if labels overlap
```

### Metadata not parsing correctly

Check filename format matches your config. Default is `--` (double dash) separator:

```yaml
metadata:
  separator: "--"
```

---

## Privacy & Security

⚠️ **Configuration files may contain project-specific paths**

Example: `stackables-config.yaml` contains paths to private project directories.

**DO NOT commit configuration files with sensitive paths to public repos.**

Add to `.gitignore`:

```
*-config.yaml
!config-example.yaml
```

---

## Performance

For large catalogs:

1. **Use test mode for previews:**
   ```bash
   python build-pdf-catalog.py --config config.yaml --test-limit 5
   ```

2. **Optimize grid layout** for performance:
   - Smaller images = faster rendering
   - Fewer images per page = smaller PDF

3. **Variant limiting:**
   ```bash
   python build-pdf-catalog.py --config config.yaml \
     --variant-pattern "variant-1|variant-2"
   ```

---

## Examples

### Generic Product Catalog

```yaml
# config.yaml
paths:
  input_dir: ./thumbnails
  output_pdf: ./product-catalog.pdf
grid:
  images_per_row: 5
  rows_per_page: 4
image:
  width_inches: 1.5
  height_inches: 1.5
```

```bash
python build-pdf-catalog.py --config config.yaml
```

### Stackables Variant Catalog

See `stackables-config.yaml` for a complete project-specific example with custom metadata parsing and styling.

---

## License

Part of MindCubby 3D Printing Toolkit
