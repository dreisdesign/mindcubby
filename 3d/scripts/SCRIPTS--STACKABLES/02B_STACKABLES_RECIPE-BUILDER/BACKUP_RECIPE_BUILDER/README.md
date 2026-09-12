# 🍰 Recipe Builder - STL Stack Assembly Tool

A native macOS application for assembling and stacking 3D STL models with real-time 3D previews.

## ⚡ Quick Start

### Launch the App
**The easiest way:** Copy the app to your Desktop and double-click it.

```bash
# Deploy to Desktop
cp -R macOS_APP/RecipeBuilder.app ~/Desktop/
```

Then simply **double-click `RecipeBuilder` on your Desktop**.

## 🎯 What It Does

### Hybrid Workflow: Template + Auto-Generated Scripts
1. **Choose save location** - Where to create your recipe folder
2. **Enter recipe name** - What to call it
3. **Template duplication** - App copies `_TEMPLATE_RECIPE_NAME_HERE` to your location
4. **Select & preview STL files** - Native file picker + 3D reorder UI
5. **Auto-generate RECIPE_SPECIFIC.py** - Creates recipe script with your ordered parts
6. **Assemble in Blender** - Combines models into single stack
7. **Export** - Combined STL saved to your recipe folder

### Result
Your recipe folder contains:
- `SCRIPTS/RECIPE_SPECIFIC.py` - Auto-generated script (editable for future runs)
- `SCRIPTS/ASSEMBLE_RECIPE.py` - Template engine (from template)
- `My Recipe--COMBINED.stl` - The assembled result
- Other template files (for reference)

## 📁 Project Structure

```
BLENDER_RECIPE-BUILDER/
├── macOS_APP/                          # 🚀 Deployed app (use this!)
│   ├── RecipeBuilder.app/              # ✅ Ready-to-use macOS app
│   ├── recipe_builder.py               # Main app source code
│   └── README.md                        # App-specific documentation
├── SCRIPTS/
│   └── ASSEMBLE_RECIPE.py              # Blender assembly engine
├── OFFICIAL_RECIPES/                   # Example recipe templates
├── _ARCHIVE/                           # Old versions (reference only)
├── templates/                          # HTML templates (legacy)
├── README.md                           # This file
└── RECIPE_BUILDER_SETUP.md             # Legacy setup guide

```

## 🔧 How It Works

### Architecture
- **Frontend**: Vanilla JavaScript + Three.js (no frameworks)
- **Backend**: Python 3 (system `/usr/bin/python3`)
- **Dialogs**: Native macOS osascript dialogs
- **3D Rendering**: Three.js with STL loader
- **Assembly**: Blender CLI

### Key Features
✅ **Hybrid Approach** - Template duplication + auto-generated recipe scripts  
✅ **User-Controlled Locations** - Save recipes anywhere on your Mac  
✅ **Auto-Generated RECIPE_SPECIFIC.py** - Preserve your exact stacking order  
✅ **Reusable Recipes** - Run RECIPE_SPECIFIC.py anytime to reassemble  
✅ **Native macOS Dialogs** - Looks and feels like a real macOS app  
✅ **Real-Time 3D Previews** - See your stack before assembly with Three.js  
✅ **Drag-and-Drop Reordering** - Intuitive stacking interface  
✅ **HTTP Server** - Local web preview (127.0.0.1:7654)  
✅ **Zero Dependencies** - Uses system Python and Blender  

## 📋 Requirements

- macOS 10.12+
- Blender 3.0+ (install via `brew install blender`)
- Python 3 (built into macOS)

## 💻 Running Directly (Advanced)

If you want to run the Python script directly:

```bash
cd /Users/danielreis/Documents/3D_PRINTING/MODELS/154.\ Stackables/BLENDER_RECIPE-BUILDER
python3 macOS_APP/recipe_builder.py
```

## 🖼️ The Reorder UI

When you select files, a browser window opens showing:
- **3D Preview Boxes** - Each file displays a real 3D rendering of its STL
- **Numbered Tiles** - Drag to reorder your stack
- **Confirm/Cancel** - Save your order or cancel

The previews use Three.js to render actual 3D geometry, giving you visual confirmation of each part before assembly.

## 🏗️ The Hybrid Approach: Template + Auto-Generated Scripts

### Why Two Methods?
The app supports **both** template-based and script-based workflows:

1. **Template Approach (Visual)**
   - Start fresh by duplicating a folder
   - Use the reorder UI with 3D previews
   - Auto-generates RECIPE_SPECIFIC.py for you

2. **Script Approach (Headless)**
   - Edit RECIPE_SPECIFIC.py directly
   - Run: `python3 RECIPE_SPECIFIC.py`
   - Reassemble anytime without the UI

### The Template Folder
`_TEMPLATE_RECIPE_NAME_HERE/` contains:
```
SCRIPTS/
├── RECIPE_SPECIFIC.py     # Gets auto-generated with your parts
├── ASSEMBLE_RECIPE.py     # Blender assembly engine
└── ... other template files
```

When you create a recipe, the app:
1. **Duplicates this template** to your chosen location
2. **Generates RECIPE_SPECIFIC.py** with your ordered part paths
3. **Runs Blender** using the duplicated template structure
4. **Exports** the combined STL to the recipe folder

