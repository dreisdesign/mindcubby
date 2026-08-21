# note-input-card Component

A custom Web Component for the Daily Note app that provides a reusable note input interface with auto-save, timestamps, and expand/collapse functionality.

## Overview

`<note-input-card>` is a self-contained Web Component that wraps the Labs design system `<labs-card>` component and provides:
- Auto-saving textarea with debounced input events
- Last edited timestamp tracking
- Expand/collapse button for fullscreen note editing
- Semantic component events for state changes
- Full Shadow DOM encapsulation with design system tokens

## File Location

```
docs/note/components/note-input-card.js
```

## Usage

### Basic Implementation

```html
<script type="module" src="./components/note-input-card.js"></script>

<note-input-card id="noteInputCard"></note-input-card>
```

### JavaScript Integration

```javascript
const noteCard = document.getElementById('noteInputCard');

// Set initial value
noteCard.setValue('Hello, world!');

// Get current value
const text = noteCard.getValue();

// Focus the textarea
noteCard.focus();

// Update timestamp
noteCard.setTimestamp(new Date());

// Toggle expanded state
noteCard.toggleExpanded();

// Listen for auto-save events
noteCard.addEventListener('autosave', (e) => {
  console.log('Saving:', e.detail.value);
});

// Listen for expand/collapse
noteCard.addEventListener('expanded-changed', (e) => {
  console.log('Expanded:', e.detail.expanded);
});
```

## API Reference

### Attributes

#### `expanded`
- **Type:** Boolean attribute
- **Default:** Not set (false)
- **Purpose:** Indicates component is in fullscreen expand mode
- **Auto-set by:** `toggleExpanded()` method
- **CSS Hook:** `::host([expanded])` selector for styling

```html
<!-- Component is expanded -->
<note-input-card expanded></note-input-card>
```

### Methods

#### `setValue(text: string) -> void`
Sets the textarea value.

```javascript
noteCard.setValue('Today\'s note text');
```

#### `getValue() -> string`
Returns the current textarea value (without trimming).

```javascript
const currentText = noteCard.getValue();
```

#### `focus() -> void`
Programmatically focuses the textarea.

```javascript
noteCard.focus();
```

#### `setTimestamp(date: Date) -> void`
Updates the displayed "Last edited" timestamp. Formats the time as locale-specific (e.g., "8:17 AM").

```javascript
noteCard.setTimestamp(new Date());
```

#### `toggleExpanded() -> void`
Toggles the expanded state on/off. Internally:
1. Toggles `expanded` attribute
2. Switches button icon (expand_content ↔ collapse_content)
3. Emits `expanded-changed` event

```javascript
noteCard.toggleExpanded();
```

### Events

#### `autosave`
Fired when the textarea input is auto-saved (500ms debounce).

**Event Detail:**
```typescript
{
  value: string  // The trimmed textarea value
}
```

**Example:**
```javascript
noteCard.addEventListener('autosave', (e) => {
  const trimmedText = e.detail.value;
  if (trimmedText) {
    store.saveNote(trimmedText);
  }
});
```

#### `expanded-changed`
Fired when the expand/collapse button is clicked.

**Event Detail:**
```typescript
{
  expanded: boolean  // Current expanded state
}
```

**Example:**
```javascript
noteCard.addEventListener('expanded-changed', (e) => {
  if (e.detail.expanded) {
    console.log('User expanded to fullscreen');
  } else {
    console.log('User collapsed to normal view');
  }
});
```

#### `reset`
Fired when the reset (close/delete) button is clicked.

```javascript
noteCard.addEventListener('reset', () => {
  console.log('Reset button clicked');
});
```

## Shadow DOM Structure

```html
<labs-card>
  <span slot="header">Daily Note</span>
  <labs-button id="expandBtn" slot="close" variant="icon" aria-label="Expand note">
    <labs-icon name="expand_content|collapse_content" slot="icon-left"></labs-icon>
  </labs-button>
  <div slot="input">
    <textarea id="cardInput" placeholder="Write your note here..."></textarea>
  </div>
  <div slot="actions" class="card-footer">
    <span class="last-edited-label">Last edited</span>
    <span class="timestamp" id="timestamp">—</span>
  </div>
</labs-card>
```

