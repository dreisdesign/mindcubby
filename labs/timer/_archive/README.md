# Focus Timer v2.4.2

---
## 🛠️ Development Workflow & AI Chat Policy

For development, use the menu-driven workflow for consistency and automation:

```bash
echo "1" | npm run menu
```

See [Development Workflow Instructions](../../.github/instructions/development-workflow.instructions.md) for the latest workflow and AI Chat task continuation policy. All contributors should follow the explicit options and completion logic described there.

---

A beautifully designed, minimalist Focus Timer Progressive Web App (PWA). Built with vanilla HTML, CSS, and JavaScript for a distraction-free focus experience that works as a standalone app on any device.

## Features

### Progressive Web App (PWA)

- **Standalone App Experience**: Install on any device and run without browser UI
- **Offline Functionality**: Works completely offline once installed
- **Add to Home Screen**: Install directly from browser on iOS, Android, and desktop
- **Native App Feel**: Proper splash screen, icons, and theme colors
- **Cross-Platform**: Works on iOS, Android, Windows, macOS, and Linux
- **Automatic Updates**: Service worker handles app updates seamlessly

### Core Functionality

- **25/5 Pomodoro Method**: 25-minute work sessions followed by 5-minute breaks
- **Visual Progress Indicators**: Two circular progress rings showing work and break time
- **Audio Integration**: Focus music plays during work sessions to enhance concentration
- **Session Management**: Automatic switching between work and break sessions
- **Version Display**: Current version shown in top-right corner for easy reference
- **Interactive Circles**: Click anywhere on the circles to start/pause the timer
- **Smart Controls**: Button shows "Resume" when paused vs "Start" for new sessions

### Design & Usability

- **Responsive Layout**: Perfect circles that maintain 1:1 aspect ratio on all devices
- **Enhanced iPad Support**: Optimized layouts for both portrait and landscape orientations
- **Safari Compatibility**: Fixed responsive design issues with dynamic layout recalculation
- **5:1 Size Ratio**: Large work circle is exactly 5x the size of the small break circle
- **Minimalist Interface**: Clean, distraction-free design focused on the task at hand
- **Viewport Scaling**: Uses `vmin` units for reliable scaling across all screen sizes
- **Mobile Optimized**: Touch-friendly controls and responsive design
- **Version Indicator**: Subtle version number display for tracking updates
- **Interactive Elements**: Circles provide visual feedback with hover and click animations
- **Enhanced Touch Targets**: Large clickable areas for improved mobile interaction

### Technical Features

- **Progressive Web App**: Full PWA implementation with service worker and offline support
- **Pure Frontend**: Zero dependencies, works entirely in the browser
- **Perfect Circles**: CSS aspect-ratio ensures perfect 1:1 circles regardless of screen size
- **Mobile-First Design**: CSS media queries ordered for optimal responsive behavior
- **Container Queries**: Uses modern CSS for optimal typography scaling
- **Audio Controls**: Integrated focus music with proper play/pause handling
- **Interactive Interface**: Click event handlers on circles for enhanced user experience
- **Smart State Management**: Tracks timer state for intelligent button text updates
- **Offline Caching**: Service worker caches all assets for offline functionality

## How to Use

### Installation (Recommended)

1. **Open in Browser**: Navigate to the timer URL in your browser
2. **Install as App**:
   - **iOS**: Tap Share → "Add to Home Screen"
   - **Android**: Tap menu → "Install app" or "Add to Home screen"
   - **Desktop**: Click install icon in address bar or use browser menu
3. **Launch**: Open the installed app for a full-screen, native experience

### Basic Usage

1. **Start a Focus Session**: Click the "Start" button or tap anywhere on the large circle to begin a 25-minute work session
2. **Monitor Progress**: Watch the large circle fill as time progresses
3. **Take Breaks**: After work completion, a 5-minute break automatically begins
4. **Pause/Resume**: Click "Pause"/"Resume" button or tap the circles to pause/resume the timer
5. **Reset**: Use the "Reset" button to return to the beginning of a work session

### Interactive Controls

- **Circle Interaction**: Both circles are clickable and act as large touch targets for start/pause
- **Smart Button Text**: Button shows "Start" for new sessions and "Resume" when resuming paused timers
- **Visual Feedback**: Circles provide hover and press animations for better user experience

## Technical Details

### Layout System

- **CSS Grid/Flexbox Hybrid**: Grid for overall structure, flexbox for responsive orientation
- **Viewport Units**: Primary sizing uses `vmin` for consistent scaling
- **Aspect Ratio**: CSS `aspect-ratio: 1` ensures perfect circles
- **Container Queries**: `cqi` units for responsive typography within circles

### Responsive Breakpoints

- **Mobile-First Architecture**: Properly ordered CSS media queries (600px → 768px → 900px)
- **Orientation-Aware Design**: Specific layouts for portrait and landscape orientations
- **iPad Optimized**: Dedicated breakpoints for tablet portrait and landscape modes
- **Safari Enhanced**: Fixed responsive issues with dynamic layout recalculation
- **Wide Screen Support**: Horizontal layout for desktop and large tablet landscape

### PWA Implementation

- **Service Worker**: Comprehensive caching strategy for offline functionality
- **Web App Manifest**: Defines app appearance and behavior when installed
- **Install Prompts**: Handles browser install prompts for seamless installation
- **Background Sync**: Infrastructure ready for future timer state persistence
- **Push Notifications**: Framework prepared for timer completion alerts

### Audio Integration

- **Work Session Music**: 25-minute focus music track
- **Auto Play/Pause**: Music automatically starts/stops with work sessions
- **Break Silence**: No audio during break periods for mental rest

## File Structure

```
timer/
├── index.html          # Main application file with embedded JavaScript
├── styles.css          # Complete styling and responsive design
├── manifest.json       # PWA manifest defining app metadata
├── sw.js              # Service worker for offline functionality
├── README.md           # This documentation
├── CHANGELOG.md        # Version history and updates
└── assets/
    ├── click-1.mp3     # UI click sound
    ├── click-2.mp3     # Alternative click sound
    └── focus-drums-25.mp3  # 25-minute focus music track
```

## Browser Compatibility

- **PWA Support**: Chrome 67+, Firefox 79+, Safari 15.4+, Edge 79+
- **Modern Browsers**: Chrome 88+, Firefox 87+, Safari 14+, Edge 88+
- **CSS Features Used**:
  - CSS Grid and Flexbox
  - CSS Custom Properties (variables)
  - `aspect-ratio` property
  - `vmin` viewport units
  - Container queries (`cqi` units)
  - Orientation media queries
- **PWA Features**:
  - Service Workers
  - Web App Manifest
  - Add to Home Screen
  - Offline caching

## Development

To run locally:

1. Clone or download the project
2. Start a local server (required for PWA features):
   ```bash
   cd timer
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser
4. No build process or dependencies required

### PWA Testing

- Test service worker registration in DevTools → Application → Service Workers
- Test manifest in DevTools → Application → Manifest
- Test offline functionality by disabling network in DevTools
- Test installation prompts on supported browsers

## Accessibility

- Semantic HTML structure
- High contrast design
- Clear visual feedback for all states
- Keyboard accessible controls
- Screen reader friendly status updates

## License

Open source under the [MIT License](../LICENSE).
