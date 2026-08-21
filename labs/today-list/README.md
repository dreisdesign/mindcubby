# Today List App

---
## 🛠️ Development Workflow & AI Chat Policy

For development, use the menu-driven workflow for consistency and automation:

```bash
echo "1" | npm run menu
```

See [Development Workflow Instructions](../../.github/instructions/development-workflow.instructions.md) for the latest workflow and AI Chat task continuation policy. All contributors should follow the explicit options and completion logic described there.

---

A simple daily checklist application that combines the best features of the Tracker and Note apps with a focused, minimalist approach to daily task management.

## 🎯 Concept Overview

**Today List** is a daily reset checklist app designed for simplicity and focus. Each day starts fresh with a clean slate, encouraging users to focus on what matters most for that specific day.

### Core Philosophy

- **Daily Reset**: Like the Note app, the list clears automatically at the end of each day
- **Focused Scope**: Limited to 5 items by default to encourage prioritization
- **Simple Interaction**: Basic checkbox functionality with clear visual feedback
- **Reliable Foundation**: Built on proven patterns from existing apps

## ✨ Version 1.0 - MVP Features

### Core Functionality

- **5 Default Items**: Pre-populated with 5 checklist items, first one shows "add note" placeholder
- **Simple Checkboxes**: Click to toggle checked/unchecked state
- **Guided Entry**: First item includes helpful placeholder text to encourage usage
- **Daily Reset**: Automatically clears all items and states at midnight
- **Responsive Layout**: Works seamlessly across mobile, tablet, and desktop
- **No Scrolling**: Fixed layout that fits within viewport

### UI Components

```
┌─────────────────────────────────┐
│     Tuesday, July 19, 2025      │
│                                 │
│  ☐ add note...                  │
│  ☐ ________________________     │
│  ☐ ________________________     │
│  ☐ ________________________     │
│  ☐ ________________________     │
│                                 │
│           [Settings]            │
└─────────────────────────────────┘
```

### Note entry pattern

Below are small, copy-pasteable patterns for a single note/list entry used in the Today List app. Each example shows the Labs button/icon markup used in the app.

Example — unchecked (mark done button, left aligned):

```html
<div class="labs-autodocs-surface" style="display: inline-block; padding: 1rem; border-radius: 8px; background: var(--color-surface); color: var(--color-on-surface); box-sizing: border-box;">
	<labs-button variant="icon" aria-label="check_box_outline_blank">
		<span slot="icon-left"><labs-icon name="check_box_outline_blank"></labs-icon></span>
	</labs-button>
</div>
```

Example — checked (mark done shown as checked):

```html
<div class="labs-autodocs-surface" style="display: inline-block; padding: 1rem; border-radius: 8px; background: var(--color-surface); color: var(--color-on-surface); box-sizing: border-box;">
	<labs-button variant="icon" aria-label="check_box">
		<span slot="icon-left"><labs-icon name="check_box"></labs-icon></span>
	</labs-button>
</div>
```

Edit (right aligned) — pencil icon button:

```html
<div class="labs-autodocs-surface" style="display: inline-block; padding: 1rem; border-radius: 8px; background: var(--color-surface); color: var(--color-on-surface); box-sizing: border-box;">
	<labs-button variant="icon" aria-label="edit">
		<span slot="icon-left"><labs-icon name="edit"></labs-icon></span>
	</labs-button>
</div>
```

Delete (right aligned) — delete icon button:

```html
<div class="labs-autodocs-surface" style="display: inline-block; padding: 1rem; border-radius: 8px; background: var(--color-surface); color: var(--color-on-surface); box-sizing: border-box;">
	<labs-button variant="icon" aria-label="delete_forever">
		<span slot="icon-left"><labs-icon name="delete_forever"></labs-icon></span>
	</labs-button>
</div>
```

Combined pattern (single entry): checkbox left, text in middle, edit/delete right. Use this as the canonical layout for a note row:

