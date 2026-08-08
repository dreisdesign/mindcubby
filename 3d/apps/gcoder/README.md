# G-coder

**Generate Printables Specifications from G-Code Files**

A lightweight, browser-based tool that automatically extracts print specifications from 3D printer G-code files and formats them as ready-to-paste Markdown tables for Printables.com listings.

🔗 **Live App:** https://dreisdesign.github.io/mindcubby/3d/apps/gcoder/

---

## Features

✅ **No Installation Required** – Runs entirely in your browser  
✅ **Fast Processing** – Parse G-code files instantly  
✅ **Multi-Slicer Support** – Works with Cura, PrusaSlicer, SuperSlicer, and OrcaSlicer  
✅ **Extraction Verification** – Verify accuracy with raw G-code lines paired to extracted values  
✅ **Multiple Export Formats** – Full JSON, Pure JSON, Pure G-Code, or Side-by-Side Comparison  
✅ **Object-Level Overrides** – Correctly handles per-object settings from post-processing scripts  
✅ **No Data Upload** – All processing happens locally in your browser  

---

## Supported Specifications

G-coder automatically extracts and formats:

- **Print Time** – Calculated from G-code metadata and converted to human-readable format
- **Filament Used** – Weight in grams (calculated from filament length × 1.25g/m standard)
- **Layer Height** – Precision setting used
- **Wall Thickness** – Number of perimeters
- **Infill Density** – Infill percentage and pattern (e.g., "15% (grid)")
- **Support Material** – Whether supports were used
- **Nozzle Diameter** – Nozzle size specification
- **Printer Model & Vendor** – Detected from G-code metadata
- **Slicer Software** – Cura or PrusaSlicer identification
- **Print Modes** – Spiral vase, adaptive layer height, etc.

---

## How to Use

1. **Visit** https://dreisdesign.github.io/mindcubby/3d/apps/gcoder/
2. **Click** "Select G-Code File" or drag & drop your `.gcode` file
3. **View** extracted specifications with accuracy verification in the table
4. **Choose** an action:
   - **Export Settings** – Download settings as JSON (stripped format for import/archiving)
   - **View Comparison** – Open side-by-side comparison in new window: raw G-code lines vs. extracted values (for verification)
   - **Reprocess** – Re-extract settings with current app version (useful after app updates)

---

## Supported G-Code Formats

- **Cura** – Standard export format
- **PrusaSlicer** – RepRap G-code format
- **SuperSlicer** – PrusaSlicer derivative
- **OrcaSlicer** – Full support including sparse infill, spiral mode, and object-level settings

The tool automatically detects the slicer and parses the appropriate metadata comments.

---

## Technical Details

### Architecture
- **Frontend Only** – No server required
- **Vanilla JavaScript** – No frameworks or dependencies
- **FileReader API** – Secure local file handling
- **Regex-Based Parsing** – Efficient G-code comment extraction

### How It Works
1. User selects a G-code file from their computer
2. Browser reads the file using FileReader API
3. JavaScript parses G-code comments using regex patterns
4. Specifications are extracted and formatted into Markdown
5. User can copy or download the result

### Browser Compatibility
- Chrome/Chromium-based browsers (recommended)
- Firefox
- Safari
- Edge

---

## Key Features

### Object-Level Settings Support
G-coder correctly handles **object-level settings overrides** from post-processing scripts (indicated by `OBJECT_*` prefixes in G-code). For example:
- Wall layers (perimeters) can be set differently per object
- Top/bottom shell layers respect object-level overrides
- Fuzzy skin and seam position settings are applied per-object
- Thickness calculations never override object-level settings

This is especially useful when working with **OrcaSlicer's model-specific settings**.

### Extraction Verification & Cross-Checking

G-coder includes a built-in **verification system** to ensure extraction accuracy:

- **Verification Summary** – Shows total settings extracted and any discrepancies detected
- **Raw G-Code Pairing** – Each extracted setting includes the original G-code comment line for manual verification
- **Computed vs. Extracted** – Yellow highlighting shows when a value differs from its source
- **Multiple Export Formats** – Export as Full JSON (with verification log), Pure JSON, Pure G-Code, or visual Comparison

The **Full JSON export** is designed for easy cross-checking:
```json
{
  "verification_log": {
    "summary": {
      "total_settings_extracted": 615,
      "settings_with_differences": 0
    },
    "settings": {
      "wall_loops": {
        "extracted_gcode_line": "; wall_loops = 2",
        "extracted_value": "2",
        "computed_final_value": "2",
        "has_difference": false
      }
    }
  }
}
```

## Example Output

```markdown
## Print Specifications

| Specification | Value |
|---|---|
| Estimated Print Time | 2 Hours 15 Minutes |
| Filament Used | 47.3 g |
| Layer Height | 0.20 mm |
| Wall Thickness | 2 perimeters |
| Infill Density | 15% (grid) |
| Supports Required | No |
| Nozzle Diameter | 0.40 mm |

## Settings Used

- **This Print:** PETG • 0.40mm • 235°C Nozzle • 60°C Bed

## Print Notes

- Optimized for **Ender 3 V2** by **Creality** with **BLTouch** bed leveling
- Uses off-print purge line to prevent nozzle blobs
- Exported from **Cura**
- ⚠️ **Adjust temperatures +/-5C** if experiencing adhesion or stringing issues
- Recommended: Test on a small print first before large jobs
```

---

## Privacy

G-coder processes all files **locally in your browser**. No data is sent to any server. Your G-code files never leave your computer.

For detailed information about how your data is handled, see the [Privacy Policy](https://github.com/dreisdesign/mindcubby/blob/main/3d/apps/gcoder/PRIVACY.md).

---

## Future Roadmap

- [ ] Drag-and-drop file support
- [ ] Batch processing (multiple files at once)
- [ ] `.3mf` file support for Cura project data extraction
- [ ] Custom template editor for output formatting
- [ ] Preset management for different printer profiles
- [ ] Integration with Printables API

---

## Development

### Project Structure
```
APPS/g-coder/
├── index.html       # Main HTML template
├── style.css        # Vanilla CSS styling
├── script.js        # G-code parsing and UI logic
├── CHANGELOG.md     # Version history
└── README.md        # This file
```

### Running Locally
1. Clone the repository
2. Open `index.html` in your browser, or
3. Use a local server:
   ```bash
   python3 -m http.server 8000
   # Then visit http://localhost:8000/APPS/g-coder/
   ```

### Building/Deployment
No build step required. Push to GitHub and GitHub Pages automatically deploys.

---

## Contributing

Found a bug? Want to suggest a feature? Open an issue or reach out!

---

## License

See [LICENSE](../../LICENSE) in the repository root.

---

## Related Projects

- **[MindCubby-3D](../../)** – Parent repository with 3D printing automation workflows
- **[gcode_specs.py](../../MINDCUBBY-3D/scripts/gcode_specs.py)** – Original Python script (command-line version with identical parsing logic)
- **[orcaslicer-postprocess-inject-object-settings.py](../../MINDCUBBY-3D/scripts/orcaslicer-postprocess-inject-object-settings.py)** – Post-processor that injects object-level settings into G-code (generates OBJECT_* comments that G-coder properly handles)

---

**Made for makers, by makers.**
