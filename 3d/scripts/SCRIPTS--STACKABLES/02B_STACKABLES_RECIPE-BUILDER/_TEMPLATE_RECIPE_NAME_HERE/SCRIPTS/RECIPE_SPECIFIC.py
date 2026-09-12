import bpy
import os

# ==============================================================================
# 1. RECIPE CONFIGURATION (EDIT THIS SECTION)
# ==============================================================================
# Name of your recipe - will be used for the file export name
RECIPE_NAME = "NEW_RECIPE_NAME"

# How are you listing the parts? 
# "TOP_TO_BOTTOM": First entry is the Top, last is the Bottom.
# "BOTTOM_TO_TOP": First entry is the Bottom, last is the Top.
STACK_DIRECTION = "TOP_TO_BOTTOM"

# List your parts. 
# You can now use JUST the filename (e.g. "top--flat--01--xs--ribbed.stl")
# The script will search your ALIGNED-STLS folder automatically.
ASSEMBLY_PARTS = [
    "top--flat--01--xs--ribbed.stl",
    "middle--flat--01--xs--ribbed.stl",
    "bottom--flat--01--xs--ribbed.stl",
]

# ==============================================================================
# 2. SCRIPT RUNNER (DO NOT EDIT BELOW THIS LINE)
# ==============================================================================
BASE_ROOT = "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables"
ENGINE_PATH = os.path.join(BASE_ROOT, "RECIPE_Builder", "CORE_SCRIPT", "ASSEMBLE_RECIPE.py")

def run_recipe():
    if os.path.exists(ENGINE_PATH):
        # Auto-detect current directory for local export
        export_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in locals() else None
        
        globals_dict = {
            'RECIPE_NAME': RECIPE_NAME,
            'ASSEMBLY_PARTS': ASSEMBLY_PARTS,
            'STACK_DIRECTION': STACK_DIRECTION,
            'EXPORT_DIR': export_dir,
            '__name__': '__main__'
        }
        with open(ENGINE_PATH, 'r') as f:
            exec(f.read(), globals_dict)
    else:
        print(f"Error: Engine not found at {ENGINE_PATH}")

if __name__ == "__main__":
    run_recipe()
