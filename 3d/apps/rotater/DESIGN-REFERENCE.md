# Rotater — Design Reference

This document records the color tokens, semantic mappings, and theming conventions used in Rotater. All tokens originate from the [Smoothie Design System](../../../../../labs/design-system/) (Blueberry flavor).

---

## Blueberry Palette

These are the only canonical stops defined and used. There is no 400, 600, or 700 stop.

| Token | Hex | Role |
|---|---|---|
| `--palette-blueberry-100` | `#F0EEFF` | Light surface / icon color on dark bg |
| `--palette-blueberry-200` | `#DBD7FF` | Page background (light mode) / body text (dark mode) |
| `--palette-blueberry-300` | `#B3A8F7` | Labels, hints, borders, focus rings |
| `--palette-blueberry-500` | `#2E2B74` | **Primary brand color** — buttons, selections |
| `--palette-blueberry-800` | `#1E193E` | Dark surface (dark mode cards, controls bar) |
| `--palette-blueberry-900` | `#15122B` | Darkest background (canvas bg, dark mode page) |

---

## Semantic Token Assignments

### Light Mode (default)

| Semantic Token | Resolves To | Usage |
|---|---|---|
| `--color-primary` | `blueberry-500` | Buttons, selected radio borders, links |
| `--color-primary-darker` | `blueberry-800` | Hover states on primary elements |
| `--color-primary-lighter` | `blueberry-300` | Focus rings, decorative borders |
| `--color-surface` | `blueberry-100` | Controls bar / sidebar background |
| `--color-background` | `blueberry-200` | Page / app background |
| `--color-background-darkest` | `blueberry-900` | Canvas area background |
| `--color-on-surface` | `blueberry-900` | Body text on light surfaces |
| `--color-label` | `blueberry-800` | Slider labels, section labels |
| `--color-hint` | `blueberry-800` | Estimate text, secondary info |

### Dark Mode (`html.theme-dark`)

| Semantic Token | Resolves To | Usage |
|---|---|---|
| `--color-surface` | `blueberry-800` | Cards and controls bar background |
| `--color-surface-raised` | `blueberry-800` | Section boxes |
| `--color-background` | `blueberry-900` | Page background |
| `--color-on-surface` | `blueberry-100` | Body text |
| `--color-label` | `blueberry-300` | Slider labels |
| `--color-hint` | `blueberry-300` | Secondary text |
| `--color-primary` | `blueberry-300` | Active color (lighter for dark bg contrast) |

---

## Canvas Overlay Buttons (`.pause-btn`)

Buttons floating over the 3D canvas use a translucent dark blueberry background with blur, not the controls-bar surface, so they read over any model color.

| State | Background | Color | Border |
|---|---|---|---|
| Default | `rgba(21, 18, 43, 0.85)` | `blueberry-200` | `rgba(255,255,255,0.18)` |
| Hover | `rgba(21, 18, 43, 0.96)` | `blueberry-100` | — |
| **Active** (`.pause-btn--active`) | **`blueberry-500`** | **`blueberry-100`** | **`blueberry-300`** |
| Focus ring | — | — | `blueberry-300` (2px outline) |

> **Note:** `--palette-blueberry-600` and `--palette-blueberry-700` are **not** defined in this project's token set. Do not reference them.

---

## Share / Export Buttons (`.export-btn`)

Note: The UI label for the export panel now reads `Export`. CSS classes and tokens still use `export` naming (`.export-btn`, `--color-export`) to preserve existing code and styles.

| Token | Hex | Usage |
|---|---|---|
| `--color-export` | `#2E2B74` (blueberry-500) | Export button background |
| `--color-on-export` | `#fff` | Export button text/icon |

## Export Workspace Transparency Indicator

When export `Background` is toggled off, the main export workspace viewport uses a checkerboard alpha indicator to communicate transparency clearly while framing.

| Surface | Style |
|---|---|
| Export workspace transparent background (`.canvas-wrap.is-export-transparent`) | Base `#f0f0f0` with 45deg checker pattern using `rgba(0,0,0,0.08)` tiles |
| Mini export preview transparent background (`.export-preview-wrap.is-transparent`) | Checker pattern with lighter contrast (`rgba(0,0,0,0.06)`) |

---

## Theme Toggle Icons

- Theme toggle icons use Material `bedtime` and `bedtime_off` paths.
- Both canvas and App Settings theme buttons share the same icon path state and label state.

---

## Precision Control Visibility

- Finish strength controls are intentionally hidden unless `Fine tuning for precise control` is enabled.
- This keeps the default surface controls simpler while preserving fine-grain finish adjustment when requested.

---

## Runtime Defaults And Logic

This section documents where startup defaults come from and how reset/auto logic is applied at runtime.

### Build metadata and cache-busting

- `index.html`
	- `ROTATER_BUILD` controls the build shown in the Info panel (`Build x.y.z`)
	- `ROTATER_BUILD_DATE` controls the displayed update date
	- `style.css?v=<build>` should be bumped with each build to avoid stale CSS

### Startup defaults (first-time visitors)

Defaults are layered intentionally:

1. `script.js` -> `DEFAULT_SETTINGS_URL`
2. `index.html` -> `ROTATER_DEFAULT_QUERY` fallback when URL has no query/hash
3. Runtime state defaults in `script.js` (`active*Preset`, auto toggles, etc.)

Current baseline behavior:

