# Rotater Roadmap

Updated: 2026-05-04

This file is intentionally split into two buckets:
- Up Next: concrete tasks we should execute soon.
- Idea Stage: valid ideas that are not scheduled yet.

---

## Current State Snapshot

- Multi-part bulk edit MVP is now in place: per-part checkboxes + bulk action banner (apply Color / Shade / Finish).
- Light lock behavior is now user-controllable via a visible toggle (lock light to camera on/off).
- Import package is available in Upload flow, and package export naming now uses Project ZIP wording.

---

## Up Next (Execution Queue)

1. Bulk edit hardening (ship next)
- Add quick actions for Select Visible / Select Hidden in bulk edit.
- Add explicit success + no-op feedback polish for repeated bulk actions.
- Add regression checks for mixed multipart sets (hidden parts, metallic + matte mixes, imported ZIP parts).

2. Upload decision UX simplification
- Replace current warning-style memory flow with explicit segmented default: Always Add / Always Replace / Ask.
- Keep one-click override in modal so users can bypass default per upload.

3. Import/export placement validation
- Confirm final UX location for Import package action now that Upload flow owns import entry.
- Decide whether Export panel should keep only Download Project ZIP or also surface Import.

---

## Idea Stage (Not Scheduled Yet)

### Model Manager (larger scope)
- Full-screen model manager modal: larger thumbnails, rename, reorder (drag), replace, remove, and visibility in one workspace.

### Measurement
- Advanced measure mode: click two mesh points and display live distance labels using raycast + ruler units.

### Undo
- Settings-only undo stack (Cmd/Ctrl+Z) separated from model file load/append/replace actions.

### Optional Product Ideas
- Optional filename label burned into export output.
- Single-click full-screen canvas expand.
- Batch export presets for repeated listing generation.
- Preset gallery with save-as modal.

---

## Dependency Notes

- Full-screen manager should include thumbnail virtualization before enabling very large multipart sessions.
- Advanced measure mode depends on robust raycast hit filtering so hidden parts and transparent materials do not produce incorrect picks.
- Undo should be scoped to settings first to avoid file mutation complexity in early versions.
