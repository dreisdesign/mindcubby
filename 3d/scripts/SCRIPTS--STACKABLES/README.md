# Stackables Workflow — Modular Blender Pipeline

**Version**: 1.0  
**Last Updated**: 2026-09-12

A modular Blender-based pipeline for generating, rendering, cataloging, and packaging the Stackables 3D-printable container system for Etsy.

---

## 🚀 Quick Start

**Open one file. Click buttons. That's it.**

```
1. Open:  run.blend  (in this folder)
2. Click: Orchestrator menu appears
3. Run:   1A → 1B → 1C (in any order, any time)
          Each step independently selects its input folder
```

---

## 📁 Project Structure

```
SCRIPTS--STACKABLES/              ← This folder
├── run.blend                      ← MAIN ENTRY POINT (open this)
├── README.md                      ← Documentation
│
├── Scripts/
│   ├── run.py                     ← Orchestrator UI (auto-loads in run.blend)
│   ├── 01A_GENERATOR.py           ← STL generator
│   ├── 01B_THUMBNAILS.py          ← Thumbnail renderer + PDF catalog generator
│   ├── 01C_PACKAGER.py            ← Etsy packager (ZIPs with decimation)
│   └── 01A_PARTS/                 ← STL component parts (base geometry)
│
├── Output/
│   └── Stackables_AUTO--2026-09-12_0548-0548am/
│       ├── 01_Stackable--Ribbed-Flat/
│       ├── 02_Stackable--Ribbed-Tube/
│       ├── 03_Stackable--Smooth-Flat/
│       ├── 04_Stackable--Smooth-Tube/
│       ├── THUMBNAILS/
│       ├── PACKAGED-ZIPS/
│       ├── catalog.pdf
│       └── PART_LIST_CATALOG.csv
│
└── _ARCHIVE/                      ← Old pipeline versions
```

---

## 🔄 Workflow — 3 Independent Steps

All steps are **manual** and **independent**. Run them in any order, any time.

### **Step 1A: Generate STLs** ✅

**Purpose**: Generate 3D model variants from part components.

**Dialog Options**:
- **Size Selection** (15 standard sizes, default: 18mm only)
  - Choose any combination: 18, 30.4, 42.8, 55.2, 67.6, 80 mm, etc.
  - "All" button selects all 15 sizes
  - "None" button clears all
  - Selections auto-save for next run

- **Bottom Type**
  - ☑ Flat bottom (default)
  - ☑ Tube bottom

- **Wall Type**
  - ☑ Ribbed walls (default)
  - ☑ Smooth walls

**Output**:
```
Output/Stackables_AUTO--2026-09-12_0548-0548am/
├── 01_Stackable--Ribbed-Flat/      (4 variant folders created)
├── 02_Stackable--Ribbed-Tube/
├── 03_Stackable--Smooth-Flat/
├── 04_Stackable--Smooth-Tube/
└── PART_LIST_CATALOG.csv          (metadata for downstream steps)
```

**Time**: ~30-60 seconds depending on size/variant count

---

### **Step 1B: Render Thumbnails + Generate PDF Catalog** ✅

**Purpose**: Create isometric PNGs and multi-page PDF from STLs.

**Dialog**:
- Select which Output folder to process
- Auto-detects latest folder if available

**Output**:
```
Output/Stackables_AUTO--2026-09-12_0548-0548am/
├── THUMBNAILS/
│   ├── 01_Stackable--Ribbed-Flat/
│   ├── 02_Stackable--Ribbed-Tube/
│   ├── 03_Stackable--Smooth-Flat/
│   └── 04_Stackable--Smooth-Tube/
│       └── stackable--flat--ribbed--18mm.png  (512×512)
│
└── catalog.pdf                     (6-col grid, landscape letter)
```

**Features**:
- Color-coded renders (isometric EEVEE, 16 samples)
- Auto-opens both folders in Finder
- PDF shows accurate image counts per page
- Auto-installs `Pillow` and `reportlab` if needed

**Time**: ~2-5 minutes (depending on variant/size count)

---

### **Step 1C: Package for Etsy** ✅

