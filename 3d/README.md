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

Blender scripts and utility tools for batch processing and model preparation.

### [convert-svg-to-stl](scripts/convert-svg-to-stl/)
Batch convert 2D vector graphics (.svg) to print-ready 3D models (.stl). Optimized for face-down multi-color printing and text-based models. Runs in Blender.

**Usage:** Paste script into Blender's Scripting workspace and run.

### [drop-and-center-stl](scripts/drop-and-center-stl/)
Center 3D models on the build plate (XY center, Z at bottom). 

**Usage:** Paste script into Blender's Scripting workspace and run.

### [generate-thumbnails](scripts/generate-thumbnails/)
Batch render 3D STL models to PNG thumbnails via Blender. Configure camera, lighting, output resolution, and rendering engine with YAML config or CLI arguments.

**Usage:** 
```bash
python3 generate-thumbnails.py --config config.yaml
```

**Features:** Configurable EEVEE/Cycles rendering, flexible scene setup, batch processing, CLI + YAML + env var config hierarchy.

[Docs & Examples](scripts/generate-thumbnails/README.md)

### [build-pdf-catalog](scripts/build-pdf-catalog/)
Generate multi-page PDF catalogs from thumbnail images organized by variant folders. Automatically extracts metadata from filenames and arranges in configurable grid layout.

**Usage:** 
```bash
python3 build-pdf-catalog.py --config config.yaml --input thumbnails/ --output catalog.pdf
```

**Features:** Multi-page PDF generation, automatic variant detection, metadata labels, configurable grid layout, dry-run mode.

[Docs & Examples](scripts/build-pdf-catalog/README.md)

---

## All tools are local & private
No data uploads, no tracking. Everything runs on your machine.
