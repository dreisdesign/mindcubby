import bpy
import os
import csv
import json
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime
from typing import ClassVar


def get_root_dir():
    if bpy.data.filepath:
        return os.path.dirname(os.path.abspath(bpy.data.filepath))
    return os.getcwd()


def get_scripts_dir():
    return os.path.join(get_root_dir(), "Scripts")


def get_available_output_folders():
    """Return list of available output folders (both naming formats), sorted by newest first"""
    output_parent = os.path.join(get_root_dir(), "Output")
    if not os.path.exists(output_parent):
        return []
    
    # Match both old format (Output_YYYYMMDD_HHMMSS) and new format (Stackables_AUTO--YYYY-MM-DD_HHMM-HHMMam/pm)
    folders = [
        d for d in os.listdir(output_parent)
        if (d.startswith('Output_') or d.startswith('Stackables_AUTO--')) and os.path.isdir(os.path.join(output_parent, d))
    ]
    return sorted(folders, reverse=True)  # Newest first


def run_script(script_name, output_folder=None, workflow_mode=False, continue_workflow=False):
    """Load and run a Python script"""
    scripts_dir = get_scripts_dir()
    script_path = os.path.join(scripts_dir, script_name)
    
    if not os.path.exists(script_path):
        print(f"ERROR: {script_path} not found")
        return False
    
    with open(script_path, 'r') as f:
        code = f.read()
    
    # Create namespace with optional output folder and reference to run module's globals
    namespace = {
        '__name__': '__main__', 
        '__file__': script_path, 
        'bpy': bpy, 
        'os': os,
        'SELECTED_OUTPUT_FOLDER': output_folder,
        'WORKFLOW_MODE': workflow_mode,  # Flag to run non-interactively
        'CONTINUE_WORKFLOW': continue_workflow,  # Flag to chain to next script
        '_RUN_MODULE_GLOBALS': globals()  # Pass reference to run.py's globals for 01A buttons
    }
    exec(code, namespace)
    return True


class OBJECT_OT_SelectOutputFolder(bpy.types.Operator):
    bl_idname = "object.stackables_select_output"
    bl_label = "Select Output Folder"
    
    output_folders: bpy.props.EnumProperty(
        items=lambda self, context: [
            (folder, folder, "") for folder in get_available_output_folders()
        ] or [("NONE", "No Output Folders Found", "")],
        description="Choose which Output folder to process"
    )
    
    def invoke(self, context, event):
        folders = get_available_output_folders()
        if not folders:
            self.report({'ERROR'}, "No Output folders found in Output/")
            return {'FINISHED'}
        return context.window_manager.invoke_props_dialog(self, width=600)
    
    def draw(self, context):
        layout = self.layout
        layout.label(text="Select Output Folder:", icon='FOLDER_REDIRECT')
        layout.prop(self, "output_folders", text="")
    
    def execute(self, context):
        global SELECTED_OUTPUT_FOLDER
        SELECTED_OUTPUT_FOLDER = self.output_folders
        print(f"\n✓ Selected Output Folder: {SELECTED_OUTPUT_FOLDER}")
        return {'FINISHED'}


class OBJECT_OT_StackablesOrchestrator(bpy.types.Operator):
    bl_idname = "object.stackables_orchestrator"
    bl_label = "Stackables"
    bl_options = {'REGISTER', 'UNDO'}

    def invoke(self, context, event):
        # Show as a simple dialog that closes after workflow is triggered
        return context.window_manager.invoke_props_dialog(self, width=500)

    def draw(self, context):
        layout = self.layout
        layout.label(text="STACKABLES WORKFLOW", icon='PLAY')
        layout.separator()
        layout.label(text="Click any step to continue:")
        layout.operator("object.stackables_run_01a", text="1A: Generate STLs", icon='MESH_CUBE')
        layout.operator("object.stackables_run_01b", text="1B: Thumbnails + PDF Catalog", icon='IMAGE')
        layout.operator("object.stackables_run_01c", text="1C: Package for Etsy", icon='PACKAGE')

    def execute(self, context):
        return {'FINISHED'}



class OBJECT_OT_Run01A(bpy.types.Operator):
    bl_idname = "object.stackables_run_01a"
    bl_label = "Run 01A"
    
    def execute(self, context):
        if run_script("01A_GENERATOR.py"):
            self.report({'INFO'}, "01A Generator opened")
        else:
            self.report({'ERROR'}, "Failed to load 01A_GENERATOR.py")
        return {'FINISHED'}


class OBJECT_OT_Run01B(bpy.types.Operator):
    bl_idname = "object.stackables_run_01b"
    bl_label = "Run 01B"
    
    selected_folder: bpy.props.EnumProperty(
        items=lambda self, context: [
            (folder, folder, "") for folder in get_available_output_folders()
        ] or [("NONE", "No Output Folders Found", "")],
        description="Select Output folder to process"
    )
    
    def invoke(self, context, event):
        folders = get_available_output_folders()
        if not folders:
            self.report({'ERROR'}, "No Output folders found in Output/")
            return {'FINISHED'}
        self.selected_folder = folders[0]  # Default to latest
        return context.window_manager.invoke_props_dialog(self, width=600)
    
    def draw(self, context):
        layout = self.layout
        layout.label(text="1B: Select Output Folder (Thumbnails + PDF)", icon='IMAGE')
        layout.prop(self, "selected_folder", text="")
    
    def execute(self, context):
        print(f"\n{'='*60}")
        print(f"01B: THUMBNAIL GENERATOR + PDF CATALOG")
        print(f"Processing Output Folder: {self.selected_folder}")
        print(f"{'='*60}\n")
        
        if run_script("01B_THUMBNAILS.py", self.selected_folder, continue_workflow=True):
            self.report({'INFO'}, "01B Thumbnails + PDF complete")
        else:
            self.report({'ERROR'}, "Failed to load 01B_THUMBNAILS.py")
        return {'FINISHED'}


