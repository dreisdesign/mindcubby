# Generate Thumbnails

Batch render 3D STL models to PNG thumbnails in Blender.

## Quick Start

1. **Save a Blender file** in your project directory
2. **Create an `STL/` folder** next to it with your models:
   ```
   project/
   ├── project.blend
   └── STL/
       ├── variant_1/
       │   ├── Top/
       │   ├── Middle/
       │   └── Bottom/
       └── variant_2/
           └── ...
   ```
3. **Open Blender** → Scripting workspace
4. **Load script:** File → Open → select `generate-thumbnails.py`
5. **Run** (Alt+P or play button)
6. **Watch the console** for progress

The script will:
- Auto-detect your STL directory (next to the .blend file)
- Display how many files it found
- Render all of them to `THUMBNAILS/` folder
- Show progress in Blender's console

## Directory Structure

Input: `STL/` folder next to your Blender file

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

Output: `THUMBNAILS/` folder (created automatically)

```
project_directory/
└── THUMBNAILS/
    ├── variant_1/
    │   ├── Top/
    │   │   ├── model-01.png
    │   │   └── model-02.png
    │   ├── Middle/
    │   └── Bottom/
    └── variant_2/
        └── ...
```

## Customization

Edit these settings at the top of the script:

```python
RESOLUTION_X = 512        # Output width in pixels
RESOLUTION_Y = 512        # Output height in pixels
RENDER_SAMPLES = 32       # EEVEE quality (higher = slower)
USE_CYCLES = False        # False = EEVEE (faster), True = Cycles (better)
FORCE_RERENDER = False    # False = skip existing, True = re-render all
```

Then run the script again.

## Color Coding

Parts are automatically colored based on filename patterns:

- **Texture:** Smooth = blue shades, Ribbed = purple shades
- **Position:** Top = dark, Middle = medium, Bottom = light  
- **Type:** Flat = red highlight, Tube = yellow highlight

## Console Output

You should see something like:

```
============================================================
🎬 THUMBNAIL GENERATOR Script loaded
============================================================
[TG] Blend file: /path/to/project.blend
[TG] Input:  /path/to/STL
[TG] Output: /path/to/THUMBNAILS

[TG] Found 15 STL files:
[TG]   • variant_1/Top/model-01.stl
[TG]   • variant_1/Top/model-02.stl
[TG]   ...

[TG] Starting render...
[TG]   Force re-render: False
[TG]   Use Cycles: False

[TG] 🎬 THUMBNAIL GENERATOR
...
✓ Rendered 15 thumbnails
============================================================
```

## Troubleshooting

- **"Please save your Blender file first!"**: Save your .blend file first
- **"STL directory not found"**: Create `STL/` folder next to your .blend file
- **"No STL files found"**: Check that files are in `STL/{variant}/{position}/` structure
- **Rendering is slow**: Reduce `RENDER_SAMPLES` or use EEVEE (default)
- **No console output**: Open Window → Toggle System Console (or launch Blender from terminal)

## Integration

After rendering thumbnails, use **[build-pdf-catalog](../build-pdf-catalog/)** to create a PDF catalog.