**Purpose**: Create optimized ZIP packages ready for Etsy upload.

**Dialog**:
- Select which Output folder to process

**Output**:
```
Output/Stackables_AUTO--2026-09-12_0548-0548am/
├── PACKAGED-ZIPS/
│   ├── 01_Stackable--Ribbed-Flat/
│   │   ├── stackable--flat--ribbed--18mm.stl
│   │   ├── stackable--flat--ribbed--30.4mm.stl
│   │   └── ...
│   ├── 01_Stackable--Ribbed-Flat.zip  (≤20MB)
│   ├── 02_Stackable--Ribbed-Tube.zip
│   ├── 03_Stackable--Smooth-Flat.zip
│   └── 04_Stackable--Smooth-Tube.zip
│
└── PACKAGED-ZIPS-ARCHIVE/
    └── 2026-09-12_0548/            (old builds archived here)
```

**Features**:
- Auto-cleans old STLs before re-exporting (no .001 duplicates)
- Decimation: 0.85 ratio for ribbed geometry (fits 20MB limit)
- Archives previous builds with timestamps
- Includes Description.txt in each ZIP

**Time**: ~1-2 minutes

---

## 💾 Settings Persistence

**01A** saves your size selections automatically:
```json
// .stackables_settings.json (saved in project root)
{
  "size_18": true,
  "size_30": false,
  "size_42": true,
  "generate_flat": true,
  "generate_tube": false,
  "generate_ribbed": true,
  "generate_smooth": false
}
```

Next time you run 01A, these settings are pre-loaded.

---

## 🔐 Security & Privacy Checklist

✅ No hardcoded API keys or credentials  
✅ No email addresses or personal info in scripts  
✅ No external service dependencies (all local)  
✅ Output paths are relative to project structure  
✅ No telemetry or analytics  
✅ Open-source libraries only (PIL, ReportLab, Blender)

---

## 📋 File Naming Convention

All exported files follow this structure for easy parsing:

**STL Format**:
```
stackable--{bottom}--{wall}--{height}mm.stl
Examples:
  stackable--flat--ribbed--18mm.stl
  stackable--tube--smooth--80mm.stl
```

**PNG Format**:
```
stackable--{bottom}--{wall}--{height}mm.png
Examples:
  stackable--flat--ribbed--18mm.png
  stackable--tube--smooth--67.6mm.png
```

---

## 🔧 Technical Details

### Blender Operator Pattern
- **Orchestrator**: `OBJECT_OT_StackablesOrchestrator` (menu dialog)
- **Step 1A**: `OBJECT_OT_GenerateStackableOptions` (from 01A_GENERATOR.py)
- **Step 1B**: `OBJECT_OT_Run01B` (folder selection + execution)
- **Step 1C**: `OBJECT_OT_Run01C` (folder selection + execution)

### Python Namespace Injection
Scripts receive context via `run_script()`:
```python
namespace = {
    'bpy': bpy,
    'SELECTED_OUTPUT_FOLDER': selected_folder,  # Set by operator
    '_RUN_MODULE_GLOBALS': globals()            # For cross-script calls
}
```

### Material & Color Settings

**Render Colors** (01B_THUMBNAILS.py):
```python
SMOOTH_TOP:    (0.0, 0.1, 0.5, 1.0)   # Deep blue
SMOOTH_MID:    (0.1, 0.4, 0.9, 1.0)   # Bright blue
SMOOTH_BOTTOM: (0.6, 0.8, 1.0, 1.0)   # Light blue

RIBBED_TOP:    (0.3, 0.0, 0.4, 1.0)   # Deep purple
RIBBED_MID:    (0.6, 0.2, 0.8, 1.0)   # Bright purple
RIBBED_BOTTOM: (0.9, 0.7, 1.0, 1.0)   # Light purple
```

---

## 🚨 Troubleshooting

**Issue**: "No Output folders found in Output/"
- **Solution**: Run 1A first to generate an Output folder

**Issue**: ".001" duplicate STL files appear
- **Solution**: 1C now auto-cleans old STLs before exporting

