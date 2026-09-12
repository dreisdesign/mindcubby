import os

# ==============================================================================
# 1. RECIPE CONFIGURATION (EDIT THIS SECTION)
# ==============================================================================
# Name of your recipe - will be used for the file export folder and filename
RECIPE_NAME = "My_New_Recipe"

# "TOP_TO_BOTTOM": First entry is the Top, last is the Bottom.
# "BOTTOM_TO_TOP": First entry is the Bottom, last is the Top.
STACK_DIRECTION = "TOP_TO_BOTTOM"

# List your parts. Use JUST the filename (search is automatic).
# Key: XS=18.0mm, SM=30.4mm, MD=42.8mm, LG=55.2mm, XL=67.6mm, XXL=80.0mm
ASSEMBLY_PARTS = [
    "top--flat--02--sm-30.4mm--ribbed.stl",
    "middle--tube--01--xs-18.0mm--smooth.stl",
    "bottom--flat--02--sm-24.8mm--ribbed.stl",
]

# ==============================================================================
# 2. AUTOMATED RUNNER (DO NOT EDIT)
# ==============================================================================
BASE_ROOT = "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables"
ENGINE_PATH = os.path.join(BASE_ROOT, "BLENDER_RECIPE-BUILDER", "SCRIPTS", "ASSEMBLE_RECIPE.py")

def main():
    if not os.path.exists(ENGINE_PATH):
        print(f"Error: Engine not found at {ENGINE_PATH}")
        return
    
    # Auto-detect script location for output folder
    export_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in locals() else None
    
    with open(ENGINE_PATH, 'r') as f:
        exec(f.read(), {
            'RECIPE_NAME': RECIPE_NAME,
            'ASSEMBLY_PARTS': ASSEMBLY_PARTS,
            'STACK_DIRECTION': STACK_DIRECTION,
            'EXPORT_DIR': export_dir,
            '__name__': '__main__'
        })

if __name__ == "__main__":
    main()
