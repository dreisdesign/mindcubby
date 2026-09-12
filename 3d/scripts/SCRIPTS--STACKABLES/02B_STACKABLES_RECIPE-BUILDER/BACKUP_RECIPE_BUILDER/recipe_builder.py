#!/usr/bin/env python3
"""
Recipe Builder - macOS Native App
Pure native dialogs: file picker, folder picker, save dialog
With web-based drag-and-drop reordering
"""

import subprocess
import json
import os
import sys
import traceback
import time
from pathlib import Path
from datetime import datetime

class RecipeBuilder:
    def __init__(self):
        self.base_root = Path("/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables")
        self.blender_script = self.base_root / "BLENDER_RECIPE-BUILDER" / "SCRIPTS" / "ASSEMBLE_RECIPE.py"
        self.log_file = Path.home() / "recipe_builder.log"
    
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
    
    def prompt_text(self, message, default=""):
        """Show native macOS text input dialog"""
        try:
            script = f'display dialog "{message}" default answer "{default}" buttons {{"Cancel", "OK"}} default button "OK"'
            output, code = self.osascript(script)
            if code != 0:
                self.log(f"Dialog cancelled or failed: code {code}")
                return None
            # Extract the text from "text returned:" line
            if "text returned:" in output:
                text = output.split("text returned:")[1].strip()
                self.log(f"User entered text (length {len(text)})")
                return text
            self.log(f"Unexpected output format: {output}")
            return None
        except Exception as e:
            self.log(f"prompt_text error: {e}\n{traceback.format_exc()}")
            return None
    
    def show_alert(self, title, message, style="informational"):
        """Show native macOS alert"""
        try:
            self.log(f"Showing alert: {title}")
            script = f'display alert "{title}" message "{message}" as {style}'
            self.osascript(script)
        except Exception as e:
            self.log(f"show_alert error: {e}")
    
    def prompt_choice(self, message, choices):
        """Show native macOS choice dialog"""
        try:
            choices_str = ", ".join([f'"{c}"' for c in choices])
            script = f'choose from list {{{choices_str}}} with prompt "{message}"'
            output, code = self.osascript(script)
            if code != 0 or output == "":
                self.log(f"Choice cancelled: code {code}")
                return None
            self.log(f"User chose: {output}")
            return output
        except Exception as e:
            self.log(f"prompt_choice error: {e}\n{traceback.format_exc()}")
            return None
    
    def choose_files(self, message="Select STL files"):
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
    
    def create_reorder_html(self, files):
        """Create HTML for drag-and-drop reordering with Three.js STL previews"""
        import urllib.parse
        
        file_details = []
        for f in files:
            path_obj = Path(f)
            name = path_obj.name
            stl_url = "http://127.0.0.1:7654/stl?file=" + urllib.parse.quote(str(f))
            file_details.append({"name": name, "stl_url": stl_url})

        html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reorder STL Files</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f5f5f7; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        .header { padding: 20px 30px; background: white; border-bottom: 1px solid #d5d5d7; flex-shrink: 0; }
        .header h1 { font-size: 20px; color: #1d1d1f; }
        .header p { font-size: 13px; color: #86868b; }
        .main-content { flex: 1; overflow-y: auto; padding: 20px 30px; }
        .container { width: 100%; max-width: 500px; margin: 0 auto; }
        #list { list-style: none; }
        .item { background: white; border: 1px solid #d5d5d7; border-radius: 12px; cursor: move; transition: all 0.2s; overflow: hidden; display: flex; align-items: center; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .item:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.08); border-color: #a0a0a0; }
        .item.dragging { opacity: 0.5; transform: scale(0.98); background: #f0f8ff; }
        .item.drag-over { border: 2px dashed #0071e3; background: rgba(0, 113, 227, 0.05); }
        .preview-box { width: 100px; height: 100px; flex-shrink: 0; background: #fafafc; display: flex; align-items: center; justify-content: center; overflow: hidden; border-right: 1px solid #f0f0f2; position: relative; }
        .preview-box canvas { width: 100%; height: 100%; }
        .info-box { padding: 12px 16px; display: flex; align-items: center; gap: 16px; flex: 1; }
        .number-badge { width: 28px; height: 28px; background: #0071e3; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0; }
        .filename { font-size: 13px; color: #1d1d1f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .footer { padding: 20px 30px; background: white; border-top: 1px solid #d5d5d7; display: flex; justify-content: center; gap: 16px; flex-shrink: 0; }
        button { padding: 10px 32px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        #doneBtn { background: #0071e3; color: white; }
        #doneBtn:hover { transform: scale(1.02); background: #0077ed; }
        #cancelBtn { background: #f5f5f7; color: #1d1d1f; border: 1px solid #d5d5d7; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Stack Sequence</h1>
        <p>Drag tiles to set the order (Top → Bottom)</p>
    </div>
    <div class="main-content">
        <div class="container">
            <ul id="list"></ul>
        </div>
    </div>
    <div class="footer">
        <button id="cancelBtn">Cancel</button>
        <button id="doneBtn">Confirm Order</button>
    </div>
    <script type="module">
        import * as THREE from 'https://esm.sh/three@r128';
        import { STLLoader } from 'https://esm.sh/three@r128/examples/jsm/loaders/STLLoader.js';
        
        const fileData = """ + json.dumps(file_details) + """;
        const list = document.getElementById('list');
        let draggedItem = null;
        
        function setupPreview(canvas, stlUrl) {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
            renderer.setSize(width, height);
            renderer.setClearColor(0xfafafc);
            
            const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
            light1.position.set(5, 10, 5);
            scene.add(light1);
            const light2 = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(light2);
            camera.position.z = 100;
            
            const loader = new STLLoader();
            loader.load(stlUrl, (geometry) => {
                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                const size = new THREE.Vector3();
                bbox.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 50 / maxDim;
                geometry.scale(scale, scale, scale);
                geometry.center();
                
                const material = new THREE.MeshPhongMaterial({color: 0xcccccc});
                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);
                mesh.rotation.x = -Math.PI / 4;
                mesh.rotation.z = Math.PI / 6;
                renderer.render(scene, camera);
            });
        }
        
        fileData.forEach((file, index) => {
            const item = document.createElement('li');
            item.className = 'item';
            item.draggable = true;
            item.innerHTML = `<div class="preview-box"><canvas id="canvas-${index}"></canvas></div><div class="info-box"><div class="number-badge">${index + 1}</div><div class="filename">${file.name}</div></div>`;
            list.appendChild(item);
            setTimeout(() => {setupPreview(document.getElementById('canvas-' + index), file.stl_url);}, 0);
        });

        document.addEventListener('dragstart', (e) => {
            const target = e.target.closest('.item');
            if (target) {
                draggedItem = target;
                draggedItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        document.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
                document.querySelectorAll('.item').forEach(item => item.classList.remove('drag-over'));
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const item = e.target.closest('.item');
            if (item && draggedItem && item !== draggedItem) {
                document.querySelectorAll('.item').forEach(i => i.classList.remove('drag-over'));
                item.classList.add('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const item = e.target.closest('.item');
            if (item && draggedItem && item !== draggedItem) {
                const allItems = Array.from(list.children);
                const draggedIndex = allItems.indexOf(draggedItem);
                const targetIndex = allItems.indexOf(item);
                if (draggedIndex < targetIndex) {
                    list.insertBefore(draggedItem, item.nextSibling);
                } else {
                    list.insertBefore(draggedItem, item);
                }
                Array.from(list.children).forEach((itm, idx) => {
                    itm.querySelector('.number-badge').textContent = idx + 1;
                });
            }
            document.querySelectorAll('.item').forEach(i => i.classList.remove('drag-over'));
        });

        document.getElementById('doneBtn').addEventListener('click', () => {
            const order = Array.from(list.children).map(item => item.querySelector('.filename').textContent);
            fetch('http://127.0.0.1:7654/reorder-done', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({order: order})
            }).then(r => {
                if (r.ok) {setTimeout(() => window.close(), 200);}
                else {alert('Server error: ' + r.status);}
            }).catch(err => {alert('Connection error: ' + err);});
        });

        document.getElementById('cancelBtn').addEventListener('click', () => window.close());
    </script>
</body>
</html>"""
        return html
    
    def reorder_files_via_web(self, files):
        """Open drag-and-drop reorder UI with local HTTP server"""
        try:
            import threading
            from http.server import HTTPServer, BaseHTTPRequestHandler
            
            result_holder = {'order': None}
            
            class ReorderHandler(BaseHTTPRequestHandler):
                def do_OPTIONS(self):
                    """Handle CORS preflight"""
                    self.send_response(200)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                    self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                    self.end_headers()
                
                def do_POST(self):
                    print(f"\n[SERVER] POST received from {self.client_address[0]}:{self.client_address[1]}")
                    print(f"[SERVER] Path: {self.path}")
                    print(f"[SERVER] Headers: {dict(self.headers)}")
                    
                    if self.path == '/reorder-done':
                        content_length = int(self.headers.get('Content-Length', 0))
                        print(f"[SERVER] Content-Length: {content_length}")
                        
                        body = self.rfile.read(content_length).decode('utf-8')
                        print(f"[SERVER] Body received: {body[:200]}")
                        
                        try:
                            data = json.loads(body)
                            result_holder['order'] = data.get('order', [])
                            print(f"[SERVER] ✓ Parsed {len(result_holder['order'])} files")
                            
                            # Send response with CORS headers
                            self.send_response(200)
                            self.send_header('Content-Type', 'application/json')
                            self.send_header('Access-Control-Allow-Origin', '*')
                            self.end_headers()
                            self.wfile.write(b'{"status": "ok"}')
                            print("[SERVER] ✓ Response sent\n")
                        except Exception as e:
                            print(f"[SERVER] ✗ Error parsing JSON: {e}")
                            self.send_response(400)
                            self.send_header('Access-Control-Allow-Origin', '*')
                            self.end_headers()
                    else:
                        self.send_response(404)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                
                def do_GET(self):
                    print(f"[SERVER] GET {self.path}")
                    
                    # Serve STL files for Three.js
                    if self.path.startswith('/stl?file='):
                        file_path = self.path[10:] # Strip /stl?file=
                        # Security: only allow files ending in .stl
                        if file_path.endswith('.stl'):
                            try:
                                # URL decode the path
                                import urllib.parse
                                file_path = urllib.parse.unquote(file_path)
                                
                                if Path(file_path).exists() and file_path.endswith('.stl'):
                                    with open(file_path, 'rb') as f:
                                        self.send_response(200)
                                        self.send_header('Content-Type', 'application/octet-stream')
                                        self.send_header('Access-Control-Allow-Origin', '*')
                                        self.end_headers()
                                        self.wfile.write(f.read())
                                    return
                            except Exception as e:
                                print(f"[SERVER] ✗ Error reading STL: {e}")
                    
                    self.send_response(404)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                
                def log_message(self, format, *args):
                    pass  # Suppress default server logs
            
            # Start server on 127.0.0.1 (more reliable than localhost)
            print("[APP] Starting HTTP server on 127.0.0.1:7654...")
            self.log("Starting HTTP server on 127.0.0.1:7654...")
            server = HTTPServer(('127.0.0.1', 7654), ReorderHandler)
            server_thread = threading.Thread(target=server.serve_forever, daemon=True)
            server_thread.daemon = True
            server_thread.start()
            print("[APP] ✓ HTTP server listening")
            self.log("✓ HTTP server listening on 127.0.0.1:7654")
            
            # Create HTML
            try:
                html_content = self.create_reorder_html(files)
            except Exception as e:
                self.log(f"Error creating HTML: {e}\n{traceback.format_exc()}")
                print(f"[APP] ✗ Error creating HTML: {e}")
                return files
            
            html_path = Path("/tmp/reorder.html")
            try:
                with open(html_path, "w") as f:
                    f.write(html_content)
            except Exception as e:
                self.log(f"Error writing HTML file: {e}")
                print(f"[APP] ✗ Error writing HTML file: {e}")
                return files
            
            self.log(f"Created reorder HTML at {html_path}")
            print(f"[APP] Opening {html_path} in browser...")
            print(f"[APP] HTML file size: {html_path.stat().st_size} bytes")
            
            # Open in browser with a small delay to ensure file is written
            time.sleep(0.2)
            result = subprocess.run(["open", str(html_path)], capture_output=True, text=True)
            if result.returncode != 0:
                self.log(f"Failed to open browser: {result.stderr}")
                print(f"[APP] ✗ Failed to open browser: {result.stderr}")
            else:
                print(f"[APP] ✓ Browser opened")
            
            # Wait for result with timeout
            max_wait = 120  # 2 minutes
            start_time = time.time()
            poll_count = 0
            
            while time.time() - start_time < max_wait:
                if result_holder['order'] is not None:
                    order = result_holder['order']
                    self.log(f"Reorder received: {order}")
                    
                    # Map filenames back to full paths
                    name_to_path = {Path(f).name: f for f in files}
                    reordered = [name_to_path[name] for name in order if name in name_to_path]
                    
                    self.log(f"Reorder result: {[Path(f).name for f in reordered]}")
                    print(f"[APP] ✓ Got reorder: {[Path(f).name for f in reordered]}\n")
                    
                    # Cleanup
                    try:
                        server.shutdown()
                    except:
                        pass
                    try:
                        html_path.unlink()
                    except:
                        pass
                    return reordered
                
                poll_count += 1
                time.sleep(0.1)
            
            print("[APP] ✗ Reorder timeout - using original order\n")
            self.log("Reorder timeout - using original order")
            try:
                server.shutdown()
            except:
                pass
            return files
            
        except Exception as e:
            print(f"[APP] ✗ Error: {e}\n")
            self.log(f"reorder_files_via_web error: {e}\n{traceback.format_exc()}")
            return files
    
    
    def _convert_hfs_to_posix(self, hfs_path):
        """Convert HFS+ path to POSIX path"""
        hfs_path = hfs_path.strip()
        
        # Handle file:// URLs
        if hfs_path.startswith("file://"):
            return hfs_path.replace("file://", "").replace("%20", " ")
        
        # Strip 'alias ' or 'file ' prefix
        if hfs_path.startswith('alias '):
            hfs_path = hfs_path[6:].strip()
        elif hfs_path.startswith('file '):
            hfs_path = hfs_path[5:].strip()
        
        # Strip trailing colon
        hfs_path = hfs_path.rstrip(':')
        
        # Replace "Macintosh HD:" with "/" and convert colons to slashes
        if hfs_path.startswith('Macintosh HD:'):
            hfs_path = hfs_path[len('Macintosh HD:'):]
        
        # Replace remaining colons with slashes
        posix_path = '/' + hfs_path.replace(':', '/')
        return posix_path
    
    def choose_folder(self, message="Choose a folder"):
        """Show native macOS folder picker"""
        try:
            script = f'choose folder with prompt "{message}"'
            output, code = self.osascript(script)
            if code != 0:
                self.log(f"Folder picker cancelled: code {code}")
                return None
            # Convert HFS+ or file:// format to POSIX
            path = self._convert_hfs_to_posix(output)
            self.log(f"User chose folder: {path}")
            return path
        except Exception as e:
            self.log(f"choose_folder error: {e}\n{traceback.format_exc()}")
            return None
    
    def choose_filename(self, message="Save as:", default_name=""):
        """Show native macOS save filename dialog"""
        try:
            # Sanitize default name for AppleScript
            default_name = default_name.replace('"', '\\"')
            script = f'choose file name with prompt "{message}" default name "{default_name}"'
            output, code = self.osascript(script)
            if code != 0:
                self.log(f"Save dialog cancelled: code {code}")
                return None
            
            # Convert HFS+ or file:// format to POSIX
            path = self._convert_hfs_to_posix(output)
            self.log(f"User chose filename: {path}")
            return path
        except Exception as e:
            self.log(f"choose_filename error: {e}\n{traceback.format_exc()}")
            return None
    
    def choose_recipe_folder(self):
        """Choose where to create the recipe folder, then prompt for recipe name"""
        try:
            # Step 1: Choose the parent folder where recipe will be created
            script = 'choose folder with prompt "Where should I save this recipe?"'
            output, code = self.osascript(script)
            if code != 0:
                self.log("Folder selection cancelled")
                return None
            
            # Convert HFS+ path to POSIX
            if output.startswith("alias "):
                output = output[6:]
            if output.startswith("Macintosh HD:"):
                posix_path = "/" + output[13:].replace(":", "/")
            else:
                posix_path = output.replace(":", "/")
            
            parent_folder = Path(posix_path)
            self.log(f"Parent folder: {parent_folder}")
            
            # Step 2: Ask for recipe name
            recipe_name = self.prompt_text("What should this recipe be called?", "My Recipe")
            if not recipe_name:
                self.log("Recipe name cancelled")
                return None
            
            # Create the recipe folder path (but don't create it yet - duplicate_template will do that)
            recipe_folder = parent_folder / recipe_name
            self.log(f"Recipe folder will be: {recipe_folder}")
            self.log(f"Recipe name: {recipe_name}")
            return recipe_folder, recipe_name
        except Exception as e:
            self.log(f"choose_recipe_folder error: {e}")
            return None
    
    def duplicate_template(self, target_folder):
        """Create recipe folder (no longer duplicates template)"""
        try:
            self.log(f"Creating recipe folder: {target_folder}")
            
            # Create parent if needed
            target_folder.parent.mkdir(parents=True, exist_ok=True)
            
            # Create recipe folder if it doesn't exist
            target_folder.mkdir(exist_ok=True)
            
            self.log(f"Recipe folder created successfully")
            return True
        except Exception as e:
            self.log(f"create_recipe_folder error: {e}\n{traceback.format_exc()}")
            return False
    
    def generate_recipe_script(self, recipe_folder, stl_files, recipe_name):
        """Generate recipe script with ordered STL file paths"""
        try:
            # Use full paths so files can be found regardless of location
            part_names = [str(f) for f in stl_files]
            
            # Create recipe script content
            parts_list = ",\n".join([f'    "{name}"' for name in part_names])
            
            script_content = f'''import os

# Generated by Recipe Builder - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
# Recipe: {recipe_name}

# ==============================================================================
# 1. RECIPE CONFIGURATION
# ==============================================================================
# Recipe name
RECIPE_NAME = "{recipe_name}"

# Stack direction: "TOP_TO_BOTTOM" or "BOTTOM_TO_TOP"
STACK_DIRECTION = "TOP_TO_BOTTOM"

# Parts in order (full paths)
ASSEMBLY_PARTS = [
{parts_list}
]

# ==============================================================================
# 2. AUTOMATED RUNNER (DO NOT EDIT)
# ==============================================================================
BASE_ROOT = "/Users/danielreis/Documents/3D_PRINTING/MODELS/154. Stackables"
ENGINE_PATH = os.path.join(BASE_ROOT, "BLENDER_RECIPE-BUILDER", "SCRIPTS", "ASSEMBLE_RECIPE.py")

def main():
    if not os.path.exists(ENGINE_PATH):
        print(f"Error: Engine not found at {{ENGINE_PATH}}")
        return
    
    # Auto-detect script location for output folder
    export_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in locals() else None
    
    with open(ENGINE_PATH, 'r') as f:
        exec(f.read(), {{
            'RECIPE_NAME': RECIPE_NAME,
            'ASSEMBLY_PARTS': ASSEMBLY_PARTS,
            'STACK_DIRECTION': STACK_DIRECTION,
            'EXPORT_DIR': export_dir,
            '__name__': '__main__'
        }})

if __name__ == "__main__":
    main()
'''
            
            # Save directly in recipe folder with recipe name
            script_path = recipe_folder / f"{recipe_name}--STACKABLES-RECIPE.py"
            
            with open(script_path, 'w') as f:
                f.write(script_content)
            
            self.log(f"Generated {script_path}")
            return True
        except Exception as e:
            self.log(f"generate_recipe_script error: {e}\n{traceback.format_exc()}")
            return False
    
    def run(self):
        """Main workflow - hybrid: template + UI + auto-generation"""
        try:
            self.log("\n=== Recipe Builder Started ===")
            self.log(f"Log file: {self.log_file}")
            
            # Step 0: Choose recipe folder (folder name = recipe name)
            self.log("Step 0: Choosing recipe location...")
            result = self.choose_recipe_folder()
            if not result:
                self.log("Step 0: No folder chosen, exiting")
                return
            recipe_folder, recipe_name = result
            
            # Step 0b: Create recipe folder
            self.log("Step 0b: Creating recipe folder...")
            if not self.duplicate_template(recipe_folder):
                self.log("Step 0b: Failed to create recipe folder")
                self.show_alert("Error", "Failed to create recipe folder", "critical")
                return
            
            # Step 1: Select STL files (native file picker with confirmation)
            self.log("Step 1: Selecting STL files...")
            stl_files = self.choose_files("Select STL files to stack (in order)")
            if not stl_files:
                self.log("Step 1: No files selected, exiting")
                return
            
            self.log(f"Step 1: Selected {len(stl_files)} files")
            for i, f in enumerate(stl_files, 1):
                self.log(f"  {i}. {Path(f).name}")
            
            # Step 2: Web-based drag-and-drop reorder
            self.log("Step 2: Opening reorder UI...")
            stl_files = self.reorder_files_via_web(stl_files)
            
            self.log(f"Step 2: Final order confirmed:")
            for i, f in enumerate(stl_files, 1):
                self.log(f"  {i}. {Path(f).name}")
            
            # Step 3: Generate RECIPE_SPECIFIC.py
            self.log("Step 3: Generating recipe script...")
            if not self.generate_recipe_script(recipe_folder, stl_files, recipe_name):
                self.log("Step 3: Failed to generate recipe script")
                self.show_alert("Error", "Failed to generate recipe script", "critical")
                return
            
            # Step 4: Setup output filename (combined STL goes in recipe folder)
            self.log("Step 4: Preparing to build...")
            output_filename = str(recipe_folder / f"{recipe_name}--COMBINED.stl")
            output_dir = str(recipe_folder)
            
            self.log(f"Step 4: Output path: {output_filename}")
            self.log(f"Step 4: Directory: {output_dir}")
            self.log(f"Step 4: Recipe name: {recipe_name}")
            
            # Step 5: Build
            self.log("Step 5: Building STL in Blender...")
            # No dialog - just run silently
            
            self.log(f"Blender script path: {self.blender_script}")
            self.log(f"Blender script exists: {self.blender_script.exists()}")

            try:
                # Pass full file paths (ASSEMBLE_RECIPE.py will find them via os.path.join with absolute paths)
                part_names = [str(f) for f in stl_files]
                
                config = {
                    'RECIPE_NAME': recipe_name,
                    'ASSEMBLY_PARTS': part_names,
                    'STACK_DIRECTION': 'TOP_TO_BOTTOM',
                    'EXPORT_DIR': output_dir,
                    'EXPORT_FILE': output_filename
                }
                
                python_code = f"""
import sys
sys.path.insert(0, r'{self.base_root / "BLENDER_RECIPE-BUILDER" / "SCRIPTS"}')

config = {json.dumps(config)}
RECIPE_NAME = config['RECIPE_NAME']
ASSEMBLY_PARTS = config['ASSEMBLY_PARTS']
STACK_DIRECTION = config['STACK_DIRECTION']
EXPORT_DIR = config['EXPORT_DIR']

print(f"Config EXPORT_DIR: {{EXPORT_DIR}}")

# Execute the ASSEMBLE_RECIPE script with these variables available globally
exec(open(r'{self.blender_script}').read())
"""
                
                self.log("Running Blender command...")
                result = subprocess.run(
                    ["/Applications/Blender.app/Contents/MacOS/blender", "--background", "--python-expr", python_code],
                    capture_output=True, text=True, timeout=300
                )
                
                self.log(f"Blender return code: {result.returncode}")
                if result.stdout:
                    self.log(f"Blender stdout:\n{result.stdout[:1000]}")
                if result.stderr:
                    self.log(f"Blender stderr:\n{result.stderr[:1000]}")
                
                if result.returncode == 0:
                    self.log("Assembly successful!")
                    output_file = Path(output_filename).name
                    recipe_script = f"{recipe_name}--STACKABLES-RECIPE.py"
                    self.show_alert(
                        "Success!",
                        f"Recipe created!\n\n📁 {recipe_name}\n📄 {recipe_script}\n🔷 {output_file}",
                        "informational"
                    )
                    # Open the recipe folder in Finder
                    self.log("Opening recipe folder in Finder...")
                    subprocess.run(["open", str(recipe_folder)])
                else:
                    error = result.stderr if result.stderr else "Unknown error"
                    self.log(f"Build failed with error:\n{error}")
                    self.show_alert(
                        "Build Failed",
                        f"Error: {error[:200]}\n\nMake sure Blender is installed:\nbrew install blender",
                        "critical"
                    )
            
            except FileNotFoundError:
                self.log("Blender not found")
                self.show_alert(
                    "Blender Not Found",
                    "Blender needs to be installed first:\n\nbrew install blender",
                    "critical"
                )
            except subprocess.TimeoutExpired:
                self.log("Assembly timed out (>300 seconds)")
                self.show_alert("Timeout", "Assembly took too long", "critical")
            except Exception as e:
                self.log(f"Blender error: {e}\n{traceback.format_exc()}")
                self.show_alert("Error", str(e)[:200], "critical")
        
        except Exception as e:
            self.log(f"FATAL ERROR: {e}\n{traceback.format_exc()}")
            self.show_alert("Fatal Error", f"Unexpected error:\n{str(e)[:200]}", "critical")


if __name__ == "__main__":
    try:
        builder = RecipeBuilder()
        builder.run()
    except Exception as e:
        print(f"FATAL: {e}")
        traceback.print_exc()

