# Spooler — UX & Design Decisions

## Overview
**Spooler** is a minimal NFC filament tagger POC for the Elegoo Canvas 3D printer. The design prioritizes **clarity**, **efficiency**, and **minimal aesthetics** while maintaining full feature functionality.

---

## UX Decisions

### 1. Type → Subtype → Color Workflow
**Decision:** Three-step input progression instead of combined dropdown.

**Rationale:**
- **Progressive disclosure**: Users see available subtypes only after selecting a material type
- **Error prevention**: Can't select incompatible subtype/material combinations
- **Physical mapping**: Mirrors the NFC tag structure (material code → variant → color RGB)
- **Reduced cognitive load**: One choice at a time

**Implementation:**
```
Step 1: Type chips (PLA, PETG, TPU)
  └─ Step 2: Subtype chips (dynamic based on type)
      └─ Step 3: Color picker + optional hex input
```

### 2. Real-Time NFC Hex Generation
**Decision:** Display hex code as user selects material/color (not just on "Add" button).

**Rationale:**
- Users can verify correctness before adding to history
- Copy hex code immediately without adding to log
- Transparency: see exact NFC page data being generated
- Debugging aid: catch encoding errors early

### 3. History Entry Structure: 3-Row Layout
**Decision:** Split each history entry into three distinct rows:
- **Row 1 (Chips)**: Type | Subtype | Color Swatch | Hex Color | Timestamp (right-aligned)
- **Row 2 (Hex Display)**: Full NFC hex code in monospace, bordered box
- **Row 3 (Actions)**: Copy/Edit buttons (left), Delete button (right)

**Rationale:**
- **Scannability**: Type + subtype + color visible at a glance
- **Accessibility**: Hex code separated into dedicated row (easier to copy/reference)
- **Action clarity**: Buttons grouped logically (modify left, destroy right)
- **Touch-friendly**: Adequate spacing prevents accidental clicks

### 4. Persistent History with localStorage
**Decision:** Auto-save every entry without user confirmation.

**Rationale:**
- **Frictionless**: No save button clicks
- **Recovery**: Browser crash/close doesn't lose data
- **Iteration**: Build up a library of filament configs over time
- **CSV export**: Easy handoff to external tools

### 5. Sort Order Control
**Decision:** Dropdown selector (Newest First / Oldest First) above history.

**Rationale:**
- **Default recent**: Most common use case (just tagged a spool)
- **Flexibility**: Toggle to find older configs without scrolling
- **Non-destructive**: Sort doesn't modify data, just view order

### 6. Edit in Place
**Decision:** Edit button populates form, removes old entry, lets user re-add.

**Rationale:**
- **Simple logic**: No separate "edit mode" or confirmation dialogs
- **Transparent**: User always sees what's being changed
- **One path**: Same flow for adding and editing
- **Avoids bugs**: No partial-edit states

### 7. Delete with Confirmation
**Decision:** First click changes button to "Confirm Delete" (red), auto-resets after 3 seconds.

**Rationale:**
- **Accident prevention**: Accidental double-click won't delete
- **Visual feedback**: Clear state change (button color + text)
- **Time window**: 3 seconds gives user recovery window
- **No modals**: Stays in context, doesn't interrupt flow

### 8. CSV Export with Full Hex Codes
**Decision:** Include NFC hex in CSV with proper quoting to handle embedded commas.

**Rationale:**
- **Data portability**: Export to spreadsheet, external NFC tools
- **Audit trail**: Complete record of all tagged filaments
- **Hex preservation**: Comma-space format preserved with CSV escaping
- **One-click**: "Download CSV" button, no additional setup

