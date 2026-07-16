# 🛠️ Drop & Center STL

Center 3D models on the build plate for optimal printing. Works directly in Blender - perfect for batch processing.

#### What It Does
- Centers each model on XY plane (ready for the build plate)
- Places bottom at Z=0 (optimal for first-layer adhesion)
- Batch processes all STL files in an STL folder
- Option to overwrite originals or save to CENTERED subfolder

#### Quick Start

1. **Save a Blender file** in your project directory (alongside an "STL" folder)
2. **Paste this script** into Blender's Scripting workspace
3. **Run it** — dialog will appear with options
4. **Select settings** and click OK to process all STLs

#### How to Use

1. Place STL files in an `STL` folder next to your `.blend` file:
   ```
   my-project/
   ├── my-project.blend
   └── STL/
       ├── part1.stl
       ├── part2.stl
       └── ...
   ```

2. Copy `drop-and-center-stl.py` code into Blender's Scripting workspace

3. Run the script (Output is above the code editor)

4. Dialog appears:
   - **Center XY**: Enable to center on XY plane ✓
   - **Ground Z**: Enable to move bottom to Z=0 ✓
   - **Overwrite Existing**: Check to replace originals; uncheck to save to `STL/CENTERED/`

5. Click OK - script processes all files and opens the output folder

#### Features
✅ Batch processing (all STL files at once)
✅ XY center + Z at bottom (print-ready)
✅ Dialog UI with live preview of files to process
✅ Persistent settings (remembers your choices)
✅ Overwrite or save to subfolder option
✅ Auto-opens output folder when done

#### Output

By default:
- **Overwrite mode**: STLs replaced in place
- **Subfolder mode**: Creates `STL/CENTERED/` with centered copies

#### Files

- `drop-and-center-stl.py` — The Blender script (paste into Scripting workspace)