## CSS Customization

### Component-Level Styling

The component uses design system CSS custom properties. You can override them at any parent level:

```css
/* Make all note cards have custom styling */
note-input-card {
  --labs-card-padding: 24px;
  --color-primary: #7c3aed;  /* Custom primary color */
}
```

### Scoped CSS Rules

```css
/* Normal state */
:host {
  display: block;
  max-width: 600px;
  margin: 0 auto;
}

/* Expanded fullscreen state */
:host([expanded]) {
  max-width: none !important;
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Expanded card fills available space */
:host([expanded]) labs-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  flex-grow: 1;
}

/* Input slot fills available height */
::slotted([slot="input"]) {
  display: flex;
  flex-direction: column;
  flex: 1;
  flex-grow: 1;
}

/* Textarea expands in fullscreen mode */
:host([expanded]) textarea {
  min-height: auto;
  flex: 1;
  flex-grow: 1;
  resize: none;
}
```

## Integration with Labs Design System

### Components Used
- `<labs-card>` - Container component
- `<labs-button>` - Expand/collapse button
- `<labs-icon>` - Icon for button

### Design Tokens Applied
- `--font-size-base-text` - For timestamp labels
- `--color-on-surface-variant` - For timestamp text color
- `--color-outline` - For textarea border
- `--font-size-display` - For textarea font size
- All card styling through labs-card tokens

## State Management

The component maintains internal state but delegates persistence to the parent application:

### Component State
- `isExpanded` (boolean) - Current expand/collapse state
- Textarea value (in DOM)
- Timestamp (in DOM)

### Parent Application Responsibility
- Listening to `autosave` events and saving to storage
- Listening to `expanded-changed` events and managing layout
- Calling `setTimestamp()` to update display
- Restoring state on page load

## Best Practices

### Do's ✅
- Use component events (`autosave`, `expanded-changed`) to react to changes
- Call `setTimestamp()` after each save
- Restore state in parent application on page load
- Use design system tokens for consistent styling
- Keep component focused on single responsibility (note input)

### Don'ts ❌
- Don't directly manipulate Shadow DOM from outside
- Don't use `<br>` tags in slotted content (use CSS instead)
- Don't bind state directly inside component (use events)
- Don't override component methods from outside
- Don't assume component handles its own persistence

## Accessibility

- Textarea is fully keyboard accessible
- Expand/collapse button has proper `aria-label`
- Icon properly labeled with `aria-label`
- Semantic HTML structure maintained
- ARIA attributes inherited from Labs components

## Performance

- Input auto-save uses 500ms debounce to prevent excessive events
- Shadow DOM provides CSS encapsulation (no style leaks)
- Component initialization is synchronous and lightweight
- No external dependencies beyond Labs components

## Example: Full Integration

```javascript
// Initialize component
const noteCard = document.getElementById('noteInputCard');

// Load saved state on page load
function loadNote() {
  const saved = localStorage.getItem('note-text');
  if (saved) noteCard.setValue(saved);
  
  const expanded = localStorage.getItem('note-expanded') === 'true';
  if (expanded) {
    noteCard.setAttribute('expanded', '');
  }
}

// Auto-save listener
noteCard.addEventListener('autosave', (e) => {
  if (e.detail.value) {
    localStorage.setItem('note-text', e.detail.value);
    localStorage.setItem('note-timestamp', new Date().toISOString());
    noteCard.setTimestamp(new Date());
  }
});

// Expand/collapse listener
noteCard.addEventListener('expanded-changed', (e) => {
  localStorage.setItem('note-expanded', e.detail.expanded);
  // Update layout...
});

// Initialize
loadNote();
```

## Browser Support

- All modern browsers supporting Web Components, Shadow DOM, and ES6
- Chrome/Edge 63+
- Firefox 63+
- Safari 13+
- iOS Safari 13+

## Related Documentation

- [README.md](./README.md) - Main app documentation
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [Labs Design System](../design-system/README.md) - Component library