**Issue**: PDF shows "X of 72" with only 24 images
- **Solution**: Fixed in v1.0 - now counts actual images per variant

**Issue**: Thumbnails not rendering
- **Solution**: Ensure 01A STLs are in correct folder structure

---

## 📝 Version History

**v1.0** (2026-09-12)
- ✅ Consolidated 01B (Thumbnails) + PDF into single step
- ✅ Renamed 01D to 01C (now Packager step)
- ✅ Added size selection persistence
- ✅ Fixed PDF page numbering
- ✅ Removed "Top" legacy folder nesting
- ✅ Auto-cleanup of duplicate STL files
- ✅ Security audit complete

**v0.9** (2026-09-11)
- Initial workflow phases complete
- 01A (Generator), 01B (Thumbnails), 01C (PDF), 01D (Packager)

---

## 📄 License & Attribution

Part of the **Stackables** modular 3D-printable container system by MindCubby.

Built with:
- Blender 4.x/5.x (GPL)
- Python 3.x
- PIL/Pillow (open-source)
- ReportLab (open-source)

## 🎮 Using the Orchestrator

When you open `run.blend`, you'll see the **Stackables Orchestrator** UI:

### Dashboard
- **Available Outputs**: Shows all generated Output folders (newest first)
- **Workflow Options**: Individual steps or full automation

### Individual Workflow Buttons
Each shows a **folder selection dialog** (choose which Output to process):

- **1A: Generate STLs** ✅ Working
  - Configure sizes, bottom type, wall texture
  - Generate single size or bulk (all 15 sizes)
  - Creates new Output folder with YYYYMMDD_HHMMSS timestamp

- **1B: Render Thumbnails** ✅ Working
  - Select Output folder from dialog
  - Renders color-coded PNGs for all variants
  - Auto-opens Finder to THUMBNAILS folder when done

- **1C: Generate PDF** ✅ Ready for Testing
  - Select Output folder from dialog
  - Reads thumbnails and PART_LIST_CATALOG.csv
  - Generates multi-page PDF catalog (landscape letter, 6-col grid)
  - Saves as `catalog.pdf` at root

- **1D: Package for Etsy** ✅ Ready for Testing
  - Select Output folder from dialog
  - Aligns and optimizes STLs (decimation for ≤20MB)
  - Creates ZIPs per variant in `Output/PACKAGED-ZIPS-CURRENT/`
  - Archives previous builds

### Full Workflow Button
- **▶ RUN FULL WORKFLOW (1A→1B→1C→1D)** ✅ Ready
  - No dialogs—runs all 4 steps sequentially
  - 1A generates Output, then 1B/1C/1D automatically use it
  - Perfect for batch runs: generate, render, catalog, and package

---

## 📝 Typical Workflow Examples

**Scenario 1: Run full pipeline (1A→1B→1C→1D)**

```
1. Open run.blend
   → Orchestrator UI appears

2. Click "▶ RUN FULL WORKFLOW (1A→1B→1C→1D)"
   → Starts 1A: Generate STLs
   → Configure in dialog (or accept defaults)
   → Generates Output folder
   
3. Automatically continues to 1B: Render Thumbnails
   → Renders color-coded PNGs
   → Finder opens to THUMBNAILS folder
   → Console shows progress
   
4. Automatically continues to 1C: Generate PDF
   → Reads thumbnails
   → Creates catalog.pdf at root
   → Console shows completion
   
5. Automatically continues to 1D: Package for Etsy
   → Optimizes STLs
   → Creates ZIPs in Output/PACKAGED-ZIPS-CURRENT/
   → Completes with summary

✓ Done! All outputs ready.
```

**Scenario 2: Run individual steps with folder selection**

```
1. Open run.blend
   → Orchestrator UI appears

2. Click "1A: Generate STLs"
   → Configure and generate new Output folder
   
3. Later, click "1B: Render Thumbnails"
   → Folder selection dialog appears
   → Pick from available Output folders
   → Renders thumbnails for that folder
   → Finder opens to result
   
4. Click "1C: Generate PDF"
   → Same Output folder auto-selected
   → PDF generated using same thumbnails
   
5. Click "1D: Package for Etsy"
   → Same Output folder used
   → Packages are created and ready

✓ Flexible—work on different outputs at your own pace.
```

