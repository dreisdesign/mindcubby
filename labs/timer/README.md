# Focus Timer — Layout and Design Tokens

## Layout Pattern

- The timer group (header, timer, break text) is vertically centered using flexbox:
  - `.app` is a flex column, `height: 100vh`.
  - `.timer-group` uses `flex: 1; align-items: center; justify-content: center;` for centering.
  - `margin-bottom` on `.timer-group` creates the visual offset above the persistent footer.
- The break hint no longer uses `margin-bottom`; spacing is handled by the group margin.

## Typography and Tokens

- **Header:** Uses `--font-size-display` and `--font-weight-heading` for display heading style.
- **Timer:** Large numeric display, bold, responsive font size.
- **Break Hint:** Uses `--font-size-large` and `--color-on-surface` for accessible, themeable text.

## Dynamic UI

- Header text updates based on timer state:
  - "Timer" (default)
  - "Focus" (when running)
  - "Paused" (when paused)
  - "Break" (when on break)
- Break hint text updates:
  - "Next: 5:00 break" (default/focus)
  - "Next: 25:00 focus" (when on break)

## How to Edit

- Edit layout and styles in `docs/timer/index.html`.
- Edit timer logic and dynamic text in `docs/timer/timer.js`.
- All design tokens are defined in `../design-system/tokens/typography.css` and `../design-system/tokens/colors.css`.

## Best Practices

- Use CSS custom properties for all themeable values.
- Use flexbox for centering and responsive layout.
- Use margin on the group container for footer offset, not on individual elements.

---

For more, see the main [Labs Documentation](../README.md) and [Development Workflow](../DEVELOPMENT.md).
