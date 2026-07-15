# **README.md**

This batch automation script streamlines the pipeline of converting raw 2D vector graphic assets (.svg) into clean, print-ready 3D models (.stl). It is optimized for face-down multi-color printing.

## **1\. How to Use**

### **Setup the Workspace**

1. Save your Blender project file (.blend) in your designated working directory.  
2. Open the **Scripting** workspace in Blender, create a **New** text block, and paste the script.

### **Folder Structure Setup**

You do not need to create any folders manually.

* **First Run:** Run the script once. It automatically detects the directory containing your .blend file and builds the following structure:  
  `[Your Project Folder]/`  
  `├── your_file.blend`  
  `├── SVG/          <-- Put your input SVGs here`  
  `└── STL/          <-- Your exported STLs will appear here`

* If no SVGs are detected on the first run, Blender will trigger an informational popup and automatically open your project folder in Finder so you can drop your SVG files in.

### **Running the Batch Converter**

1. Place your vector graphics (.svg) into the newly created SVG/ folder.  
2. Run the script in Blender again.  
3. An interactive options dialog will appear:  
   * **Width (mm):** Set the desired physical width of the model.  
   * **Height (mm):** Set the Z-height thickness.  
   * **Overwrite Existing STLs:** Overwrite is checked by default to keep iteration fast. Uncheck this if you wish to skip files with matching output metadata.  
   * **Files to Process:** Preview the list of detected SVGs before executing.  
4. Click **OK**. The script will batch process every file, append width and height properties to the file names (e.g., FILENAME\_W-55.0mm\_H-0.20mm.stl), clean up the workspace, and automatically reveal the output STL/ folder in Finder.

## **2\. How It Works**

`[Import SVG] ➔ [Clean Parents & Join] ➔ [Native 2D Curve Extrude] ➔ [Convert to Mesh]`   
                                                                           `│`  
`[Export STL] 🗎 ◀ [Drop to Z=0] ◀ [Mirror X (Face-Down)] ◀ [Absolute Scale] ◀ [Clean Mesh]`

* **Dynamic Option Persistence:** Last-used target width and height metrics are committed directly to Blender’s active scene metadata within your .blend file. Running the script again instantly recalls these parameters as your defaults.  
* **Native Curve Extrusion:** Instead of converting flat curves directly to meshes and solidifying them, the script extrudes them inside Blender's vector engine using active\_obj.data.extrude. This produces perfectly uniform wall loops and flat caps, completely bypassing the messy triangulation artifacts of 2D tessellation.  
* **Mesh Cleansing:** Once converted to a mesh, the script enters Edit Mode, merges overlapping duplicate vertices (remove\_doubles), and forces outside-facing normals.  
* **Absolute Scaling:** The script calculates the bounding box of the joined mesh and applies an absolute scale factor to match your exact target width (X/Y) and height (Z) in millimeters, factoring in the current Blender scene's unit scale.  
* **First-Layer Prep:** The model is horizontally mirrored on the X-axis (crucial for preserving orientation when printed face-down on the build plate), centered at (0,0), and aligned so its lowest point rests exactly at Z \= 0\.  
* **Explicit Filename Metadata:** During export, output files are named with explicit dimension metadata appended to the tail (\_W-{Width}mm\_H-{Height}mm.stl), ensuring slicer instances instantly recognize physical targets.

## **3\. UX & Engineering Decisions**

### **Eliminating Slicer Tessellation Failures**

Converting flat, complex curves directly into a mesh creates a web of degenerate, self-intersecting triangles. Applying a Solidify modifier to this dirty geometry results in overlapping internal faces that confuse slicers, causing jagged walls or missing layers. By utilizing **Native Curve Extrusion**, the engine constructs pristine, continuous quad-strips along the path walls first.

### **Non-Disruptive OS Integration**

An earlier iteration attempted to clear Finder selections via macOS AppleScript to keep the window completely clean. However, this triggered invasive OS-level permission dialogs. Reverting to standard platform-native open calls keeps the workflow fast, automated, and permission-free.

### **Explicit Asset Versioning & Default Overwrites**

Because physical print sizing shifts between prototype runs, saving files as standard static names makes it easy to lose track of which STL corresponds to which calibration size. Appending dimensions directly to the filename cleanly partitions physical versions. By checking "Overwrite" by default, design updates remain seamless while still safeguarding existing files.

### **Frictionless Slicing Hand-off**

Opening the target STL/ directory upon a successful run minimizes physical clicks, allowing you to instantly drag-and-drop the generated models straight into OrcaSlicer.

# **CHANGELOG.md**

### **\[1.9.0\] \- 2026-07-15**

* **Added:** Scene-level UI persistence. The script now reads/writes target\_width and target\_height from the active Blender scene data, ensuring previous run values are used as defaults for subsequent runs.

### **\[1.8.0\] \- 2026-07-15**

* **Added:** Dynamic UI option persistence. The script now commits last-used width and height parameters directly to the .blend file's active scene metadata, retaining input configurations between executions.

### **\[1.7.0\] \- 2026-07-15**

* **Added:** Added automatic width and height suffix formatting (\_W-{width}mm\_H-{height}mm) to all exported STL filenames.  
* **Changed:** Enabled the "Overwrite Existing STLs" toggle by default.

### **\[1.6.0\] \- 2026-07-15**

* **Changed:** Post-processing directory navigation. The script now automatically reveals the /STL folder upon a successful export, streamlining the hand-off to the slicer. The /SVG root folder is still opened if the directory is completely empty.

### **\[1.5.0\] \- 2026-07-15**

* **Fixed:** Removed AppleScript-based Finder deselect commands to eliminate the intrusive macOS system automation permission prompt.  
* **Changed:** Replaced file system triggers with platform-native, permission-free shell executions to maintain compatibility.

### **\[1.4.0\] \- 2026-07-15**

* **Added:** Interactive SVG manifest list inside the Blender runtime options dialog, showing the user exactly what files are ready to be processed or overwritten.  
* **Added:** Post-execution trigger to reveal the directory in Finder automatically.

### **\[1.3.0\] \- 2026-07-15**

* **Changed:** Structural relocation. Removed the hardcoded subdirectory requirement (SCRIPT/). The script now uses flat, relative paths, searching and creating /SVG and /STL folders in the immediate directory of the host .blend file.  
* **Added:** User-facing popup dialog informing them when the folder structure is successfully created but missing SVG assets.

### **\[1.2.0\] \- 2026-07-15**

* **Added:** "Just-In-Time" automated directory creation (os.makedirs) to dynamically build the project folders, removing the need for manual file system preparation.

### **\[1.1.0\] \- 2026-07-15**

* **Fixed:** Resolved rough geometry, degenerated faces, and jagged walls on exported STLs.  
* **Added:** Native 2D vector engine extrusion (active\_obj.data.extrude) implemented before converting curves to mesh geometry.  
* **Added:** Automated vertex merging, normal recalculations, and higher curve resolution settings (resolution\_u \= 24\) for clean, manifold prints.

### **\[1.0.0\] \- 2026-07-15**

* **Added:** Initial batch processing pipeline for importing vector curves, joining them, converting to mesh, applying scaling factors, mirroring for face-down print orientation, and exporting to STL.