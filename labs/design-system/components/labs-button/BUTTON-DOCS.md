
# Labs Button Component — Controls & Configuration

This is the canonical documentation for the modular `<labs-button>` component. All controls, options, and usage patterns are listed below. For live examples, see Storybook: **Patterns/Buttons**.

For the design system philosophy and metaphor, see the [Smoothie Design System Overview](../../smoothie.md).

---


## Button Smoothie Table

| Option Type   | Control      | Add         | Comment      | Reset All    | Custom |
|-------------- |------------- |-------------|--------------|--------------|--------|
| Single Select | Variant      | Primary     | Icon         | Destructive  | Choose |
| Single Select | Size         | Large       | Medium       | Medium       | Choose |
| Single Select | Icon Left    | Add         | Comment      | Reset        | Choose |
| Single Select | Icon Right   |             |              |              | Choose |
| Text          | Label        | Add         |              | Reset All    | Choose |

**How to read:**
- Each column is a button preset (a "Smoothie Recipe").
- Each row is an ingredient (option/prop), with its Option Type: Variant, Size, Icon Left, Icon Right, Label.
- "Custom" lets you mix any combination.

**Option Types:**
- Single Select: Choose one from a list (Variant, Size, Icon Left, Icon Right)
- Text: Freeform label

**Variant mapping:**
- See the [Variants & Themes](../../smoothie.md#-variants--themes-the-smoothie-flavor-system) section for how each Variant maps to real color tokens and styles.
- Example: `Add` uses the Primary variant (see table for tokens), `Reset All` uses Destructive, etc.

**Metaphor:**
- Each button config is a smoothie recipe; each option is an ingredient.

---

## Example: Add Button

```html
<labs-button variant="primary" size="large" icon-left="add">
  Add
</labs-button>
```

---

## Usage Notes
- Use `variant` for button style (primary, secondary, destructive, icon-only)
- Use `size` for button size (small, medium, large)
- Use `icon-left`/`icon-right` for icon placement (optional)
- All icons are available via the `labs-icon` registry
- For full API and slot details, see the main README or Storybook

---

## Reference
- [Storybook: Patterns/Buttons](../../../../storybook-static/index.html?path=/docs/patterns-buttons--docs)
- [Button Configs Source](../../tokens/button-configs.js)
 - [Color Tokens & Theme Docs](../styles/COLORS-DOCS.md)

---

This file is the single source of truth for button controls and options. Archive or remove all other button docs unless specifically needed.
