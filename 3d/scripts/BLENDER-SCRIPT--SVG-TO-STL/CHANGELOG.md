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