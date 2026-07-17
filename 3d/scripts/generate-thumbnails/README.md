# Generate Thumbnails

Batch render 3D STL models to PNG thumbnails in Blender.

## Quick Start

1. **Open Blender** (3.0+)
2. **Go to Scripting workspace**
3. **Load script:** File → Open → select `generate-thumbnails.py`
4. **Configure paths** at the top:
   - `DIR_INPUT`: Directory with STL files organized as `{variant}/{position}/` folders
   - `DIR_OUTPUT`: Where to save rendered thumbnails
5. **Run** (Alt+P or play button)

## Directory Structure

Input files should be organized as:

```
input_stls/
├── variant_1/
│   ├── Top/
│   │   ├── model-01.stl
│   │   └── model-02.stl
│   ├── Middle/
│   └── Bottom/
├── variant_2/
│   └── ...
```

Output will be created in the same structure:

```
output_thumbnails/
├── variant_1/
│   ├── Top/
│   │   ├── model-01.png
│   │   └── model-02.png
│   ├── Middle/
│   └── Bottom/
```

## Configuration

Edit these variables at the top of the script:

- **RESOLUTION_X, RESOLUTION_Y**: Output image size (default: 512×512px)
- **RENDER_SAMPLES**: EEVEE quality (32 = good balance, higher = slower)
- **USE_CYCLES**: Use Cycles renderer instead of EEVEE (slower, better quality)
- **FORCE_RERENDER**: Re-render all images or skip existing (default: False)
- **COLORS**: Customize color scheme for parts (smart defaults included)

## Color Coding

By default, parts are automatically colored based on filename patterns:

- **Texture:** Smooth = blue shades, Ribbed = purple shades
- **Position:** Top = dark, Middle = medium, Bottom = light
- **Type:** Flat parts = red highlight, Tube parts = yellow highlight

Colors are blended to show all three properties at once.

## Notes

- Requires Blender 3.0 or later
- First run will be slower (Blender initialization)
- Scenes are re-initialized for each batch (cleaner renders)
- Transparent background (PNGs have alpha channel)

## Troubleshooting

- **"Input directory not found"**: Check `DIR_INPUT` path in script
- **Slow rendering**: Reduce `RENDER_SAMPLES` or use EEVEE (not Cycles)
- **Memory issues**: Process variants in smaller batches
- **Python error**: Ensure you're in the Blender Scripting workspace

## Integration

Next step: Use generated thumbnails with **[build-pdf-catalog](../build-pdf-catalog/)** to create a complete PDF catalog.
