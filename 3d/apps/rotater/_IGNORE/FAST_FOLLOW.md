Fast Follow — Tiny UI Issues

Summary:
- Tabs rounded border is creating a visible white fringe/edge on the tab background.
- Export and Download buttons sit slightly higher (vertical offset) compared to the filename and Upload buttons in the same header/row.

Repro steps:
1. Open the ROTATER app in the browser.
2. Observe the top tabs (left) — note white edge where rounded border meets background.
3. Observe header row with filename + Upload and Export + Download buttons — compare vertical alignment.

Notes / Suggested fixes:
- Tabs rounded border white fringe: likely due to background color bleed when using `border-radius` plus a different parent/background color or an outline/box-shadow. Inspect CSS for the tab container and tab button; try:
  - Ensuring the tab element background matches the parent or remove the white background from tab element.
  - Removing any `outline` or `box-shadow` that may be drawing a white edge.
  - Use `background-clip: padding-box;` on the tab element to avoid anti-aliased border artifacts.

- Export/Download vertical offset: alignment likely due to differing `line-height`, padding, or `height` on button variants. Suggested checks:
  - Compare `height`, `padding`, `line-height`, and `vertical-align` between `.btn--file` and `.btn--export` classes.
  - Normalize both to use the same `--button-height` and center content with `display: inline-flex; align-items: center;`.
  - If icons differ in size, ensure icon `vertical-align: middle` and consistent `width`/`height`.

Priority: very low (cosmetic). No functional impact; recommended follow-up before next minor release.

Filed by: developer notes (fast follow)
Date: 2026-04-30
