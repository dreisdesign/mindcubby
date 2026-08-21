# Changelog

All notable changes to the Focus Timer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


# Version 3.0 Powered by Smoothie

---

## [Unreleased]

## [3.0.1] - 2025-11-19 - ThemeManager Integration

### 🔧 Technical Improvements
- **ThemeManager v2 Integration**: Unified app-specific theme/flavor persistence
  - Storage keys: `timer-flavor`, `timer-theme`
  - Seamless persistence across app restarts
  - Centralized singleton utility replaces per-app boilerplate

### 🎨 Features Maintained
- All v3.0.0 features fully functional with new persistence layer
- Timer functionality, styling, and responsive behavior unchanged

## [3.0.0] - 2025-06-09

### Added

- "All Apps" button in settings overlay for navigation back to labs home page

## [2.4.2] - 2025-06-07

### Changed

- **MAJOR**: Implemented tracker-style layout architecture with fixed footer positioning
- **Layout**: Restructured HTML to use `.app` container with proper flex layout
- **Container**: Changed from `.timer-container` to `.app` with `height: 100vh` and proper flex structure
- **Main Content**: Added `.main-content` wrapper for circles with `flex: 1` to fill available space
- **Footer**: Fixed footer positioning using `.bottom-buttons-wrapper` positioned at bottom
- **Button Classes**: Updated to tracker-style naming: `.control-button`, `.control-button--footer`, `.control-button--secondary`
- **Circles**: Maintained much larger circle sizes while preventing cutoffs with improved container layout
- **Responsive**: Enhanced circle scaling with proper space allocation between header, content, and footer

### Added

- Fixed footer with proper safe-area-inset support for mobile devices
- Tracker-style app container architecture for consistent layout
- Border styling on footer for visual separation
- Maximum width constraints on footer buttons container

### Fixed

- Eliminated circle cutoffs through proper container flex layout
- Improved space utilization with tracker-style layout pattern
- Enhanced footer positioning to match professional app design
- Better responsive behavior across all device sizes and orientations

### Technical

- Implemented flex-based layout with `flex: 1` main content area
- Fixed footer using `position: fixed` with proper z-indexing
- Enhanced CSS architecture following tracker app design patterns
- Improved container hierarchy for better layout control

## [2.4.1] - 2025-06-07

### Fixed

- **Desktop Height Scaling**: Fixed circles not scaling properly when browser height increases on desktop
  - Improved viewport unit calculations to respond to both width and height changes
  - Enhanced `min()` functions to better balance vw, vh, and vmin units
  - Added `max-width` constraints to prevent oversize circles
- **Circle Aspect Ratio Protection**: Fixed circles squishing when browser becomes very narrow
  - Added `flex-shrink: 0` to prevent circle deformation
  - Enhanced aspect ratio preservation with better CSS constraints
  - Improved `min()` calculations to maintain perfect circles in extreme viewport sizes
- **Typography Scaling**: Switched from `vmin` to `cqi` (container query units) for more responsive text scaling
  - Font sizes now scale more naturally within circles
  - Better proportion maintenance between circle size and text

### Technical

- Enhanced responsive breakpoints with more robust sizing calculations
- Improved CSS containment for better layout performance
- Better balance between viewport units for optimal scaling across all screen sizes

## [2.4.0] - 2025-06-07

### Added

- **Progressive Web App (PWA) Support**: Complete PWA implementation for standalone app experience
  - Web App Manifest (`manifest.json`) with proper app metadata and icons
  - Service Worker (`sw.js`) for offline functionality and caching
  - PWA meta tags for iOS and Android compatibility
  - Install prompt handling for "Add to Home Screen" functionality
  - Offline cache for all app assets including audio files
  - Background sync and push notification infrastructure (future-ready)
  - Automatic cache management and updates

### Changed

- **Enhanced Mobile Experience**: App now runs in standalone mode when installed
  - Removes browser UI for immersive timer experience
  - Proper theme color and status bar styling
  - Apple Touch Icon and Windows tile configuration
  - Updated all asset URLs to v2.4.0 for cache busting