class OBJECT_OT_Run01C(bpy.types.Operator):
    bl_idname = "object.stackables_run_01c"
    bl_label = "Run 01C"
    
    selected_folder: bpy.props.EnumProperty(
        items=lambda self, context: [
            (folder, folder, "") for folder in get_available_output_folders()
        ] or [("NONE", "No Output Folders Found", "")],
        description="Select Output folder to process"
    )
    
    def invoke(self, context, event):
        folders = get_available_output_folders()
        if not folders:
            self.report({'ERROR'}, "No Output folders found in Output/")
            return {'FINISHED'}
        self.selected_folder = folders[0]  # Default to latest
        return context.window_manager.invoke_props_dialog(self, width=600)
    
    def draw(self, context):
        layout = self.layout
        layout.label(text="1C: Select Output Folder", icon='PACKAGE')
        layout.prop(self, "selected_folder", text="")
    
    def execute(self, context):
        print(f"\n{'='*60}")
        print(f"01C: ETSY PACKAGER")
        print(f"Processing Output Folder: {self.selected_folder}")
        print(f"{'='*60}\n")
        
        if run_script("01C_PACKAGER.py", self.selected_folder):
            self.report({'INFO'}, "01C Packager loaded")
        else:
            self.report({'ERROR'}, "Failed to load 01C_PACKAGER.py")
        return {'FINISHED'}



# Helper operators for 01A size preset buttons
class OBJECT_OT_SelectAllSizes(bpy.types.Operator):
    """Select all sizes"""
    bl_idname = "object.stackables_select_all_sizes"
    bl_label = "Select All"
    bl_options = {'INTERNAL'}
    
    def execute(self, context):
        global CURRENT_OPERATOR_INSTANCE
        if CURRENT_OPERATOR_INSTANCE is not None:
            size_props = ['size_18', 'size_30', 'size_42', 'size_55', 'size_67',
                         'size_80', 'size_92', 'size_104', 'size_117', 'size_129',
                         'size_142', 'size_154', 'size_166', 'size_179', 'size_191']
            for prop in size_props:
                setattr(CURRENT_OPERATOR_INSTANCE, prop, True)
        return {'FINISHED'}


class OBJECT_OT_ClearAllSizes(bpy.types.Operator):
    """Clear all sizes"""
    bl_idname = "object.stackables_clear_all_sizes"
    bl_label = "Clear All"
    bl_options = {'INTERNAL'}
    
    def execute(self, context):
        global CURRENT_OPERATOR_INSTANCE
        if CURRENT_OPERATOR_INSTANCE is not None:
            size_props = ['size_18', 'size_30', 'size_42', 'size_55', 'size_67',
                         'size_80', 'size_92', 'size_104', 'size_117', 'size_129',
                         'size_142', 'size_154', 'size_166', 'size_179', 'size_191']
            for prop in size_props:
                setattr(CURRENT_OPERATOR_INSTANCE, prop, False)
        return {'FINISHED'}



# Load OBJECT_OT_GenerateStackableOptions from 01A_GENERATOR.py at startup
def _load_01a_operator():
    """Load the operator from 01A_GENERATOR.py so it can be called directly"""
    script_path = os.path.join(get_scripts_dir(), "01A_GENERATOR.py")
    if os.path.exists(script_path):
        with open(script_path, 'r') as f:
            code = f.read()
        namespace = {
            '__name__': '__main__', 
            '__file__': script_path, 
            'bpy': bpy, 
            'os': os,
            'csv': csv,
            'json': json,
            'shutil': shutil,
            'subprocess': subprocess,
            'tempfile': tempfile,
            'zipfile': zipfile,
            'datetime': datetime,
            'ClassVar': ClassVar,
            '_SKIP_INVOKE': True  # Prevent popup during startup
        }
        try:
            exec(code, namespace)
            return namespace.get('OBJECT_OT_GenerateStackableOptions')
        except Exception as e:
            print(f"Warning: Could not load OBJECT_OT_GenerateStackableOptions: {e}")
            import traceback
            traceback.print_exc()
    return None

GenerateStackableOptions = _load_01a_operator()

classes = [
    OBJECT_OT_SelectAllSizes,
    OBJECT_OT_ClearAllSizes,
    OBJECT_OT_StackablesOrchestrator,
    OBJECT_OT_Run01A,
    OBJECT_OT_Run01B,
    OBJECT_OT_Run01C,
]

if GenerateStackableOptions:
    classes.append(GenerateStackableOptions)

for cls in classes:
    try:
        bpy.utils.unregister_class(cls)
    except:
        pass
    bpy.utils.register_class(cls)

bpy.ops.object.stackables_orchestrator('INVOKE_DEFAULT')
