# MindCubby.com Navigation Strategy

## Current Challenge
- Keep homepage clean and focused on Etsy product cards (primary content)
- Add navigation for: About, Settings, 3D Apps, Labs Apps, Smoothie Design System
- Avoid cluttering the layout

## Proposed Solution: Top-Right Menu Button

### Header Design
```
[Logo/Title] ............................ [Menu Button ☰]
```

**Benefits:**
- Minimal visual footprint - single icon button
- Follows standard mobile/app UX patterns
- Keeps focus on product cards
- Can expand to include all navigation in one place

### Menu Contents (in modal)
1. **About** - Info about MindCubby
2. **Settings** - Theme/Appearance (currently theme + dark mode toggle)
3. **3D Apps** - Links to 3D project apps
4. **Labs** - Links to Labs apps or Labs homepage
5. **Smoothie** - Link to Smoothie Design System

### Implementation Options

**Option A: Hamburger Menu Icon (Recommended)**
- Single ☰ menu icon in top-right
- Opens full-height modal/drawer with navigation links + settings
- Clean, familiar UX pattern
- Settings at bottom of menu

**Option B: Gear Icon (Current Settings Button)**
- Single ⚙️ gear icon
- Opens modal with Settings ONLY (theme/appearance)
- Separate navigation link elsewhere
- Less flexible for future content

**Option C: Dual Button Header**
- Keep both approach but smaller, subtle buttons
- Risk of visual clutter

## Recommended: Option A (Hamburger Menu)

### Benefits:
1. **Visual clarity** - Single button, not multiple
2. **Scalability** - Easy to add more items later
3. **Mobile-friendly** - Natural responsive design
4. **Familiar pattern** - Users expect ☰ for navigation
5. **Content priority** - Products stay front-and-center

### Modal Structure:
```
╔══════════════════════╗
║ About MindCubby   ✕  ║
╠══════════════════════╣
║ 📱 3D Apps           ║
║ 🧪 Labs              ║
║ 🎨 Smoothie Design   ║
╠══════════════════════╣
║ ⚙️ Settings          ║
║   • Theme: All Apps  ║
║   • Appearance       ║
║   [Reset]            ║
╚══════════════════════╝
```

### HTML Structure:
```html
<!-- Header -->
<header>
  <h1>MindCubby</h1>
  <button id="nav-btn" variant="icon">
    <icon name="menu"></icon>
  </button>
</header>

<!-- Navigation Modal -->
<overlay id="nav-modal">
  <nav class="nav-menu">
    <a href="#about">About MindCubby</a>
    <a href="#3d-apps">3D Apps</a>
    <a href="#labs">Labs</a>
    <a href="#smoothie">Smoothie Design System</a>
    
    <hr>
    
    <div class="settings-section">
      <h3>Settings</h3>
      <settings-card hide-reset></settings-card>
    </div>
  </nav>
</overlay>
```

## Next Steps (Implementation Plan)
1. ✅ Design strategy approved
2. Find current header in mindcubby.com
3. Replace top-right buttons with hamburger menu button
4. Create navigation modal with all links + settings
5. Style to match current design
6. Test responsive behavior

## Questions for Approval:
- Is hamburger menu the direction you want?
- Should "About" link to a page or a modal with content?
- Should 3D Apps and Labs open in new tab or navigate internally?
- Any color/style preferences for the menu?