```html
<div class="labs-autodocs-surface" style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 1rem;border-radius:8px;background:var(--color-surface);color:var(--color-on-surface);gap:0.5rem;">
	<!-- Left: mark-done -->
	<div style="display:flex;align-items:center;gap:0.5rem;min-width:0;">
		<labs-button variant="icon" aria-label="check_box_outline_blank">
			<span slot="icon-left"><labs-icon name="check_box_outline_blank"></labs-icon></span>
		</labs-button>
		<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Add note...</div>
	</div>

	<!-- Right: edit + delete -->
	<div style="display:flex;align-items:center;gap:0.25rem;">
		<labs-button variant="icon" aria-label="edit">
			<span slot="icon-left"><labs-icon name="edit"></labs-icon></span>
		</labs-button>
		<labs-button variant="icon" aria-label="delete_forever">
			<span slot="icon-left"><labs-icon name="delete_forever"></labs-icon></span>
		</labs-button>
	</div>
</div>
```

Notes:

- Keep a single tappable target for the checkbox to preserve easy completion interaction on mobile.
- Use `aria-label` on icon-only buttons for accessibility (screen readers).
- The combined example uses safe inline styles for documentation; move styles into the app stylesheet (`styles/main.css`) for production.

### Technical Structure

- **Header**: Day of week and date (e.g., "Tuesday, July 19, 2025")
- **Layout**: Responsive flexbox with sticky footer, allows internal scrolling on long lists
- **Footer**: Settings button with consistent styling from other apps; stays visible during scroll
- **Overlay System**: Edit note overlay for individual item editing (from Note app)
- **Theming**: Full light/dark mode support with toggle
- **Settings Menu**: Consistent with Tracker/Note apps (theme toggle, all apps link)
- **Persistence**: localStorage for same-day persistence
- **Responsive Design**: CSS Grid/Flexbox for reliable layout with iOS-friendly viewport
- **Accessibility**: Proper checkbox semantics and keyboard navigation

### Layout Technical Details

The app uses a modern flexbox layout with:
- **Viewport Height**: `100dvh` (dynamic viewport height) instead of `100vh` for proper Safari URL bar handling
- **Footer Positioning**: `position: sticky; bottom: 0;` to keep the footer visible while scrolling
- **Container Scrolling**: Main container has `min-height: 0; overflow: auto;` to allow internal scrolling when list exceeds viewport
- **This pattern works seamlessly on:**
  - Desktop browsers (Chrome, Firefox, Safari, Edge)
  - iOS Safari with dynamic URL bar
  - iPad with long task lists

## 🏗️ Technical Architecture

### Leveraging Existing Apps

**From Tracker App:**

- Color scheme and theming system (CSS custom properties)
- Dark/light mode toggle functionality
- Settings overlay structure and styling
- Footer layout with settings button
- Responsive design patterns
- Button interaction styles and animations
- PWA manifest structure

**From Note App:**

- Daily reset functionality and date handling
- localStorage management patterns
- Edit overlay system for individual items
- Simple, clean interface approach
- Timestamp header formatting (day/date only)

**New Patterns:**

- Checkbox state management and styling
- List item focus states and interactions
- Fixed-layout responsive design (no scrolling)
- Multiple item persistence (vs single note)

### File Structure

```
today-list/
├── index.html          # Main app structure
├── manifest.json       # PWA configuration
├── sw.js              # Service worker
├── favicon.svg        # App icon
├── styles/
│   └── main.css       # All styles (MVP approach)
├── js/
│   └── main.js        # Core functionality
└── README.md          # This documentation
```

## 🎨 Design Principles (V1 Focus)

### Layout First Approach

1. **Structure Over Style**: Focus on reliable layout mechanics
2. **Responsive Foundation**: Ensure functionality across all devices
3. **Accessibility Core**: Build proper semantics from the start
4. **Progressive Enhancement**: Start simple, add complexity thoughtfully

### Minimal Styling Strategy

- Use system fonts initially
- Simple border/padding for visual structure
- Basic hover states for interaction feedback
- Clean checkbox styling (custom or enhanced native)

## 📱 User Experience

### Daily Workflow

1. **Morning**: Open app to see 5 fresh checklist items (first shows "add note" placeholder)
2. **Throughout Day**: Add tasks and check them off as completed
3. **Evening**: Review completed items for sense of accomplishment
4. **Midnight**: App automatically resets for the next day

### Interaction Patterns

