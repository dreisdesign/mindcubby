# g-coder - Project Brief & Acceptance Criteria

## 1. Project Overview
**App Name:** g-coder  
**Purpose:** A browser-based tool that parses 3D printer G-code files to automatically generate formatted specification tables for Printables.com descriptions.  
**Platform:** Web (Hosted on GitHub Pages)  
**Tech Stack:** Vanilla HTML, CSS, JavaScript (No build steps, no frameworks).

## 2. Problem Statement
Creating accurate, formatted print specifications for Printables listings is a manual, error-prone process for most makers. While local scripts exist, they require technical setup (Python, CLI). A web-based tool makes this automation accessible to everyone, allowing any user to instantly generate professional specification tables from their G-code files without installing software.

## 3. Core Functionality (POC Scope)
The Proof of Concept (POC) will port the logic from the existing `gcode_specs.py` into client-side JavaScript. It will process files entirely in the browser (no server upload).

### Key Features
1. **File Input:** Button to select a local `.gcode` file.
2. **Parsing Engine:** JavaScript logic to extract:
   - Print Time (converted to Human Readable)
   - Filament Used (Weight in g, Length in m)
   - Layer Height
   - Nozzle/Bed Temps
   - Infill & Perimeters
   - Printer Model/Slicer info
3. **Output Display:** Read-only text area showing the generated Markdown.
4. **Export Actions:**
   - **Copy Raw MD:** Copies the raw markdown text.
   - **Copy for Printables:** Copies the rendered HTML/Rich Text (critical for pasting directly into Printables' WYSIWYG editor).
   - **Download .md:** Downloads the content as a file (e.g., `filename_SUMMARY.md`).

## 4. Acceptance Criteria

### AC1: G-Code Parsing
- [ ] System accepts a standard `.gcode` file (Cura or PrusaSlicer flavor).
- [ ] System correctly extracts **Print Time** and formats it (e.g., "2 Hours 15 Minutes").
- [ ] System correctly calculates **Weight** based on filament length (using the 1.25g/m constant from the python script).
- [ ] System extracts **Layer Height**, **Nozzle Temp**, and **Bed Temp**.

### AC2: User Interface
- [ ] UI is minimal: One "Upload" button, one output area, action buttons.
- [ ] No external CSS frameworks (Vanilla CSS).
- [ ] UI provides visual feedback when processing is complete.

### AC3: Output & Clipboard
- [ ] Generated output matches the table format defined in `gcode_specs.py`.
- [ ] **"Copy Markdown"** button successfully copies raw text to clipboard.
- [ ] **"Copy for Printables"** button copies formatted content that renders correctly when pasted into a rich text editor (like Printables description).
- [ ] **"Download"** button triggers a download of the `.md` file.

## 5. Technical Constraints
- **Single File Structure:** Ideally `index.html` contains the CSS and JS to keep it portable, or separated into `style.css` and `script.js` in the same folder.
- **No Backend:** All processing must happen in the client browser using `FileReader` API.
- **Regex Porting:** Python regex patterns must be carefully adapted to JavaScript RegExp syntax.

## 6. Future Scope (Post-POC)
- Drag and drop support.
- .3mf file support (requires JS unzip library).
- Batch processing.