- Background default: `Model Sync`
- Surface (build plate) default: `Model Sync`
- Background auto brightness: `on`
- Surface auto brightness: `on`

### Card reset defaults

- `btnResetBackgroundCard` restores:
	- preset: `modelcolor`
	- auto brightness: `on`
	- shade slider: auto-equivalent baseline
- `btnResetBuildPlateCard` restores:
	- preset: `modelcolor`
	- auto brightness: `on`
	- shade slider: baseline (`BUILD_PLATE_DEFAULTS.shade`)

### Auto brightness and shade mapping

`AUTO_BRIGHTNESS_RULES` in `script.js` is the tuning point for auto/manual parity:

- `background.shade = 0` (middle snap)
- `buildPlate.shade = 25` (one snap darker)

Both Background and Surface shade pipelines are now aligned to the same tone function (`computeTonedColor`) so identical snap values produce equivalent color transforms.

When Surface auto brightness is turned off, the manual shade value is set to the auto-equivalent snap (`+25`) so the tooltip and slider reflect the visible state.

### Preset click behavior

- Clicking an already-active preset is a no-op.
- This prevents accidental toggle-away behavior (for example re-clicking active `Model Sync`).

### Surface color rendering model

To avoid unintended gray casts from lighting/IBL, the build plate uses an unlit material path:

- `THREE.MeshBasicMaterial`
- `toneMapped: false`

This keeps Surface shade color driven directly by shade logic rather than scene lighting.

---

## Typography

Source Sans 3 is the only typeface. Size tokens:

| Token | Value | Usage |
|---|---|---|
| `--text-xs` | `0.75rem` | Slider tooltips, size estimates |
| `--text-sm` | `0.8125rem` | Thumb labels, option labels |
| `--text-md` | `0.875rem` | Body / controls |
| `--text-lg` | `1rem` | Section headings |

---

## Border Radius Conventions

| Use | Value |
|---|---|
| Section boxes | `12px` |
| Buttons (pill) | `9999px` |
| Radio pill group | `4px` |
| Canvas overlay buttons | `50%` (circle) |
| Cam nav buttons | `6px` |

---

## color-rules.json Reference

`color-rules.json` is a runtime configuration file loaded at startup via `loadColorRules()` and deep-merged with `DEFAULT_COLOR_RULES` in `script.js` using `mergePlainObject()`. The merged result is stored in the `colorRules` object and read at runtime via `getColorRuleNumber(path, fallback)`.

Keys beginning with `_` (e.g. `_note`, `_formula`, `_states`) are documentation comments and are ignored by the merge logic (they are just inert strings).

### Top-Level Keys

#### `modelShade`
Controls the snap-step behavior of the manual Model Tone slider.

| Key | Type | Description |
|---|---|---|
| `jumpPercent` | number | Size of each shade step as a percentage |
| `snapCount` | number | Total number of snap stops (odd = symmetric around center) |

**Formula:** max effect = `jumpPercent × ((snapCount - 1) / 2)`

---

#### `surfaceShade`
Same snap-step behavior as `modelShade`, but applied to the Background and Build Plate manual shade sliders (only when auto-brightness is OFF).

---

#### `shadeResponse`
Asymmetric scaling of the manual shade curve. `1.0` = full effect; `< 1` softens; `> 1` amplifies.

| Key | Description |
|---|---|
| `lightenScale` | Multiplier applied to the lightening direction |
| `darkenScale` | Multiplier applied to the darkening direction |

---

#### `autoBrightness`
Auto-brightness target shade values for Background and Build Plate. Values are on the same `-100 → +100` scale as the manual shade slider.

| Sub-key | Description |
|---|---|
| `background.shade` | Auto shade for the canvas background |
| `buildPlate.shade` | Auto shade for the build plate |

---

#### `presetShadeDefaults`
Default shade values applied when a user selects a background or model preset. Allows presets like "black" or "ceramic" to start with an appropriate tone.

| Sub-keys | Description |
|---|---|
| `background.white/black/modelcolor/custom` | Background shade on preset select |
| `buildPlate.white/black/modelcolor/custom` | Build plate shade on preset select |
| `model.ceramic/ink/chrome/glass/…/custom` | Model tone on preset select |

---

#### `partInteractionModes`
Visual emphasis rules for **Inspect** and **Multi-Select** modes. Values are percentages where `100` = full/unchanged and lower values fade or desaturate the part.

> **Important:** Keys must exactly match the state names the runtime reads via `getPartInteractionVisualProfile()`. Wrong key names silently fall back to `DEFAULT_COLOR_RULES` (which uses `25%` for `base` states).

**`inspect` states:**

| State key | When it applies |
|---|---|
| `base` | All non-hovered parts while Inspect mode is active |
| `hovered` | The single part currently under the cursor |

**`select` states:**

| State key | When it applies |
|---|---|
| `base` | Parts that are neither selected nor hovered |
| `selected` | Parts that are checked/selected but not currently hovered |
| `hoveredUnselected` | Cursor is over a part that is not yet selected |
| `hoveredSelected` | Cursor is over a part that is already selected |

Each state object accepts:

| Key | Description |
|---|---|
| `opacityPercent` | Opacity (100 = fully opaque, 0 = invisible) |
| `saturationPercent` | Color saturation (100 = full color, 0 = grayscale) |

**Relationship to `DEFAULT_COLOR_RULES`:** Values in `color-rules.json` override only the matching keys; all other keys remain at their code defaults. This means you only need to include the keys you want to customize.
