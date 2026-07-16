# 🛠️ STL Centerer

Centers 3D models on the build plate. Perfect for 3D printing.

#### What It Does
- Prompts to select STL files (native macOS file picker)
- Centers each model on XY plane
- Places Z at bottom (Z=0 is build plate)
- Overwrites originals with native confirmation dialogs ("Replace", "Replace All", or "Cancel")

#### Quick Run
```bash
python3 stl_centerer.py
```
Or from anywhere:
```bash
/usr/bin/python3 /Users/danielreis/Documents/3D_PRINTING/MINDCUBBY-3D/APPS/stl_centerer/stl_centerer.py
```

#### Features
✅ Native macOS file picker (drag & drop STLs)  
✅ XY center + Z at bottom (optimal for printing)  
✅ Replace All option for batch processing  
✅ Native confirmation dialogs (Replace / Replace All / Cancel)  
✅ Batch processing (select multiple files at once)  
✅ Clear success/failure summary with logging  

#### Requirements
- Python 3 (built into macOS)
- Blender 3.0+ (`brew install blender`)

#### Setup with Automator
1. Open Automator
2. Create New → Quick Action
3. Add "Run Shell Script" action
4. Paste:
```bash
python3 "/Users/danielreis/Documents/3D_PRINTING/MINDCUBBY-3D/APPS/stl_centerer/stl_centerer.py"
```
5. Save as "Center STL Files"
6. Assign keyboard shortcut in System Preferences
