#!/usr/bin/env python3
"""
STL Centerer - macOS Native App
Centers 3D models on build plate (XY center, Z at bottom)
Pure native dialogs: file picker, confirmation
"""

import subprocess
import os
import sys
import traceback
from pathlib import Path
from datetime import datetime


class STLCenterer:
    def __init__(self):
        self.log_file = Path.home() / "stl_centerer.log"
    
    def log(self, message):
        """Write to log file and print"""
        with open(self.log_file, "a") as f:
            f.write(f"[{datetime.now()}] {message}\n")
        print(message)
    
    def osascript(self, script):
        """Run AppleScript via osascript"""
        try:
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True, text=True, timeout=120
            )
            return result.stdout.strip(), result.returncode
        except subprocess.TimeoutExpired:
            self.log(f"osascript timeout (>120s)")
            return "", 1
        except Exception as e:
            self.log(f"osascript error: {e}")
            return "", 1
    
    def show_alert(self, title, message, style="informational"):
        """Show native macOS alert"""
        try:
            self.log(f"Showing alert: {title}")
            script = f'display alert "{title}" message "{message}" as {style}'
            self.osascript(script)
        except Exception as e:
            self.log(f"show_alert error: {e}")
    
    def choose_files(self, message="Select STL files to center"):
        """Show native macOS file picker with multiple selection"""
        try:
            # No file type filter - let user select any files
            script = f'choose file with prompt "{message}" with multiple selections allowed'
            output, code = self.osascript(script)
            if code != 0:
                self.log(f"File picker cancelled: code {code}")
                return None
            
            self.log(f"File picker output (raw): {repr(output[:200])}")
            
            if output:
                files = []
                # Output format: "alias Macintosh HD:path:to:file, alias Macintosh HD:path:to:file2"
                # Split on ", alias " to get individual entries
                for part in output.split(", alias "):
                    part = part.strip()
                    self.log(f"Processing part (first 100 chars): {repr(part[:100])}")
                    
                    # Remove "alias " prefix if present
                    if part.startswith("alias "):
                        part = part[6:]
                    
                    # Convert HFS+ path (Macintosh HD:path:to:file) to POSIX path (/path/to/file)
                    if part.startswith("Macintosh HD:"):
                        # Replace "Macintosh HD:" with "/" and convert colons to slashes
                        posix_path = "/" + part[13:].replace(":", "/")
                        files.append(posix_path)
                        self.log(f"  Converted: {Path(posix_path).name}")
                    else:
                        self.log(f"  Skipping non-HFS path: {part[:50]}")
                
                self.log(f"Parsed {len(files)} files: {[Path(f).name for f in files]}")
                return files if files else None
            return None
        except Exception as e:
            self.log(f"choose_files error: {e}\n{traceback.format_exc()}")
            return None
    
    def confirm_replace(self, filepath, skip_remaining=False):
        """Show native macOS confirmation dialog for file replacement"""
        try:
            # If skip_remaining is True, automatically replace without asking
            if skip_remaining:
                self.log(f"Auto-replacing {Path(filepath).name} (Replace All mode)")
                return "replace"
            
            filename = Path(filepath).name
            script = f'display dialog "Replace \\"{filename}\\"?" buttons {{"Cancel", "Replace", "Replace All"}} default button "Replace" with icon caution'
            output, code = self.osascript(script)
            
            self.log(f"Confirm replace result: code {code}, output: {output}")
            
            # Parse which button was clicked
            if "button returned:Replace All" in output:
                return "replace_all"
            elif "button returned:Replace" in output or code == 0:
                return "replace"
            else:
                return "cancel"
        except Exception as e:
            self.log(f"confirm_replace error: {e}")
            return "cancel"
    
    def center_stl_on_buildplate(self, input_path, output_path):
        """
        Center STL on build plate using Blender
        XY center, Z at bottom
        """
        try:
            blender_script = f'''
import bpy
import bmesh
from mathutils import Vector

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import STL
bpy.ops.wm.stl_import(filepath=r'{input_path}')
obj = bpy.context.selected_objects[0]

# Get bounding box
bbox_corners = [Vector(corner) for corner in obj.bound_box]
min_x = min(corner.x for corner in bbox_corners)
max_x = max(corner.x for corner in bbox_corners)
min_y = min(corner.y for corner in bbox_corners)
max_y = max(corner.y for corner in bbox_corners)
min_z = min(corner.z for corner in bbox_corners)

# Calculate center offset
center_x = (min_x + max_x) / 2
center_y = (min_y + max_y) / 2
z_offset = -min_z  # Move Z to 0 (bottom of model at build plate)

# Apply translation
obj.location.x -= center_x
obj.location.y -= center_y
obj.location.z += z_offset

# Apply transforms
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.transform_apply(location=True)

# Export centered STL
bpy.ops.wm.stl_export(filepath=r'{output_path}', export_selected_objects=True)
'''
            
            result = subprocess.run(
                ["/Applications/Blender.app/Contents/MacOS/blender", "--background", "--python-expr", blender_script],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            self.log(f"Blender return code: {result.returncode}")
            if result.stderr:
                self.log(f"Blender stderr: {result.stderr[:500]}")
            
            if result.returncode == 0:
                return True, "Centered successfully"
            else:
                return False, result.stderr if result.stderr else "Blender error"
        except Exception as e:
            self.log(f"center_stl_on_buildplate error: {e}\n{traceback.format_exc()}")
            return False, str(e)
    
    def run(self):
        """Main workflow"""
        try:
            self.log("=== STL Centerer started ===")
            
            # Check if Blender exists
            if not Path("/Applications/Blender.app/Contents/MacOS/blender").exists():
                self.log("❌ Blender not found")
                self.show_alert("Blender Not Found", "Please install Blender:\nbrew install blender", "critical")
                return
            
            # Get files from user
            files = self.choose_files()
            if not files:
                self.log("No files selected")
                return
            
            self.log(f"Processing {len(files)} file(s)")
            
            success_count = 0
            failed_count = 0
            replace_all_mode = False
            
            for filepath in files:
                filepath_obj = Path(filepath)
                
                if not filepath_obj.exists():
                    self.log(f"❌ {filepath_obj.name} - File not found")
                    failed_count += 1
                    continue
                
                # Show confirmation dialog (unless in replace_all mode)
                action = self.confirm_replace(filepath, skip_remaining=replace_all_mode)
                
                if action == "cancel":
                    self.log(f"⊘ {filepath_obj.name} - Skipped by user")
                    continue
                elif action == "replace_all":
                    replace_all_mode = True
                    self.log(f"🔄 Replace All mode enabled")
                
                # Center the STL
                self.log(f"⧖ Centering {filepath_obj.name}...")
                success, message = self.center_stl_on_buildplate(filepath, filepath)
                
                if success:
                    self.log(f"✓ {filepath_obj.name}")
                    success_count += 1
                else:
                    self.log(f"❌ {filepath_obj.name} - {message}")
                    failed_count += 1
            
            # Summary
            summary = f"Centered: {success_count}"
            if failed_count > 0:
                summary += f"\nFailed: {failed_count}"
            
            self.log("=" * 40)
            self.log(summary)
            self.log("=" * 40)
            
            self.show_alert("Centering Complete", summary, "informational")
            
        except Exception as e:
            self.log(f"run error: {e}\n{traceback.format_exc()}")
            self.show_alert("Error", str(e), "critical")


if __name__ == "__main__":
    app = STLCenterer()
    app.run()