### 9. Visual Feedback for Actions with Color State Changes
**Decision:** Use button color changes (not notifications) to confirm successful actions. Button turns green (#28a745) with "Copied!" text, log entry border highlights green simultaneously, then revert after 2 seconds.

**Rationale:**
- **Integrated feedback**: All feedback contained within the action element (button) + related context (log entry)
- **No notifications fatigue**: Avoids extra overlay messages that users ignore
- **Visual link**: Green border on the entry being added shows exact what-was-added
- **Semantic color**: Green = success, immediately recognizable
- **Mobile-friendly**: No floating alerts that obscure content
- **Minimal aesthetic**: Fits craigslist style (no modals, no overlays)
- **Reduces cognitive load**: "Button changed = success happened" is intuitive

---

## Design Decisions

### 1. Aesthetic: Craigslist Minimal
**Decision:** 1px solid #999 borders, white backgrounds, no shadows, no border-radius.

**Rationale:**
- **No-frills authenticity**: Reflects utility (tool, not toy)
- **Accessibility**: High contrast, no visual noise
- **Responsive robustness**: Minimal styling survives across browsers/devices
- **Speed**: No rendering overhead from rounded corners, shadows
- **Legibility**: Stark borders = clear section boundaries
- **Timeless**: Won't look dated in 2 years

**Visual:**
```css
border: 1px solid #999;
background: white;
/* No: box-shadow, border-radius, background-gradient, opacity tricks */
```

### 2. Color Strategy: Hover States + Semantic State Changes
**Decision:** Buttons default to white, colors appear on hover for interaction affordance. Additionally, successful actions (like Copy) trigger temporary state-based color changes (green for success).

**Rationale:**
- **Minimal distraction at rest**: Resting state is neutral (white)
- **Interaction hint on hover**: Color signals "this button does X"
- **Action feedback via state change**: Successful operations briefly turn green to confirm completion
- **Semantic color meaning:**
  - **Copy button hover: Blue (#007bff)** — "Safe, standard action"
  - **Copy button after click: Green (#28a745)** — "Success, copied"
  - **Edit button hover: Light gray (#f0f0f0)** — "Modify, not destructive"
  - **Delete button hover: Red (#dc3545)** — "Danger, permanent"
- **Mobile-friendly**: No hidden state ambiguity on touch; color changes are intentional feedback
- **Avoids notification clutter**: State change replaces need for floating messages

### 3. Responsive Typography with clamp()
**Decision:** All text uses `clamp(min, preferred, max)` instead of breakpoints.

**Example:**
```css
font-size: clamp(12px, 1.8vw, 14px);
```

**Rationale:**
- **Smooth scaling**: Text grows/shrinks continuously with viewport
- **No jarring jumps**: No breakpoint shock at 768px or 1024px
- **Future-proof**: Works on devices we haven't imagined yet
- **Simpler CSS**: One rule instead of 3 media queries
- **Maintains readability**: Min/max guardrails prevent too-small or too-large text

### 4. Consistent Spacing System
**Decision:** Two gap sizes throughout:
- **8px**: Minor spacing (within rows, chip groups, form groups)
- **20px**: Major spacing (between history entries, between sections)

**Rationale:**
- **Predictable rhythm**: Users feel intentional design, not haphazard padding
- **Easy maintenance**: No ad-hoc 12px, 14px, 16px values scattered
- **Touch targets**: 8px gaps keep buttons/chips large enough to tap safely
- **Visual hierarchy**: 20px = section breaks, 8px = internal structure

### 5. Vanilla JavaScript (No Framework)
**Decision:** Bare HTML + CSS + DOM methods, no React/Vue/Svelte.

**Rationale:**
- **Single file**: Entire app fits in one `.html` file (~1000 lines)
- **No build step**: Runs immediately in browser
- **Zero dependencies**: No npm, no package.json bloat
- **Educational**: Clear to see exactly what's happening
- **Portable**: Copy file, runs anywhere
- **Performance**: No virtual DOM overhead, direct DOM manipulation

### 6. Color Swatch Display
**Decision:** Show a 32×32px visual swatch of the selected color (preview).

**Rationale:**
- **Visual verification**: "Yes, that's the blue I wanted"
- **Compact**: Fits naturally in chip row
- **Aligned**: Matches height of type/subtype chips (32px)
- **Memorable**: Icon-like recognition of color choice

### 7. Monospace Hex Display
**Decision:** Full NFC hex code in `font-family: monospace` in bordered box.

**Rationale:**
- **Clarity**: Every digit is distinct (no serif confusion)
- **Copy-friendly**: Users can select/copy without formatting breaks
- **Professional**: Code should look like code
- **Bordered context**: Clear separation from surrounding text

### 8. CSV Escaping for Hex Field
**Decision:** Wrap hex field in double quotes: `"A2:04:01..., A2:05:34..."`

**Rationale:**
- **CSV spec compliance**: Comma-separated values with embedded commas must be quoted
- **Tool compatibility**: Excel, Google Sheets, Python `csv` module parse correctly
- **Data integrity**: Hex codes preserved exactly as generated
- **Future-proof**: If external tools need to parse export, it's valid CSV

### 9. Logo Integration
**Decision:** External SVG file (`spooler.svg`) with responsive sizing via `clamp()`.

**Rationale:**
- **Maintainability**: Edit logo separately without touching HTML
- **Scalability**: `clamp(40px, 10vw, 60px)` keeps it proportional
- **Branding**: Visual identity at top of app
- **Lightweight**: SVG is text, minimal file size

### 10. No Modals or Overlays
**Decision:** All interactions stay in-context (edit form, inline confirmations).

**Rationale:**
- **Immersion**: Users never leave the app experience
- **Mobile-friendly**: No janky modal stacking on small screens
- **Accessibility**: Screen readers don't get confused by hidden/shown layers
- **Simplicity**: Fewer DOM elements, fewer edge cases
- **Speed**: No animation delays

---

## Technical Implementation Notes

### Storage
- **Key**: `'spooler_log'` in localStorage
- **Format**: JSON array of objects `[{type, subtype, color, hex, id, timestamp}, ...]`
- **ID**: Timestamp-based (milliseconds since epoch) for unique, sortable entries

### NFC Encoding
- **Material codes**: PLA=`00807665`, PETG=`80698471`, TPU=`00848085`
- **Variant codes** (Page 13): Material-specific subtype mappings, verified against Elegoo/anyspool.de reference tags
  - **PLA variants**: `00` prefix (e.g., PLA=`00000000`, RAPID PLA+=`00080000`)
  - **PETG variants**: `00` or `01` prefix depending on type (e.g., PETG=`00000000`, RAPID PETG=`01050000`)
  - **TPU variants**: `03` prefix for standard (e.g., TPU 95A=`03000000`)
  - **Note**: Variant codes are firmware-specific; incorrect codes cause printer to default to base material type
- **Color encoding** (Page 14): RGB hex value (6 digits) + padding
- **Output format**: Comma-space separated page writes (e.g., `A2:04:01, A2:05:34, ...`)
- **Sources**: 
  - Elegoo Canvas NFC tag specification
  - anyspool.de reference implementations (https://anyspool.de)

### Responsive Breakpoints
**None.** All sizing uses `clamp()`:
- Labels: `clamp(11px, 1.8vw, 12px)`
- Body text: `clamp(13px, 1.5vw, 14px)`
- Form inputs: 36px fixed height (but 8/20px padding adjusts visually)
- Spacing: 8px and 20px fixed (intentionally rigid for rhythm)

---

## Future Considerations

### Potential Enhancements (Out of Scope for POC)
1. **Cloud sync**: Upload CSV to Firebase, access from multiple devices
2. **Barcode scanner**: Auto-populate material from printed barcodes
3. **Filament profiles**: Store temp, speed recommendations per material
4. **Bulk export**: Download entire CSV with one click (already done!)
5. **Dark mode**: Respect `prefers-color-scheme` media query
6. **Offline PWA**: Service worker caching for offline access

### What Won't Change
- The minimal aesthetic (intentional constraint)
- localStorage as primary storage (simplicity over cloud)
- No animations or transitions (clarity over polish)
- Vanilla JS foundation (avoids framework churn)

---

## Summary
**Spooler** demonstrates that powerful tools don't need beautiful design—they need *clear* design. Every decision prioritizes **user efficiency**, **error prevention**, and **data integrity** within a deliberately austere visual system.

The result is a POC that works, ships in one file, and serves exactly one purpose: tag filament spools with NFC data. No bloat, no distractions, no compromises.
