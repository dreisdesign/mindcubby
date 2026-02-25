# Changelog

All notable changes to G-coder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-02-25

### Added
- **Object-Level Settings Support** – Properly handles `OBJECT_*` prefixed settings from post-processing script injection
- **Improved Documentation** – README now explains object-level settings handling and links to post-processor script

### Fixed
- **Thickness Override Bug** – Thickness calculations no longer override object-level settings (wall layers, top/bottom shells remain accurate)
- **OrcaSlicer Documentation** – Added OrcaSlicer to supported formats list with full feature parity (sparse infill, spiral mode, object-level overrides)
- **Output Formatting Alignment** – Synchronized print time format with Python script:
  - Hours only: "2 Hours" (unchanged)
  - Hours + minutes: "1h 30m" (was "1 Hour 30 Minutes")
  - Minutes only: "45 Minutes" (unchanged)
- **Vase Mode Output** – Removed extra "Top/Bottom: None" message to match Python script exactly

### Technical
- JavaScript object-level settings override logic now matches Python script (gcode_specs.py v2.3+)
- All three slicers (Cura, PrusaSlicer, OrcaSlicer) fully supported with identical accuracy
- Output formatting 100% aligned between Python and JavaScript implementations

## [0.3.0] - 2025-12-20

### Added
- localStorage persistence: Session data survives page refresh
- Restored sessions display "(Restored)" label on filename

### Changed
- Privacy Policy link now points to GitHub repository documentation
- Improved footer styling with subtle underline on hover

## [0.2.0] - 2025-12-20

### Added
- SVG icons to copy and download buttons for improved visual feedback
- Plus icon to "Select G-Code File" upload button
- Inline SVG icons using Material Design icon style
- Privacy Policy document
- Footer link to Privacy Policy

### Changed
- Button styling now includes icons with descriptive labels

## [0.1.0] - 2025-12-19

### Added
- Initial G-coder web app proof of concept
- G-code file upload functionality
- G-code parsing engine supporting Cura and PrusaSlicer formats
- Automatic specification extraction:
  - Print time (human-readable format)
  - Filament weight calculation (1.25g per meter standard)
  - Layer height, nozzle/bed temperatures
  - Infill density and pattern
  - Printer model and slicer detection
- Markdown table output formatted for Printables.com
- Rich text (HTML) clipboard copy for Printables editor compatibility
- Raw markdown clipboard copy
- Markdown file download functionality
- Clean, minimal vanilla HTML/CSS/JavaScript interface
- Responsive design

### Technical
- All processing runs entirely in the browser (no server)
- Uses FileReader API for local file handling
- Implements regex-based G-code comment parsing
- Cross-slicer compatibility (Cura, PrusaSlicer/SuperSlicer)
