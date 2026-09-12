# 🥞 Recipe Builder - macOS Native App

A native macOS application for assembling and exporting 3D model stacks using Blender.

## Quick Start

1. **Double-click `RecipeBuilder` on your Desktop** (or in the app bundle)
2. Fill in the native macOS dialogs:
   - Recipe name
   - Stack direction (top-to-bottom or bottom-to-top)
   - Filenames (one per line or comma-separated)
3. Choose output folder
4. Done! ✓

## How It Works

The app uses **native macOS dialogs** (not Tk), so it:
- ✅ Looks and feels like a real macOS app
- ✅ Has zero rendering issues
- ✅ Works flawlessly on all Macs
- ✅ Opens your output folder automatically

## Files

- `RecipeBuilder.app/` - The app (ready to use!)
- `recipe_builder.py` - The Python script (uses osascript for native dialogs)

## Requirements

- macOS 10.12+
- Blender 3.0+ (`brew install blender`)
- Python 3 (comes with macOS)

## Usage

### From Desktop
Copy the app to your Desktop:
```bash
cp -r RecipeBuilder.app ~/Desktop/
```
Then double-click it.

### From Applications Folder
```bash
cp -r RecipeBuilder.app /Applications/
```

### Run Directly
```bash
python3 recipe_builder.py
```

## Input Format

Paste filenames as:
- **One per line**: 
  ```
  top--flat--02--sm-30.4mm--ribbed.stl
  middle--tube--01--xs-18.0mm--smooth.stl
  ```
- **Comma-separated**:
  ```
  top--flat--02--sm-30.4mm--ribbed.stl, middle--tube--01--xs-18.0mm--smooth.stl
  ```
- **Without .stl extension** (auto-added):
  ```
  top--flat--02--sm-30.4mm--ribbed
  middle--tube--01--xs-18.0mm--smooth
  ```

## Output

You'll get:
- `{RecipeName}--COMBINED.stl` - All parts stacked together
- Individual STL files - Each part separately

## Architecture

Uses **osascript** to show native macOS dialogs instead of Tk:
- `display dialog` - Text input
- `choose from list` - Choice selection  
- `choose folder` - File picker
- `display alert` - Status messages

All the assembly logic comes from your existing `ASSEMBLE_RECIPE.py`.

---

**Made for 3D Printing** 🖨️
