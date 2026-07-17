# Generate Thumbnails

Batch render 3D STL models to PNG thumbnails in Blender with an interactive dialog UI.

## Quick Start

1. **Save a Blender file** in your project directory
2. **Open Blender** → Scripting workspace
3. **Load script:** File → Open → select `generate-thumbnails.py`
4. **Run** (Alt+P or play button)
5. **Dialog appears** showing:
   - Input and output directories (auto-detected from .blend location)
   - Number of STL files found
   - Options to configure
6. **Click** "Batch Render Thumbnails" to start

## Directory Structure

Save your Blender file in a directory with this structure:

```
project_directory/
├── project.blend
└── STL/
    ├── variant_1/
    │   ├── Top/
    │   │   ├── model-01.stl
    │   │   └── model-02.stl
    │   ├── Middle/
    │   └── Bottom/
    ├── variant_2/
    └── ...
```

The script will create:

```
project_directory/
└── THUMBNAILS/
    ├── variant_1/
    │   ├── Top/
    │   │   ├── model-01.png
    │   │   └── model-02.png
    │   ├── Middle/
    │   └── Bottom/
    ├── variant_2/
    └── ...
```

## Dialog Options

- **Force Re-render:** Re-render all images (default: unchecked = skip existing)
- **Use Cycles Engine:** Use Cycles renderer instead of EEVEE (default: unchecked)

## Color Coding

Parts are automatically colored based on filename patterns:

- **Texture:** Smooth = blue shades, Ribbed = purple shades
- **Position:** Top = dark, Middle = medium, Bottom = light  
- **Type:** Flat = red highlight, Tube = yellow highlight

Colors blend to show all three properties simultaneously.

## Render Settings

Edit these at the top of the script to customize:

```python
RESOLUTION_X = 512        # Output width in pixels
RESOLUTION_Y = 512        # Output height in pixels
RENDER_SAMPLES = 32       # EEVEE quality (higher = slower)
USE_CYCLES = False        # False = EEVEE, True = Cycles
FORCE_RERENDER = False    # False = skip existing, True = re-render all
```

## Troubleshooting

- **Dialog doesn't appear:** Check that you saved the Blender file first
- **"STL directory not found":** Create `STL/` folder next to your .blend file
- **"No STL files found":** Verify files are in `STL/{variant}/{position}/` structure
- **Rendering is slow:** Reduce `RENDER_SAMPLES` or use EEVEE (default)
- **Black/dark renders:** Check scene lighting (sun light should be visible)

## Integration

After rendering thumbnails:
1. Use **[build-pdf-catalog](../build-pdf-catalog/)** to create a PDF catalog
2. Or manually browse thumbnails in `THUMBNAILS/` folder