---

## 🛠️ Technical Details

### Script Execution System
All scripts are executed directly from Python (no separate `.blend` files needed):

- `run.blend` → loads `Scripts/run.py` (orchestrator with UI buttons)
- Each button call → runs corresponding script via `exec()`:
  - Click "1A" → executes `Scripts/01A_GENERATOR.py`
  - Click "1B" → shows folder dialog, then executes `Scripts/01B_THUMBNAILS.py`
  - Click "1C" → shows folder dialog, then executes `Scripts/01C_PDF.py`
  - Click "1D" → shows folder dialog, then executes `Scripts/01D_PACKAGER.py`
- Scripts run in same Blender session (faster, no window switching)
- Each script receives selected Output folder as parameter via `SELECTED_OUTPUT_FOLDER`

**Result**: Responsive UI with instant execution and flexible folder targeting

### Path Resolution & Folder Selection
All scripts use **folder-aware execution**:
- Detect `run.blend`'s location (root directory)
- Scripts receive `SELECTED_OUTPUT_FOLDER` parameter when run from orchestrator
- If not provided, scripts auto-detect latest Output folder
- This enables:
  - Individual step execution (each script finds latest if not specified)
  - Full workflow execution (1A creates folder, 1B→1D automatically use it)
  - Historical processing (manually select older Output folder to reprocess)

**Result**: Portable AND flexible. Move the entire folder anywhere and it still works.

### Output Structure
Each run creates a timestamped folder (managed by folder selection system):

```
Output/
├── Output_20260911_144649/        ← Latest (auto-selected by default)
│   ├── PART_LIST_CATALOG.csv                 (created by 01A)
│   ├── 01_Stackable--Flat-Ribbed/           (created by 01A)
│   │   ├── Stackable--flat--ribbed--18mm.stl
│   │   └── ...
│   ├── 02_Stackable--Flat-Smooth/
│   ├── 03_Stackable--Tube-Ribbed/
│   ├── 04_Stackable--Tube-Smooth/
│   ├── THUMBNAILS/                           (created by 01B)
│   │   ├── 01_Stackable--Flat-Ribbed/
│   │   │   ├── Stackable--flat--ribbed--18mm.png
│   │   │   └── ...
│   │   ├── 02_Stackable--Flat-Smooth/
│   │   ├── 03_Stackable--Tube-Ribbed/
│   │   └── 04_Stackable--Tube-Smooth/
│   └── ALIGNED/                               (created by 01D)
│       ├── 01_Stackable--Flat-Ribbed/
│       ├── 02_Stackable--Flat-Smooth/
│       ├── 03_Stackable--Tube-Ribbed/
│       └── 04_Stackable--Tube-Smooth/
│
├── Output_20260911_143631/
└── Output_20260911_135122/        ← Older runs (available for reprocessing)

PACKAGED-ZIPS-CURRENT/                        (created by 01D)
├── 01_Stackable--Flat-Ribbed.zip
├── 02_Stackable--Flat-Smooth.zip
├── ...
└── report.txt

catalog.pdf                                   (created by 01C, at root)
```

**Folder Selection Feature**: Buttons show dropdown with all available Output folders—pick any to reprocess!

---

## ✅ Testing Status

### Phase 1A: STL Generator
- ✅ **COMPLETE & TESTED**
- Generates all 4 variants correctly
- PART_LIST_CATALOG.csv created
- Variant folders populated with STLs
- Output folder auto-created with timestamp

### Phase 1B: Thumbnail Renderer  
- ✅ **COMPLETE & TESTED**
- Folder selection dialog working
- Auto-detects Output folder and renders PNGs
- Finder opens to THUMBNAILS folder on completion
- 512×512 isometric renders with color-coding
- Issues fixed: Camera distance adjusted for taller stackables

### Phase 1C: PDF Catalog
- ✅ **IMPLEMENTATION COMPLETE**
- Ready for testing
- Folder selection dialog implemented
- Multi-page PDF generation code written
- 6-column grid layout configured