### Technical

- Service worker registration with update detection
- Comprehensive caching strategy for all static assets
- PWA manifest with proper display mode and orientation settings
- Enhanced offline functionality for uninterrupted timer sessions

## [2.3.7] - 2025-06-07

## [2.3.6] - 2025-06-07

### Fixed

- **iPad Landscape Button Positioning**: Fixed controls sticking to bottom edge
  - Added proper bottom margin: `calc(4rem + env(safe-area-inset-bottom, 2rem))`
  - Ensures buttons have generous spacing from screen edge in landscape mode
  - Maintains safe area compatibility for devices with home indicators

## [2.3.5] - 2025-06-07

### Enhanced

- **Significantly Increased iPad Landscape Padding**: Much more generous spacing for premium feel
  - Body padding: 4rem (up from 2.5rem)
  - Circle container gap: 8vh/8vw (up from 5vh/5vw)
  - Circle container padding: 4vh/6vw (up from 2vh/4vw)
  - Controls padding: 2rem/3rem with 3rem gap (up from 1rem/2rem with 2rem gap)
  - Slightly reduced circle sizes to accommodate increased padding: large 65vh/35vw, small 12vh/7vw

## [2.3.4] - 2025-06-07

### Enhanced

- **iPad Landscape Padding**: Increased padding and spacing for better layout in landscape mode
  - Body padding: 2.5rem (up from default)
  - Circle container gap: 5vh/5vw (up from 4vh/4vw)
  - Circle container padding: 2vh/4vw (up from 1vh/2vw)
  - Controls padding: 1rem/2rem with 2rem gap for better touch targets

## [2.3.3] - 2025-06-07

### Enhanced

- **iPad Portrait Optimization**: Fixed layout for iPad portrait mode to use vertical stacking instead of horizontal
  - Added orientation-based media queries to distinguish portrait vs landscape layouts
  - iPad portrait (768px+ portrait): Keeps vertical layout with optimized circle sizing (75vw large, 15vw small)
  - iPad landscape (768px+ landscape): Uses horizontal layout as intended
  - Wide screens (1024px+): Forces horizontal layout regardless of orientation
  - Desktop (1200px+): Enhanced sizing for large screens
- **Improved Responsive Breakpoints**: More precise device targeting with orientation awareness

## [2.3.2] - 2025-06-07

### Fixed

- **Safari Responsive Issues**: Fixed critical CSS cascade problem causing Safari-specific responsive failures
  - Reordered media queries to proper mobile-first sequence (600px, 768px, 900px)
  - Fixed conflicting flex-direction rules that caused layout inconsistencies in Safari
  - Improved JavaScript Safari detection with gentler layout recalculation (no stylesheet refresh)
  - Added CSS containment properties for better Safari layout performance
- **Cross-Browser Consistency**: Enhanced responsive behavior across all browsers

## [2.3.0] - 2025-06-07

### Changed

- **Mobile-First CSS Architecture**: Converted entire CSS codebase to mobile-first approach
  - Base styles now target mobile portrait (320px+) without media queries
  - Progressive enhancement for larger screens using min-width queries only
  - Removed complex max-width media queries that caused responsive issues
  - Simplified media query structure: 600px+ (tablets), 900px+ (desktops)
- **Enhanced Responsive Behavior**: Layout now responds immediately to browser resize
- **Improved Touch Targets**: Optimized button and circle sizes for mobile interaction
- **Streamlined iOS Safe Area**: Consolidated safe area handling into base styles

### Fixed

- **Immediate Responsive Updates**: Layout changes now apply instantly without requiring page refresh
- **Media Query Conflicts**: Eliminated overlapping and conflicting responsive rules
- **Circle Sizing Consistency**: Perfect 1:1 aspect ratios maintained across all devices

## [2.3.0] - 2025-06-07

### Changed

