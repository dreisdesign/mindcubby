# 🖱️ Recipe Builder - How to Create a Clickable Icon

## Option 1: Quick Launch (Test First)

Run this in Terminal to test the UI:
```bash
python3 "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables/BLENDER_RECIPE-BUILDER/RECIPE_BUILDER_UI.py"
```

---

## Option 2: Automator App (Recommended - Clickable Icon)

### Steps:
1. **Open Automator.app** (Applications → Automator)
2. **Create New → Application**
3. **Search for "Shell Script"** in the left panel
4. **Drag "Run Shell Script" into the workflow**
5. **Paste this code:**

```bash
python3 "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables/BLENDER_RECIPE-BUILDER/RECIPE_BUILDER_UI.py"
```

6. **Set "Pass input" to: as arguments**
7. **File → Save** 
   - Name: `Recipe Builder`
   - Format: Application
   - Location: Applications folder or Desktop

### Result:
A clickable app icon that launches the Recipe Builder UI!

---

## Option 3: Shortcut/Alias on Desktop

Quick desktop access without full app:

```bash
# Create a launcher alias on Desktop
ln -s "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables/BLENDER_RECIPE-BUILDER/RECIPE_BUILDER_UI.py" ~/Desktop/Recipe\ Builder.py
```

---

## Using the Recipe Builder UI

1. **Enter Recipe Name** - e.g., "Burger_Stack" or "Pen_Holder"
2. **Select Stack Direction** - Choose if first item is Top or Bottom
3. **Add Parts** - Select STLs from the list and click "Add Selected"
4. **Order Parts** - Use Move Up/Down to arrange the stack
5. **Save Recipe** - Saves a Python config file (optional)
6. **Build with Blender** - Runs the assembly and exports STLs

---

## Features

✅ Browse all available STL files  
✅ Drag parts into order  
✅ Save recipes for later  
✅ Launch Blender builds directly  
✅ No manual Python editing needed!
