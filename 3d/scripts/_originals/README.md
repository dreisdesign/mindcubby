# Original Source Scripts

These are backup copies of the original scripts from the Stackables project, kept for reference during the refactoring process.

## Files

- **generate-thumbnails-ORIGINAL.py** — Original Blender script for rendering thumbnails
  - Hard-coded paths to Stackables project
  - Being refactored into modular `../generate-thumbnails/`

- **build-pdf-catalog-ORIGINAL.py** — Original PDF catalog generator
  - Hard-coded grid layout and metadata parsing for Stackables
  - Next to be refactored

- **align-and-package-stls-ORIGINAL.py** — Original STL alignment and packaging tool
  - Blender script for centering and packaging STLs
  - Next to be refactored after PDF catalog

## Refactoring Status

| Script | Status | New Location |
|--------|--------|--------------|
| generate-thumbnails | 🔄 In Progress | `../generate-thumbnails/` |
| build-pdf-catalog | ⏳ Queued | `../build-pdf-catalog/` |
| align-and-package-stls | ⏳ Queued | `../align-and-package-stls/` |

Once refactored versions are complete and tested, these originals can be archived.
