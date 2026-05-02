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

## Export Buttons (`.export-btn`)

| Token | Hex | Usage |
|---|---|---|
| `--color-export` | `#2E2B74` (blueberry-500) | Export button background |
| `--color-on-export` | `#fff` | Export button text/icon |

---

## Theme Toggle Icons

- Theme toggle icons use Material `bedtime` and `bedtime_off` paths.
- Both canvas and App Settings theme buttons share the same icon path state and label state.

---

## Precision Control Visibility

- Finish strength controls are intentionally hidden unless `Fine tuning for precise control` is enabled.
- This keeps the default surface controls simpler while preserving fine-grain finish adjustment when requested.

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