### Phase 1D: Etsy Packager
- ✅ **IMPLEMENTATION COMPLETE**
- Ready for testing
- Folder selection dialog implemented
- STL alignment and decimation code written
- ZIP creation and archival code implemented

### Full Workflow Orchestration
- ✅ **IMPLEMENTATION COMPLETE**
- Ready for testing
- Run all 4 steps sequentially without prompts
- Passes Output folder from 1A to 1B/1C/1D automatically

---

## 🔧 Configuration

### 01A Generator Settings
- **Saved in**: `.stackables_settings.json` (root folder)
- **Auto-loads** next time you open 01A
- Settings include: selected size, flat/tube preference, ribbed/smooth preference, bulk flag

### Render Settings (01B)
- **RESOLUTION**: 512×512 (configurable in 01B_THUMBNAILS.py)
- **SAMPLES**: 16 (fast, quality thumbnail)
- **ENGINE**: EEVEE (stable, fast)
- **COLORS**: Coded by texture+form (see COLORS dict)

---

## 📊 Status & Roadmap

| Phase | Status | Component | Notes |
|-------|--------|-----------|-------|
| 1 | ✅ Complete | Orchestrator UI | Auto-loads in run.blend |
| 1 | ✅ Complete | 01A Generator | Creates Output_YYYYMMDD_HHMMSS/ |
| 2 | 🔨 Ready | 01B Thumbnails | Script complete, integration coming |
| 2 | 🔨 Ready | 01C PDF | Script complete, integration coming |
| 3 | ⏳ Pending | 01D Packager | Script needs path updates |
| 3 | ⏳ Pending | Run Full Pipeline | Single-click end-to-end |

---

## 🐛 Troubleshooting

### "Cannot find PARTS folder"
- Ensure `Scripts/01A_PARTS/` exists with 4 STL files:
  - `1.bottom-foot--flat.stl`
  - `1.bottom-foot--tube.stl`
  - `2.middle-cylinder.stl`
  - `3.top-lip.stl`
  - `4.outside-rib-cutter.stl`

### "No Output folder found"
- Run 01A generator first to create an Output folder
- Check that Output/ directory exists in root

### Script doesn't auto-run when opening .blend
- Check that bootstrap code is in the .blend file's Text Editor
- See `Scripts/BOOTSTRAP_TEMPLATE.py` for the template
- Uncomment the appropriate line for that .blend file

### Thumbnails not rendering
- Check that latest Output folder exists
- Verify it contains the 4 variant folders with STLs
- Ensure 01B_THUMBNAILS.blend is in Scripts/ (same folder as .py)

---

## 📖 For Developers

### Adding a New Script
1. Create `Scripts/0XY_YOURSCRIPT.py`
2. Create `Scripts/0XY_YOURSCRIPT.blend` (empty is fine)
3. In the .blend's Text Editor, add bootstrap code:
   ```python
   import bpy
   import os
   
   def load_script(script_name):
       # (see BOOTSTRAP_TEMPLATE.py for full code)
       pass
   
   if __name__ == '__main__':
       load_script("0XY_YOURSCRIPT.py")
   ```
4. Add button to `Scripts/run.py` orchestrator
5. Update this README

### Updating Script Paths
All scripts should:
- Use `bpy.data.filepath` to detect blend location
- Navigate up one level if in Scripts/ subfolder
- Reference Output/ and Scripts/ relative to root

Example:
```python
def get_scripts_root():
    if bpy.data.filepath:
        blend_dir = os.path.dirname(os.path.abspath(bpy.data.filepath))
        if os.path.basename(blend_dir) == "Scripts":
            return os.path.dirname(blend_dir)
        return blend_dir
    return os.getcwd()
```

---

## 📞 Support

For issues or feature requests, check:
1. Troubleshooting section above
2. Script console output (Shift+F4 in Blender)
3. Check paths in .stackables_settings.json
4. Verify all dependencies exist (PARTS folder, Output folder)

---

**Built with ❤️ for 3D printing enthusiasts**
