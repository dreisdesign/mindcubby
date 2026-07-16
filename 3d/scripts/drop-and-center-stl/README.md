# 🛠️ Drop & Center STL

Centers 3D models on the build plate. Perfect for 3D printing.

#### What It Does
- Centers each model on XY plane
- Places Z at bottom (Z=0 is build plate)
- Overwrites originals with confirmation dialogs (Blender) or native prompts (macOS app)

#### Quick Run

**Option 1: Blender Script** (recommended for automation)
```bash
blender --background --python drop-and-center-stl.py -- --input /path/to/stls/
```

**Option 2: macOS Native App** (interactive with file picker)
```bash
python3 drop-and-center-stl-macos.py
```

#### Features
✅ Two implementations: Blender script + macOS native app  
✅ XY center + Z at bottom (optimal for printing)  
✅ Batch processing (select multiple files at once)  
✅ Clear success/failure summary with logging  
✅ Native confirmation dialogs  

#### Requirements
- Blender 3.0+ (`brew install blender`)
- Python 3 (built into macOS)

#### Setup macOS App with Automator
1. Open Automator
2. Create New → Quick Action
3. Add "Run Shell Script" action
4. Paste:
```bash
python3 "/Users/danielreis/Documents/3D_PRINTING/mindcubby/3d/scripts/drop-and-center-stl/drop-and-center-stl-macos.py"
```
5. Save as "Center STL Files"
6. Assign keyboard shortcut in System Preferences
