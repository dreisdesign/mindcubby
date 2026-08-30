# Spooler

Track filament inventory using NFC tags. Write spool info to tags, log usage, export as CSV.

**Live App:** https://dreisdesign.github.io/mindcubby/3d/apps/spooler/

**Current Version:** v1.0.4

---

## What's New in v1.0.4

- ✅ **All 16 Elegoo materials supported** – PLA, PETG, TPU (main section), plus ABS, PA, CPE, PC, PVA, ASA, BVOH, EVA, HIPS, PP, PPA, PPS, PET (Other section)
- ✅ **Verified codes from Savion RFID editor** – All material & variant hex codes validated against working implementations
- ✅ **Multi-variant support** – PA (PA-CF, PAHT-CF) and PC (PC, PC-FR) show all available options
- ✅ **Proper defaults for unsupported variants** – Materials without working Name variants use position-based encoding for reliable printer defaults

## What's New in v1.0.3

- ✅ **Simplified to 3 materials** – Shows only PLA, PETG, TPU (tested variants that actually work)
- ✅ **Flat variant selector** – All 20 variants organized in 3 labeled sections (no intermediate "Name" step)
- ✅ **Removed untested materials** – Removed ABS, PA, PC, ASA, PET and non-Elegoo variants (PLA Fluo, PLA Carbon)
- ✅ **Elegoo-brand only** – All shown variants are Elegoo-brand filaments confirmed available for Canvas

## What's New in v1.0.2

- ✅ **Firmware selector** – Choose between Elegoo Canvas (Official) and Generic/Compatible firmware
- ✅ **Dual material configs** – Each firmware has its own menu order for accurate encoding
- ✅ **Persistent firmware choice** – Your selection is saved in localStorage

## What's New in v1.0.1

- ✅ **Corrected variant codes** – All PLA/PETG/TPU variants updated to match official Elegoo firmware
- ✅ **Real-time hex preview** – NFC hex code updates instantly as you change materials/colors
- ✅ **Version tracking** – Build timestamp and version number on page load
- ✅ **Console debugging** – Logs show which variant is actually selected when clicking buttons

---

## Features

- NFC tagging – Write filament info to tags on your spools
- Inventory tracking – Know what you have and where
- Local storage – All data in your browser, never uploaded
- CSV export – Download your inventory for backup
- Spool history – Track usage and consumption over time

---

## Documentation

- **[Complete Material Reference](./COMPLETE-MATERIAL-REFERENCE.csv)** – **START HERE:** All 16 material types with all available variants (Type, Name, hex codes, descriptions)
- **[Firmware Comparison](./FIRMWARE-COMPARISON.csv)** – Side-by-side Elegoo vs Generic menu comparison
- **[Printer Menu Verification](./PRINTER-MENU-VERIFICATION.md)** – Guide to verify your printer's menu order matches the firmware configuration
- **[Design Decisions](./DESIGN-DECISIONS.md)** – UX & styling rationale, technical decisions, architecture notes
- **[Elegoo RFID Codes](./Elegoo-RFID-HEX-FILAMENT-CODES.md)** – Official firmware material/variant mappings
- **[Roadmap](./ROADMAP.md)** – Planned features and improvements

---

## What You Need

- NFC-capable phone or NFC reader/writer
- Standard NFC tags (MIFARE Ultralight, NTAG series, etc.)
- Browser with Web NFC support (Chrome, Edge, Firefox)
