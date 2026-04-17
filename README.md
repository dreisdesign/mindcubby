# mindcubby

A collection of tools and utilities for 3D printing, starting with **G-coder**.

---

## Table of Contents

- [G-coder — Live App](https://dreisdesign.github.io/mindcubby/3d/apps/gcoder/)
- [Rotater — Live App](https://dreisdesign.github.io/mindcubby/3d/apps/rotater/)
- [G-coder (docs)](./3d/apps/gcoder/README.md)
- [Rotater (docs)](./3d/apps/rotater/README.md)
- [Roadmap](./ROADMAP.md)


## 🚀 G-coder

**Generate Printables Specifications from G-Code Files**

A lightweight, browser-based tool that automatically extracts print specifications from 3D printer G-code files and formats them as ready-to-paste Markdown tables for Printables.com listings. Works with Cura, PrusaSlicer, and SuperSlicer exports.

### Quick Links
- **Live App:** https://dreisdesign.github.io/mindcubby/3d/apps/gcoder/
- **Documentation:** [G-coder README](./3d/apps/gcoder/README.md)
- **Privacy Policy:** [Privacy Policy](./3d/apps/gcoder/PRIVACY.md)

### Features
✅ **No Installation Required** – Runs entirely in your browser  
✅ **Fast Processing** – Parse G-code files instantly  
✅ **Multi-Slicer Support** – Works with Cura and PrusaSlicer  
✅ **Curated Printables Output** – Copy formatted specs directly to Printables listings  
✅ **Complete Settings Export** – Download ALL 360+ extracted G-code settings as JSON  
✅ **No Data Upload** – All processing happens locally  

### How to Use
1. Visit https://dreisdesign.github.io/mindcubby/3d/apps/gcoder/
2. Select your `.gcode` file
3. Choose an action:
   - **Copy for Printables (Rich Text)** – Paste into Printables description
   - **All Settings (JSON)** – Download complete G-code settings for analysis
   - **Download .md** – Save curated specs as Markdown

---

## 🌀 Rotater

View and export rotating 3D STL models as animated GIF, MP4 video, or PNG — entirely in the browser.

### Quick Links
- **Live App:** https://dreisdesign.github.io/mindcubby/3d/apps/rotater/
- **Documentation:** [Rotater README](./3d/apps/rotater/README.md)
- **Python CLI:** [stl_rotate.py](./3d/apps/rotater/stl_rotate.py)

### Features
- Browser-based STL viewer with spin/tilt/wobble animation
- Export GIF, MP4, or PNG — client-side (your STL never leaves your machine)
- Drag-and-drop STL loading; settings persist across refreshes
- Includes Python CLI for headless rendering and GIF/MP4 export

### Quick Web Usage
1. Serve the app folder locally (ES modules require `http://`):

```bash
python3 -m http.server 8765
# then open http://localhost:8765
```
2. Open `3d/apps/rotater/index.html`, drag & drop an `.stl`, tweak appearance, and export.


## What's Next?

Future tools for the mindcubby suite:
- Batch G-code processing
- .3mf file inspection
- Custom spec templates
- Integration with Printables API

---

## License

MIT – See individual tool directories for details.
