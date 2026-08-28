# Spooler — Feature Roadmap

## Current State (v1.0.3)
- ✅ NFC hex code generator for PLA, PETG, TPU (3 materials, 20 variants)
- ✅ Local storage history with copy/edit/delete
- ✅ CSV export
- ✅ Real-time hex preview
- ✅ Color picker with hex input
- ✅ Build timestamp tracking

---

## Planned Features

### 1. User Settings: Show/Hide Filaments
**Status:** Proposed
**Description:** Add a Settings panel allowing users to customize which materials/variants are displayed in the variant selector.

**Use Cases:**
- Hide variants the user doesn't use (e.g., "PLA Galaxy" if not in inventory)
- Reduce cognitive load for users with limited filament library
- Tailor app to specific printer capabilities

**Implementation Ideas:**
- Checkbox list of all 20 variants with enable/disable toggles
- Persist selection to localStorage
- "Show All" / "Hide All" quick buttons
- Reset to defaults

**Considerations:**
- Where to place settings? (Drawer? Modal? Bottom of page?)
- Should defaults be all-on or based on what's in history?

---

### 2. Import CSV
**Status:** Proposed
**Description:** Allow users to upload/import a CSV file to bulk-load filament entries into history.

**Use Cases:**
- Migrate inventory from spreadsheet into Spooler
- Bulk-add known filaments without manually tagging each one
- Restore backup of history from exported CSV

**Implementation Ideas:**
- CSV input field with drag-and-drop support
- Map columns (Material, Variant, Color, Hex, etc.)
- Preview import before confirming
- Merge or replace existing history

**File Format (matches current export):**
```
Material,Variant,Color,Hex,Timestamp
PLA,Rapid PLA+,#FF5733,A2:04:0103A00C A2:05:34030FD1 ...,03:28 PM
```

---

### 3. Inventory Level-Up: History → Inventory Management
**Status:** Proposed
**Description:** Evolve from a simple "history log" to a full inventory management system.

**Features to Add:**
- **Quantity tracking:** How many spools of each filament
- **Weight tracking:** Start weight, current weight, used weight
- **Cost per kg:** Calculate cost per spool, per kg
- **Purchase date:** Track when filament was acquired
- **Expiry date:** Flag old filaments (PLA degrades, TPU absorbs moisture)
- **Location/bin:** Where is this spool (printer, shelf, etc.)
- **Usage notes:** Link to specific prints, materials compatibility notes

**Why CSV Upload is Critical:**
- Users likely already track inventory in spreadsheet
- CSV import eliminates manual re-entry
- One source of truth, export-to-reimport workflow

**Implementation Ideas:**
- Transition history entries from single "Type/Variant/Color" to full inventory record
- Add edit form with all new fields (not just variant selector)
- Filter/sort by quantity, expiry, location, cost
- Statistics dashboard (total filament kg, total cost, usage trends)

---

### 4. Rebuild with Smoothie Design System
**Status:** Proposed
**Description:** Migrate from custom minimal CSS to the Smoothie Design System (your internal design system).

**Rationale:**
- Consistency with mindcubby ecosystem (labs, apps, etc.)
- Leverage existing tokens (colors, spacing, typography)
- Faster iteration with pre-built component library
- Better accessibility (Smoothie already optimized)
- Reduced custom CSS maintenance

**Scope:**
- Replace all `.chip`, `.copy-btn`, `.hex-output` custom styles with Smoothie tokens
- Update colors to Smoothie palette
- Use Smoothie buttons, inputs, cards, layout components
- Modernize without breaking existing NFC functionality

**Phase Strategy:**
1. v1.1 – Smoothie token adoption (colors, spacing)
2. v1.2 – Component migration (buttons, inputs, cards)
3. v2.0 – Full design refresh with inventory features

---

## Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Show/Hide Filaments | Medium | Low | **High** |
| Import CSV | High | Medium | **High** |
| Inventory Level-Up | Very High | High | **Medium** |
| Smoothie Rebuild | Medium | Medium | **Medium** |

---

## Roadmap Timeline

**v1.1 (Next Sprint)**
- [ ] User Settings: Show/Hide Filaments
- [ ] Import CSV functionality
- [ ] Smoothie token adoption (colors, spacing)

**v1.2 (Following Sprint)**
- [ ] Smoothie component migration
- [ ] UI polish with design system

**v2.0 (Major Release)**
- [ ] Full inventory management system
- [ ] Quantity, weight, cost, dates, location
- [ ] Statistics dashboard
- [ ] Complete Smoothie design overhaul

---

## Known Limitations / Opportunities

- **Multi-device sync:** Currently localStorage only. Could add cloud backup (Firebase, etc.)
- **Web NFC support:** Some browsers don't support Web NFC. Consider fallback UI for read-only mode.
- **Tag validation:** Could verify NFC tag write success before adding to history
- **Batch tag generation:** Generate hex codes for multiple tags at once (bulk tagging workflow)
- **QR code fallback:** Generate QR codes as backup if NFC fails
