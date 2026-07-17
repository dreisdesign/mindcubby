# Build PDF Catalog

Generate multi-page PDF catalogs from thumbnail images.

## Quick Start

```bash
# Edit configuration at top of script
nano build-pdf-catalog.py

# Run
python3 build-pdf-catalog.py
```

## Directory Structure

Input should be organized as:

```
thumbnails/
├── variant_1/
│   ├── Top/
│   │   ├── image-01.png
│   │   ├── image-02.png
│   │   └── ...
│   ├── Middle/
│   └── Bottom/
├── variant_2/
│   └── ...
```

Output: `catalog.pdf` (landscape letter size, multi-page)

## Configuration

Edit these variables at the top of the script:

- **INPUT_DIR**: Directory containing organized thumbnail folders
- **OUTPUT_PDF**: Path to generated PDF
- **GRID_COLS**: Images per row (default: 6)
- **GRID_ROWS**: Rows per page (default: 3)
- **IMAGE_WIDTH, IMAGE_HEIGHT**: Thumbnail display size (inches)
- **H_SPACING, V_SPACING**: Spacing between images (inches)
- **TEST_MODE**: Limit images per variant (0 = all, >0 = test limit)
- **VARIANTS**: List of variant folder names (controls page order)

## Filename Format

Thumbnails should follow this naming convention for metadata labels:

```
{position}--{type}--{size_index}--{size_label}-{size_value}--{texture}.png
```

Example:
```
top--tube--01--xs-18.0mm--smooth.png
middle--flat--02--md-42.8mm--ribbed.png
bottom--tube--03--lg-55.2mm--smooth.png
```

Parsed into:
- **Position**: Top, Middle, Bottom (shows in label)
- **Type**: Tube, Flat (shows in label)
- **Size Label**: xs, sm, md, lg, xl, xxl (shows in label)
- **Size Value**: 18.0mm, 42.8mm, etc. (shows in label)
- **Texture**: smooth, ribbed (shows in label)

## Output Features

- **Multi-page PDF**: One page per variant
- **Grid layout**: 6×3 images per page (configurable)
- **Metadata labels**: Extracted from filenames
- **Page numbers**: Automatic pagination
- **Branding footer**: Title, URL, variant name
- **White backgrounds**: Behind each image
- **Alpha support**: Transparent PNG backgrounds preserved

## Running from Command Line

```bash
# Basic usage
python3 build-pdf-catalog.py

# Test mode (limit 2 images per variant)
# Edit TEST_MODE = 2 at top of script, then:
python3 build-pdf-catalog.py
```

## Integration

1. First: Generate thumbnails with **[generate-thumbnails](../generate-thumbnails/)**
2. Then: Run this script to create catalog PDF
3. Result: Production-ready catalog with proper spacing, metadata, and branding

## Troubleshooting

- **"Input directory not found"**: Check `INPUT_DIR` path
- **No images found**: Ensure PNG files are in `{variant}/{position}/` structure
- **Missing metadata labels**: Rename files to match `position--type--..--size--texture.png` format
- **Wrong page order**: Edit `VARIANTS` list to match your folder names

## Notes

- Requires: `pillow`, `reportlab`
- Install: `pip install pillow reportlab`
- Python 3.7+
- Supports PNG and JPG images
- Generates landscape letter-size PDF
