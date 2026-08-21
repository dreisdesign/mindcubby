# Pad V0 - Apple Pencil Drawing App

A minimalist digital drawing pad optimized for Apple Pencil on iPad/iOS devices.

## Features

- **Apple Pencil Support**: Pressure-sensitive drawing with variable line width
- **Touch Events**: Full support for touch and stylus input
- **Design System Integration**: Uses Labs Design System color tokens
- **Responsive Canvas**: Automatically adapts to screen size with high-DPI support
- **Smooth Drawing**: Quadratic curve smoothing for natural drawing feel

## Technical Implementation

### Canvas & Drawing
- HTML5 Canvas with touch-action: none for optimal drawing experience
- High-DPI aware rendering using devicePixelRatio
- Pressure-sensitive line width (2px-8px based on Apple Pencil force)
- Quadratic curve smoothing for natural stroke appearance

### Apple Pencil Detection
- Touch events with `touchType` detection ('stylus' for Apple Pencil)
- Force touch support using `touch.force` property
- Fallback to pointer events for broader stylus support

### Design System Integration
- Uses `--color-surface` for background
- Uses `--color-on-surface` for drawing color
- Imports design system CSS from `../../design-system/src/styles/main.css`
- "Pad V0" label styled with design tokens

### Browser Support
- Safari on iOS (primary target for Apple Pencil)
- Chrome on iOS (limited Apple Pencil support)
- Desktop browsers (mouse/touch fallback)

## File Structure

```
docs/pad/
├── index.html          # Main application (single file)
└── README.md          # This documentation
```

## Usage

1. Open `index.html` in Safari on an iPad
2. Use Apple Pencil or finger to draw on the canvas
3. Pressure sensitivity automatically adjusts line width
4. Canvas fills entire screen for maximum drawing area

## Future Enhancements

- [ ] Color palette selector
- [ ] Brush size controls
- [ ] Undo/Redo functionality
- [ ] Save/Export drawings
- [ ] Multiple drawing tools (pen, marker, eraser)
- [ ] Layer support