- **Mobile-First CSS Architecture**: Converted entire stylesheet to mobile-first approach for better responsive behavior
- **Simplified Media Queries**: Removed complex max-width queries in favor of progressive min-width enhancements
- **Enhanced Responsive Performance**: Layout now responds immediately to browser resize without requiring page refresh
- **Streamlined Breakpoints**: Consolidated to three main breakpoints: mobile (default), 600px+, and 900px+
- **Improved iOS Safe Area Handling**: Simplified safe area adjustments while maintaining compatibility

### Technical Details

- Base styles now target mobile portrait (320px+) without media queries
- Progressive enhancement at 600px+ for tablets and larger phones
- Horizontal layout and desktop optimizations at 900px+
- Landscape phone optimizations using orientation and max-height queries
- Reduced CSS complexity from 5+ media query ranges to 3 clean breakpoints

## [2.2.0] - 2025-06-07

### Added

- Project-specific favicon with `icon-labs--focus-timer.*` naming
- Favicon files placed in project root for easy maintenance
- Cache busting parameters for favicon and CSS assets
- Settings overlay with refresh functionality for cache-busting

### Changed

- Updated HTML to reference new favicon assets
- Simplified favicon paths from `assets/` subfolder to project root
- Added cache busting (`?v=2.2.0`) to ensure updated assets load properly

### Fixed

- iPad circle distortion and button layout issues across all orientations
- Header content cutoff due to excessive safe area padding
- iPad landscape mode button cutoff at bottom of screen
- **iPad Landscape Excessive Padding**: iOS landscape adjustments now only target phone-sized devices (max-height: 500px)
- **Desktop Circle Aspect Ratios**: Perfect 1:1 circles maintained by removing conflicting height constraints
- **Button Text Color Consistency**: Explicit black color ensures consistent button text across iOS and desktop
- **Landscape Circle Scaling**: Enhanced circle sizing in landscape mode for better space utilization

### Improved

- **Responsive Design Overhaul**: Replaced complex device-specific media queries with simplified ratio-based approach
- **Consolidated Media Queries**: Using `@media (min-aspect-ratio: 4/3)` for all wider screens (tablets, landscape, desktops)
- **Simplified Landscape Mode**: Streamlined landscape adjustments with consistent button visibility across all devices
- **Perfect Circle Aspect Ratios**: Enhanced circle sizing with proper `aspect-ratio: 1` enforcement using width-only approach
- **Better Touch Targets**: Improved button spacing and sizing across all device types
- **Maintainable CSS**: Significantly reduced number of complex breakpoints and device-specific rules
- **Unified Layout Logic**: Single media query handles both layout direction and sizing for wide screens
- **Enhanced Landscape Scaling**: Circles now use up to 80% of viewport height in landscape mode (was 50%)
- **Optimized Container Padding**: Reduced padding to maximize circle space while maintaining layout integrity

### Technical Improvements

- **Circle Sizing Algorithm**: Removed height constraints, letting `aspect-ratio: 1` handle perfect circles
- **iOS Detection Refinement**: More precise media queries target only phone-sized devices for safe area adjustments
- **Viewport Utilization**: Large circles increased from `min(50vh, max-width: 70%, 50vmin)` to `min(80vh, 45vw)` in landscape
- **Layout Optimization**: Horizontal layout with improved spacing and proportions for wide screens

## [2.1.0] - 2025-05-27

### Added

- **Interactive Circles**: Circles are now clickable and function as large touch targets for play/pause
- **Smart Button Text**: Button now shows "Resume" when paused (after being started) vs "Start" for new sessions
- **Enhanced Touch Experience**: Visual feedback on circle hover and press interactions
- **Improved Accessibility**: Larger interactive areas for better mobile usability

### Changed

- **User Interface**: Circles now provide visual feedback (scale effects) when interacted with
- **Button Logic**: More intuitive button text that reflects the actual action available
- **Touch Targets**: Significantly expanded interactive areas especially beneficial on mobile devices

### Technical Improvements

