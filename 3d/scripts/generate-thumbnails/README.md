# Generate Thumbnails - README

## Overview

Generate PNG thumbnail images from 3D STL models with configurable Blender rendering.

**Key Features:**
- Modular, tested components
- Flexible configuration (YAML + CLI overrides)
- Batch processing with variant organization
- Works both standalone and as part of larger pipelines
- Customizable lighting, camera, render engine

---

## Installation

Requires:
- Python 3.7+
- Blender 3.0+ (for rendering)
- PyYAML: `pip install pyyaml`

---

## Quick Start

### 1. Create Configuration File

```yaml
# my-thumbnails-config.yaml
paths:
  input_dir: /path/to/stl/variants
  output_dir: /path/to/output/thumbnails

render:
  resolution_x: 512
  resolution_y: 512
  engine: EEVEE
```

### 2. Run in Blender

```bash
blender --background --python generate_thumbnails.py -- --config my-thumbnails-config.yaml
```

### 3. Check Output

Thumbnails are organized by variant:
```
output/
├── 01_Variant_A/
│   ├── model_1.png
│   ├── model_2.png
├── 02_Variant_B/
│   ├── model_3.png
```

---

## Configuration

**⚠️ Privacy Note:** Configuration files with hardcoded local paths should not be committed to version control. Use the example configs as templates and create your own local config files. Consider adding `my-config.yaml` to `.gitignore` if storing personal paths.

### Via YAML File

Create `config.yaml`:

```yaml
paths:
  input_dir: /path/to/stls
  output_dir: /path/to/thumbnails

render:
  resolution_x: 1024
  resolution_y: 1024
  engine: EEVEE  # or CYCLES
  samples: 32
  force_rerender: false

scene:
  camera_location: [110, -110, 90]
  camera_rotation: [75, 0, 45]  # degrees
  light_location: [100, -100, 200]
  light_energy: 5.0
  light_rotation: [45, 0, 30]  # degrees
  background_color: [1, 1, 1, 1]  # RGBA

batch:
  variant_pattern: "*"      # glob pattern for folders
  test_mode: 0              # 0 = all, 5 = first 5 only
  skip_existing: false
```

### Via Command Line

Override config values:

```bash
blender --background --python generate_thumbnails.py -- \
  --config config.yaml \
  --input /new/input/path \
  --output /new/output/path \
  --resolution 1024 1024 \
  --engine CYCLES \
  --test-limit 5
```

### Via Environment Variables

```bash
export TG_PATHS_INPUT_DIR=/path/to/input
export TG_RENDER_RESOLUTION_X=1024
export TG_SCENE_CAMERA_LOCATION="110,110,90"

blender --background --python generate_thumbnails.py
```

---

## Usage Examples

### Example 1: Basic Render

```bash
blender --background --python generate_thumbnails.py \
  --config config.yaml
```

### Example 2: Test Mode (First 3 Files Per Variant)

```bash
blender --background --python generate_thumbnails.py \
  --config config.yaml \
  --test-limit 3
```

### Example 3: Force Re-render Everything

```bash
blender --background --python generate_thumbnails.py \
  --config config.yaml \
  --force-rerender
```

### Example 4: Higher Quality (Cycles Engine)

```bash
blender --background --python generate_thumbnails.py \
  --config config.yaml \
  --engine CYCLES \
  --resolution 2048 2048
```

### Example 5: Specific Variant Pattern

```bash
blender --background --python generate_thumbnails.py \
  --config config.yaml \
  --variant-pattern "smooth-*"
```

### Example 6: Validate Config Without Rendering

```bash
blender --background --python generate_thumbnails.py \
  --config config.yaml \
  --validate-only
```

---

## Architecture

Modular design allows using components independently:

```python
# Use scene setup module
from blender_scene_setup import BlenderSceneSetup
setup = BlenderSceneSetup(config)
setup.setup_complete_scene()

# Use STL importer
from stl_importer import STLImporter
variants = STLImporter.find_stl_files("/path/to/stls")
obj, success = STLImporter.import_stl(stl_path)

# Use renderer
from thumbnail_renderer import ThumbnailRenderer
renderer = ThumbnailRenderer(config)
stats = renderer.batch_render(variants, output_dir)
```

---

## Integrating with Other Pipelines

### With PDF Catalog Generator

```python
from generate_thumbnails import main_blender
from build_pdf_catalog import PDFCatalogBuilder

# Step 1: Generate thumbnails
main_blender(config_path="config.yaml")

# Step 2: Build PDF from thumbnails
pdf_builder = PDFCatalogBuilder(config)
pdf_builder.generate_catalog()
```

### With Model Alignment

```python
from align_and_package_stls import STLAligner
from generate_thumbnails import main_blender

# Step 1: Align STLs
aligner = STLAligner(input_dir, output_dir)
aligner.align_all()

# Step 2: Generate thumbnails from aligned STLs
config.set("paths.input_dir", output_dir)
main_blender(config_path="config.yaml")
```

---

## Troubleshooting

**Error: "Blender not found"**
- Ensure Blender 3.0+ is installed
- Or specify path: `blender_path=/Applications/Blender.app/Contents/MacOS/blender`

**Error: "No STL files found"**
- Check `paths.input_dir` points to root of variant folders
- Variant folders should directly contain `.stl` files
- Check `batch.variant_pattern` glob doesn't exclude folders

**Slow rendering**
- Use `EEVEE` engine (faster)
- Reduce `render.samples`
- Lower `render.resolution_x/y`
- Use `test_limit` to test with fewer files first

**Output quality issues**
- Increase `render.samples`
- Switch to `CYCLES` engine
- Check `scene.light_energy` and `camera_location`

---

## Module Reference

### config.py

`Config` class for loading/managing configuration.

```python
config = Config()
config.load_yaml("config.yaml")
config.set("render.resolution_x", 1024)
value = config.get("paths.input_dir")
valid, error = config.validate()
```

### blender_scene_setup.py

`BlenderSceneSetup` class for Blender scene configuration.

```python
setup = BlenderSceneSetup(config)
setup.setup_complete_scene()
```

### stl_importer.py

`STLImporter` class for discovering and importing STL files.

```python
variants = STLImporter.find_stl_files("/path")
obj, success = STLImporter.import_stl("/path/file.stl")
STLImporter.center_object(obj)
```

### thumbnail_renderer.py

`ThumbnailRenderer` class for rendering to images.

```python
renderer = ThumbnailRenderer(config)
stats = renderer.batch_render(variants, output_dir)
```

### cli.py

CLI argument parsing and utilities.

```python
from cli import create_parser, print_config_summary
parser = create_parser()
args = parser.parse_args()
```

---

## See Also

- [build-pdf-catalog](../build-pdf-catalog) - Create PDFs from thumbnails
- [align-and-package-stls](../align-and-package-stls) - Prepare STLs for production
- [3d/README.md](../../README.md) - Overview of all 3D tools
