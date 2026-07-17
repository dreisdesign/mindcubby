# 3D Tools

A collection of browser-based apps and utility scripts for 3D modeling, STL processing, and asset conversion.

## Apps

Interactive web applications—no installation required, runs entirely in your browser.

### [Rotater](apps/rotater/)
View and export rotating 3D STL models as animated GIF, MP4, or PNG snapshot. Customize spin, tilt, wobble, and appearance with real-time preview.

**[Try Rotater](https://dreisdesign.github.io/mindcubby/3d/apps/rotater/)** | [Docs](apps/rotater/README.md) | [Roadmap](apps/rotater/ROADMAP.md)

### [G-coder](apps/gcoder/)
Generate Printables specifications and estimates from G-code files. Extract print time, material usage, and other metadata.

**[Try G-coder](https://dreisdesign.github.io/mindcubby/3d/apps/gcoder/)** | [Docs](apps/gcoder/README.md)

---

## Scripts

Blender scripts and command-line tools for batch 3D asset processing.

### [convert-svg-to-stl](scripts/convert-svg-to-stl/)
Batch convert 2D vector graphics (.svg) to print-ready 3D models (.stl). Optimized for face-down multi-color printing and text-based models.

**Usage:** Paste script into Blender's Scripting workspace and run. [Docs](scripts/convert-svg-to-stl/README.md)

### [drop-and-center-stl](scripts/drop-and-center-stl/)
Center 3D models on the build plate (XY center at origin, Z at bottom).

**Usage:** Paste script into Blender's Scripting workspace and run. [Docs](scripts/drop-and-center-stl/README.md)

### [generate-thumbnails](scripts/generate-thumbnails/)
Batch render 3D STL models to PNG thumbnails via Blender with customizable lighting, camera, and color schemes.

**Usage:** Paste script into Blender's Scripting workspace and run (Blender 3.0+). [Docs](scripts/generate-thumbnails/README.md)

**Features:**
- Smart color-coding based on part properties (texture, position, type)
- Configurable EEVEE or Cycles rendering
- Organized output matching input structure (variants/positions)
- Skips already-rendered images

### [build-pdf-catalog](scripts/build-pdf-catalog/)
Generate multi-page PDF catalogs from thumbnail images organized by variant and position.

**Usage:** `python3 build-pdf-catalog.py` (Python 3.7+, requires PIL and ReportLab). [Docs](scripts/build-pdf-catalog/README.md)

**Features:**
- Automatic metadata extraction from filenames
- Configurable grid layout (6×3 default, customizable)
- Multi-page PDFs with variant titles and pagination
- Landscape letter-size format with branding footer
- Smart image spacing and label positioning

---

## Workflow

Typical asset production pipeline:

1. **Center models** → `drop-and-center-stl` (prepare for printing)
2. **Generate thumbnails** → `generate-thumbnails` (render for catalog)
3. **Build catalog** → `build-pdf-catalog` (create product catalog PDF)

---

## All tools are local & private
No data uploads, no tracking. Everything runs on your machine.