- **Event Handling**: Added click event listeners to both work and break circles
- **State Management**: Enhanced timer state tracking with `hasStarted` property
- **CSS Enhancements**: Added cursor pointer, hover, and active states for circles
- **User Feedback**: Smooth scaling transitions for interactive elements

## [2.0.1] - 2025-05-27

### Improved

- **Mobile Experience**: Significantly increased circle sizes on mobile devices for better touch interaction
- **Responsive Design**: Enhanced mobile-specific media queries for optimal circle sizing
- **Touch Usability**: Circles now use up to 95% of viewport on small screens

### Changed

- **Circle Sizing**: Updated base circle sizes from 75vw/60vmin to 85vw/70vmin
- **Mobile Optimization**: Added progressive sizing for tablets (90vw) and phones (95vw)
- **Aspect Ratio Maintenance**: Preserved 5:1 ratio between large and small circles across all screen sizes

### Technical Details

- **Media Queries**: Added specific breakpoints for ≤768px and ≤480px screen widths
- **Viewport Units**: Enhanced use of `min()` function with multiple viewport constraints
- **Touch Targets**: Improved accessibility compliance for mobile touch interfaces

## [2.0.0] - 2025-05-27

### Added

- **Version Display**: Added version number display in top-right corner
- **Version Management**: Integrated with automated version update system
- **Project Infrastructure**: Added proper versioning support for deployment workflows

### Changed

- **Version Tracking**: Now properly tracks and displays version information
- **Development Workflow**: Enhanced with automated version management tools
- **Project Structure**: Aligned with other projects in the labs workspace

### Technical Improvements

- **CSS Styling**: Added version number styling with fixed positioning
- **HTML Structure**: Enhanced with version display element
- **Project Standards**: Implemented consistent versioning across all lab projects

## [1.0.0] - 2025-05-24

### Added

- **Initial Release**: Complete Focus Timer application
- **Core Timer Functionality**:
  - 25-minute work sessions with countdown display
  - 5-minute break sessions with countdown display
  - Automatic session switching between work and break
  - Play/pause/reset controls
- **Visual Design**:
  - Bold numeric countdown timer display
  - 5:1 size ratio between large work circle and small break circle
  - Perfect 1:1 aspect ratio circles maintained on all screen sizes
  - Minimalist, distraction-free interface
- **Responsive Layout**:
  - Portrait mode: circles stacked vertically
  - Landscape mode: circles arranged horizontally
  - Mobile-optimized touch targets and spacing
  - Viewport-based scaling using `vmin` units
- **Audio Integration**:
  - Modular overlays for reset confirmation
  - Automatic play/pause with session state
  - Silent break periods for mental rest
- **Technical Implementation**:
  - Pure vanilla JavaScript (no dependencies)
  - CSS Grid and Flexbox for layout
  - CSS `aspect-ratio` for perfect circles
  - Container queries for responsive typography
  - Modern CSS custom properties for theming

### Technical Details

- **CSS Framework**: Custom responsive design system
- **JavaScript**: ES6+ class-based architecture
- **Audio Format**: MP3 with proper fallback handling
- **Browser Support**: Modern browsers with CSS Grid and aspect-ratio support
- **File Size**: Lightweight single-file application
- **Performance**: 60fps smooth animations and transitions

### Features in Detail

- **Session Management**: Automatic work/break cycling with proper state tracking
- **Progress Visualization**: Conic gradient progress rings with smooth updates
- **Status Feedback**: Clear text status for current session state
- **Time Display**: Real-time countdown with MM:SS format
- **Control Interface**: Simple two-button control system (Start/Pause, Reset)
- **Audio Control**: Integrated music player with session-aware playback

### Browser Compatibility

- Chrome 88+ (CSS aspect-ratio support)
- Firefox 87+ (CSS aspect-ratio support)
- Safari 14+ (CSS aspect-ratio support)
- Edge 88+ (CSS aspect-ratio support)

### Accessibility

- Semantic HTML structure with proper headings
- High contrast visual design
- Clear status updates for screen readers
- Keyboard-accessible controls
- Touch-friendly mobile interface
