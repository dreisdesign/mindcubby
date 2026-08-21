# Daily Note App

A simple yet powerful note-taking app that clears at the end of each day. Perfect for daily thoughts, tasks, or reminders.

## ✨ Features

### Core Functionality
- **Single note interface** that resets daily at midnight
- **Auto-save** with 500ms debounce on text input
- **Fullscreen expand/collapse** button to maximize note editing space
- **Last edited timestamp** tracking with persistent state
- **Undo functionality** for accidentally cleared notes
- **Note label customization** (persistent across sessions)

### Appearance & Theming
- **Dark mode support** with system preference detection
- **Multiple color themes** (Blueberry, Strawberry, Vanilla)
- **Responsive design** for mobile and desktop
- **Accessible header** with two-line date formatting (semantic CSS line breaks)

### Technical Features
- **Progressive Web App (PWA)** with service worker
- **iOS home screen installation** support
- **State persistence** across browser sessions
- **Keyboard accessibility** improvements
- **Design system integration** with Labs components

## 🚀 Getting Started

Simply open `index.html` in your browser to use the app locally.

### Installation as PWA
1. Open the app in a supported browser
2. Tap the "Install" or "Add to Home Screen" option
3. The app will work offline and appear as a native app

## 📝 Usage

### Basic Note Taking
1. Start typing directly in the note card to auto-save
2. The timestamp updates automatically on each save
3. Your note persists until midnight

### Expand View
1. Click the expand button (↗️) in the top-right corner
2. Note card fills the entire screen for distraction-free writing
3. The expanded state persists on page refresh
4. Click collapse button (↙️) to return to normal view

### Customization
- Click the settings icon to:
  - Toggle dark/light mode
  - Change color theme (Blueberry, Strawberry, Vanilla)
  - Reset today's note manually

### Undo
- If you accidentally clear your note, click "Undo" in the toast notification
- The cleared note is restored (within the undo window)

## 🏗️ Architecture

### Component Structure
```
docs/note/
├── index.html              # Main app shell
├── components/
│   └── note-input-card.js  # Custom web component for note editing
├── js/
│   └── main.js             # Application logic and state management
└── styles/
    └── [design system tokens]
```

### Key Technologies
- **Web Components** with Shadow DOM encapsulation
- **Design System** (Labs components: container, card, button, icon, etc.)
- **localStorage** for state persistence
- **Service Worker** for PWA functionality
- **Vanilla JavaScript** (no frameworks)

### Layout Technical Details

The app uses a modern flexbox layout with:
- **Viewport Height**: `100dvh` (dynamic viewport height) instead of `100vh` for proper Safari URL bar handling
- **Footer Positioning**: `position: sticky; bottom: 0;` to keep the footer visible while scrolling
- **Container Scrolling**: Main container has `min-height: 0; overflow: auto;` to allow internal scrolling
- **This pattern works seamlessly on:**
  - Desktop browsers (Chrome, Firefox, Safari, Edge)
  - iOS Safari with dynamic URL bar
  - iPad with long notes

## 📦 Component API

### `<note-input-card>`

#### Attributes
- `expanded` - Set when card is in fullscreen mode

#### Methods
- `setValue(text)` - Set the textarea value
- `getValue()` - Get the textarea value
- `focus()` - Focus the textarea
- `setTimestamp(date)` - Update the displayed timestamp
- `toggleExpanded()` - Toggle expanded state

#### Events
- `autosave` - Fired when text auto-saves (debounced 500ms)
- `reset` - Fired when reset button clicked
- `expanded-changed` - Fired when expand/collapse toggled with `{ expanded: boolean }` detail

#### CSS Custom Properties
All styling uses design system tokens (colors, spacing, typography, etc.)

## 🔄 Data Persistence

### localStorage Keys
- `note-YYYY-MM-DD` - Today's note text
- `note-YYYY-MM-DD-lastEdited` - Last edit timestamp
- `note-expanded` - Current expanded state (true/false)
- `note-label` - Custom note label
- `note-flavor` - Current theme (blueberry, strawberry, vanilla)
- `note-theme` - Light/dark mode preference
- `note-reset-enabled` - Whether reset feature is enabled

### Daily Cleanup
Old notes from previous days are automatically cleaned up on load to save storage.

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ iOS Safari (PWA support)
- ✅ Chrome for Android (PWA support)

## 🧪 Testing

Run the functionality test suite:
```bash
node test-functionality.js
```

Tests cover:
- Data store methods and persistence
- Event listener setup
- Component API availability
- Undo functionality
- localStorage management

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Latest (v5.0.0)
- ✨ Expand/collapse fullscreen button
- ✨ State persistence across sessions
- ✨ Two-line semantic header date
- ✨ Proper flex layout for vertical fill
- 🔄 Design system component integration (container, card, button, icon)
- 📱 Full responsive and PWA support

## 🤝 Contributing

See [../../CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## 📄 License

This project is part of the Labs repository. See [LICENSE](../../LICENSE) for details.