- **Add/Edit Task**: Click on text line or placeholder to open edit overlay (Note app style)
- **Complete Task**: Click checkbox to toggle checked/unchecked state
- **Settings Access**: Click settings button in footer to open overlay
- **Theme Toggle**: Switch between light/dark modes from settings
- **Navigation**: "All Apps" link to return to Labs homepage
- **Visual Feedback**: Checked items show completed state, placeholder guides first entry
- **Keyboard Navigation**: Tab through items, Space to toggle checkboxes, Enter to edit
- **History**: After the current day has been reset - the previous tasks become "archived" and become read only with the caveat that there's a button on hover that allows you to copy it to the current day. Just like the tracker app the previous day gets shown as a list below the current day, but in a grayed out state to indicate it's not editable.

## 🚀 Future Enhancements (Post-MVP)

### Phase 2: Enhanced Functionality

- **Dynamic Item Count**: Setting to choose 3-10 items per day
- **Add/Remove Items**: Plus/minus buttons for daily customization
- **Task Categories**: Optional color coding or icons
- **Quick Actions**: Keyboard shortcuts for common operations

### Phase 3: Advanced Features

- **Progress Tracking**: Weekly/monthly completion statistics
- **Template Lists**: Save frequently used task lists
- **Theme System**: Full dark/light mode integration
- **Export Options**: Share or backup completed lists

### Phase 4: Integration

- **Cross-App Navigation**: Seamless switching between Lab apps
- **Unified Theming**: Consistent design language across all apps
- **Data Insights**: Connection with Tracker for habit correlation

## 🛠️ Development Plan

### Step 1: Foundation (Week 1)

- [ ] Create basic HTML structure with timestamp header (day/date format)
- [ ] Build 5 checkbox/text pairs with proper semantics
- [ ] Add "add note" placeholder to first input field
- [ ] Implement CSS layout system (Grid-based, fixed height)
- [ ] Set up color system and basic theming from Tracker app
- [ ] Add basic JavaScript for checkbox state management
- [ ] Set up localStorage for same-day persistence

### Step 2: Core Functionality (Week 2)

- [ ] Implement daily reset logic and date handling
- [ ] Create edit overlay system (adapted from Note app)
- [ ] Add text input functionality with overlay editing
- [ ] Build settings overlay with theme toggle and all apps link
- [ ] Implement light/dark mode switching
- [ ] Create responsive breakpoints
- [ ] Basic keyboard navigation support

### Step 3: Polish & Integration (Week 3)

- [ ] Add footer with settings button (Tracker app style)
- [ ] Implement consistent button animations and interactions
- [ ] Add service worker for offline functionality
- [ ] Implement PWA manifest
- [ ] Cross-browser testing and fixes
- [ ] Accessibility audit and improvements

### Step 4: Deployment & Labs Integration (Week 4)

- [ ] Add to Labs homepage with consistent styling
- [ ] Create navigation elements and favicon
- [ ] Final testing across devices and themes
- [ ] Documentation and deployment
- [ ] User testing and refinements

## 📊 Success Metrics

### Version 1.0 Goals

- **Functionality**: All 5 checkboxes work reliably with toggle states
- **Header**: Dynamic timestamp showing current day and date
- **Editing**: Smooth overlay editing system for individual items
- **Settings**: Complete settings menu with theme toggle and navigation
- **Theming**: Seamless light/dark mode switching
- **Responsiveness**: Clean layout on mobile/tablet/desktop
- **Performance**: Instant load times, smooth interactions
- **Reliability**: Daily reset works consistently
- **Accessibility**: Screen reader compatible, keyboard navigable
- **Integration**: Consistent with other Labs apps styling and behavior

### Technical Requirements

- **Load Time**: < 1 second on 3G
- **Bundle Size**: < 50KB total (HTML + CSS + JS)
- **Browser Support**: Modern browsers (last 2 versions)
- **Offline**: Basic functionality without internet

## 🔄 Integration with Existing Labs

### Homepage Integration

```markdown
- **[Today List](today-list/)** - Simple daily checklist with automatic reset
```

### Shared Components

- Use existing favicon pattern (`icon-labs--today-list.svg`)
- Leverage Labs color system and typography
- Consistent PWA setup and service worker patterns
- Shared navigation elements for cross-app movement

---

**Development Priority**: Start with reliable functionality, add beauty later.
**Timeline**: 4-week development cycle for MVP
**Philosophy**: Simple, focused, and dependable daily productivity tool.