### Result: Portable Recipes
Each recipe folder is **self-contained and repeatable**:
```bash
# Later, reassemble the same recipe anytime:
cd "My Recipe"
python3 SCRIPTS/RECIPE_SPECIFIC.py
```

This preserves your exact stacking order and makes recipes portable/editable.



## 🔄 Workflow Example

```
1. Launch RecipeBuilder.app
   ↓
2. Dialog: "Where should I save this recipe?"
   → Choose a folder (e.g., PRINT FILES/stls/)
   ↓
3. Dialog: "What should this recipe be called?"
   → Enter name (e.g., "My Recipe")
   ↓
4. Folder setup (automatic)
   → App creates "My Recipe" folder
   → Duplicates template structure
   → Opens in Finder
   ↓
5. File picker: "Select STL files to stack"
   → Choose multiple files in order
   ↓
6. Reorder UI (browser opens)
   → See 3D previews of each part
   → Drag to reorder
   → Click "Confirm Order"
   ↓
7. Auto-generation (background)
   → RECIPE_SPECIFIC.py created with your order
   ↓
8. Assembly (Blender runs silently)
   → Loads all parts
   → Assembles stack
   → Exports combined STL
   ↓
9. Success! ✓
   → Finder opens showing recipe folder
   → Contains: SCRIPTS/, COMBINED.stl, and other template files
   → Can run RECIPE_SPECIFIC.py manually anytime
```

### Key Points
- **Recipe location is yours to choose** - Save anywhere you want
- **Auto-generated RECIPE_SPECIFIC.py** - Preserves your exact part order and paths
- **Reusable** - Run `python3 RECIPE_SPECIFIC.py` anytime to reassemble
- **Editable** - Modify RECIPE_SPECIFIC.py to change order or parts for future runs

## 🐛 Troubleshooting

### "Blender not found" Error
Install Blender:
```bash
brew install blender
```

### App crashes on launch
Make sure Python 3 can execute:
```bash
which python3
```

### 3D Previews not showing
Check browser console (right-click → Inspect → Console). Verify:
- Three.js CDN loads (esm.sh)
- STL files are accessible at `http://127.0.0.1:7654/stl?file=...`

### Combined STL not created
Check the Blender output in the terminal:
```bash
python3 macOS_APP/recipe_builder.py  # Run from terminal to see logs
```
Look for "Using EXPORT_DIR:" to confirm the output path.

### Template folder not found
Ensure `_TEMPLATE_RECIPE_NAME_HERE/` exists in the BLENDER_RECIPE-BUILDER directory with:
```
SCRIPTS/
├── RECIPE_SPECIFIC.py
├── ASSEMBLE_RECIPE.py
└── ...
```

## 📚 File Reference

| File/Folder | Purpose |
|-------------|---------|
| `recipe_builder.py` | Main app orchestration (dialogs, workflow, HTTP server) |
| `_TEMPLATE_RECIPE_NAME_HERE/` | Template folder duplicated for each new recipe |
| `SCRIPTS/ASSEMBLE_RECIPE.py` | Blender assembly engine (loads STLs, stacks, exports) |
| `SCRIPTS/RECIPE_SPECIFIC.py` | Auto-generated per recipe (contains part order + paths) |
| `OFFICIAL_RECIPES/` | Example completed recipes for reference |
| `macOS_APP/` | App bundle (production-ready) |

## 🚀 Deployment

The app is deployed to both:
- **Source**: `macOS_APP/RecipeBuilder.app/Contents/Resources/recipe_builder.py`
- **Desktop**: `~/Desktop/RecipeBuilder.app/Contents/Resources/recipe_builder.py`

Both point to the same bundled code.

## 📝 Development

### To modify the app:
1. Edit `macOS_APP/recipe_builder.py`
2. Deploy with:
   ```bash
   cp macOS_APP/recipe_builder.py macOS_APP/RecipeBuilder.app/Contents/Resources/
   cp macOS_APP/recipe_builder.py ~/Desktop/RecipeBuilder.app/Contents/Resources/
   ```
3. Test: `python3 macOS_APP/recipe_builder.py`

### To modify the assembly logic:
1. Edit `SCRIPTS/ASSEMBLE_RECIPE.py`
2. Test with:
   ```bash
   cd "My Recipe"
   python3 SCRIPTS/RECIPE_SPECIFIC.py
   ```

### Key code sections in recipe_builder.py:
- **choose_recipe_folder()** (lines ~525-560): Folder selection + recipe naming
- **duplicate_template()** (lines ~562-585): Template folder duplication
- **generate_recipe_script()** (lines ~587-650): Auto-generates RECIPE_SPECIFIC.py
- **Workflow orchestration** (lines ~600+): Coordinates all steps
- **Native Dialogs** (lines ~70-150): osascript integration
- **HTTP Server** (lines ~430-550): STL file serving + reorder endpoint
- **HTML Generation** (lines ~127-300): Three.js UI creation

## 📄 License

Internal 3D printing tool for Stackables project.

---

**Questions?** Check the detailed docs in `macOS_APP/README.md` or examine `RECIPE_BUILDER_SETUP.md` for legacy information.
