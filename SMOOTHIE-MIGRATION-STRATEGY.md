# Smoothie Design System: Non-Breaking Migration Strategy
**Status:** Planning Phase  
**Date:** 2026-08-25  
**Goal:** Eliminate Storybook complexity while establishing single source of truth for components

---

## Current Architecture (Today)

```
mindcubby/labs/
├── design-system/
│   ├── src/
│   │   ├── components/        ← ✅ SOLID: 30+ Web Components
│   │   ├── styles/
│   │   ├── tokens/
│   │   ├── utils/
│   │   └── stories/           ← ❌ PAIN: Storybook stories
│   ├── .storybook/            ← ❌ PAIN: Complex config
│   ├── [Components exposed at /labs/design-system/components/]
│   └── [Built Storybook artifacts]
├── timer/
├── tracker/              ← All import from /labs/design-system/components/
├── note/
├── pad/
└── today-list/
```

### How Apps Import Components
```javascript
// From timer/index.html:
<script type="module" src="/labs/design-system/components/labs-button.js"></script>
<link rel="stylesheet" href="/labs/design-system/tokens/colors.css">
<script type="module">
  import { ThemeManager } from '/labs/design-system/utils/theme-manager.js';
</script>
```

**Key Insight:** Apps don't depend on Storybook build—they import directly from source files. We can replace Storybook without breaking anything.

---

## The Problem with Storybook

- ✗ Build complexity (Vite + Storybook overhead)
- ✗ Fragile dependencies (frequent breakage)
- ✗ Image/asset management (links break)
- ✗ High maintenance surface area
- ✗ Slow feedback loop during development
- ✗ Not necessary—components are self-contained

---

## Solution: Three-Tier Architecture (Zero Storybook)

### Tier 1: Component Library (Single Source of Truth)
**Location:** `/mindcubby/libs/smoothie/` ← **NEW, separated from labs**

This is the permanent home for Smoothie components—cleanly separated from Labs apps.

```
mindcubby/libs/
└── smoothie/
    ├── v2.4.9/                 ← Versioned
    │   ├── components/
    │   │   ├── button.js
    │   │   ├── card.js
    │   │   ├── dropdown.js
    │   │   └── [30+ components]
    │   ├── styles/
    │   │   ├── tokens.css
    │   │   ├── flavors.css
    │   │   └── themes.css
    │   ├── utils/
    │   │   ├── theme-manager.js
    │   │   └── [utilities]
    │   ├── CHANGELOG.md
    │   ├── package.json
    │   └── README.md
    └── latest/ ← Symlink to v2.4.9
```

**Benefits:**
- Versioned components (future-proof)
- Clear separation from Labs
- Easy to reference in docs
- Can have multiple versions coexist

### Tier 2: Simple HTML Demo (Replaces Storybook)
**Location:** `/mindcubby/labs/showcase/` ← **NEW, lightweight demo**

A single-file, zero-build HTML showcase that imports and displays components.

```
mindcubby/labs/showcase/
├── index.html           ← Main demo (no build required)
├── components.json      ← Component metadata
└── styles/              ← Just CSS for the showcase UI
    └── demo.css
```

**How it works:**
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/libs/smoothie/latest/styles/tokens.css">
  <link rel="stylesheet" href="/labs/showcase/styles/demo.css">
</head>
<body>
  <nav>
    <a href="#button">Button</a>
    <a href="#card">Card</a>
    <a href="#dropdown">Dropdown</a>
  </nav>

  <section id="button" class="demo-section">
    <h2>Button Component</h2>
    <labs-button>Primary</labs-button>
    <labs-button variant="secondary">Secondary</labs-button>
    <p>HTML: <code>&lt;labs-button&gt;Text&lt;/labs-button&gt;</code></p>
  </section>

  <section id="card" class="demo-section">
    <!-- More components -->
  </section>

  <script type="module" src="/libs/smoothie/latest/components/button.js"></script>
  <script type="module" src="/libs/smoothie/latest/components/card.js"></script>
</body>
</html>
```

**Benefits:**
- ✅ Zero build complexity
- ✅ No Storybook dependencies
- ✅ Fast, static, simple
- ✅ No link breakage (plain HTML)
- ✅ Image/asset management is trivial
- ✅ Can iterate without rebuild

### Tier 3: Gradual App Adoption
**Existing apps (timer, tracker, etc.):** Keep importing from `/labs/design-system/` (no changes needed)

**New projects (Spooler, mindcubby hub):** Import from `/libs/smoothie/latest/`

---

## Migration Path (Non-Breaking)

### Phase 1: Establish Library (Today - 30 min)
- [ ] Create `/mindcubby/libs/smoothie/v2.4.9/` directory structure
- [ ] Copy components from `/labs/design-system/src/` to `/libs/smoothie/v2.4.9/`
- [ ] Create symlink: `/libs/smoothie/latest → v2.4.9`
- [ ] Create simple `package.json` and `README.md`
- [ ] Verify import paths work: `<script src="/libs/smoothie/latest/components/button.js"></script>`

### Phase 2: Build Simple Showcase (1 hour)
- [ ] Create `/labs/showcase/index.html` with component gallery
- [ ] Add basic CSS for demo layout (brutalist, minimal style)
- [ ] Import all 30+ components
- [ ] Add component metadata (props, usage examples)
- [ ] Test locally
- [ ] Deploy to `mindcubby.com/labs/showcase/`

### Phase 3: Migrate DNS/Links (15 min)
- [ ] Keep `/labs/design-system/` as fallback (don't delete yet)
- [ ] Update docs to link to `/labs/showcase/` instead
- [ ] Add redirect from `/labs/design-system/` to `/labs/showcase/` (optional)

### Phase 4: Adopt in New Projects (Ongoing)
- [ ] **Spooler:** Import from `/libs/smoothie/latest/`
- [ ] **New mindcubby hub:** Import from `/libs/smoothie/latest/`
- [ ] **Future projects:** Same pattern

### Phase 5: Gradual Legacy Migration (Optional, Later)
Over time, optionally migrate existing apps:
- [ ] Timer → `/libs/smoothie/latest/`
- [ ] Tracker → `/libs/smoothie/latest/`
- [ ] Note → `/libs/smoothie/latest/`
- [ ] etc.

**Risk:** Minimal, because old apps can stay on `/labs/design-system/` indefinitely.

---

## Why This Works

| Aspect | Old Approach | New Approach |
|--------|-------------|--------------|
| Build complexity | Storybook + Vite | None |
| Where components live | Scattered | `/libs/smoothie/latest/` |
| Demo environment | Fragile Storybook | Simple HTML showcase |
| Can break anything? | Hard to tell | No—clean separation |
| Adding new component | Modify Storybook | Add .js file, update showcase |
| Version management | Implicit | Explicit (`v2.4.9`, `latest`) |
| Adoption in new projects | Complex | Simple import path |
| Migrating old projects | Risky | No pressure—can stay as-is |

---

## Showcase Design (Brutalist Minimal)

Your new mindcubby hub is "brutalist ultra-minimal"—the showcase should match:

```html
<!-- Simple, clean, no-nonsense -->
<style>
  body {
    font-family: monospace;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background: #fff;
    color: #000;
  }
  
  .demo-section {
    border: 1px solid #000;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1rem;
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 1rem 0;
  }
  
  code {
    display: block;
    background: #f5f5f5;
    padding: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }
</style>
```

---

## Implementation Details

### Directory Structure (Post-Migration)
```
mindcubby/
├── libs/
│   └── smoothie/
│       ├── v2.4.9/
│       │   ├── components/
│       │   ├── styles/
│       │   ├── utils/
│       │   ├── package.json
│       │   ├── CHANGELOG.md
│       │   └── README.md
│       └── latest → v2.4.9  [symlink]
│
├── labs/
│   ├── showcase/             ← NEW: Simple HTML demo
│   │   ├── index.html
│   │   ├── styles/
│   │   └── components.json
│   │
│   ├── design-system/        ← OLD: Keep for now (fallback)
│   │   └── [deprecated but still there]
│   │
│   ├── timer/               ← Still works (no changes)
│   ├── tracker/
│   ├── note/
│   ├── pad/
│   ├── today-list/
│   └── postsforpause/
│
└── apps/
    ├── spooler/             ← NEW: Uses /libs/smoothie/latest/
    └── mindcubby-hub/       ← NEW: Uses /libs/smoothie/latest/
```

### Import Paths After Migration

**Old (Labs apps, unchanged):**
```javascript
<script src="/labs/design-system/components/labs-button.js"></script>
```

**New (Spooler, mindcubby hub):**
```javascript
<script src="/libs/smoothie/latest/components/button.js"></script>
```

**Note:** No class name prefix needed—"labs-" was Storybook-specific. Components can be `<button>`, `<card>`, etc.

---

## What Gets Deleted (Later)

After all apps migrated, can remove:
- ✗ `/labs/design-system/.storybook/` config
- ✗ `/labs/design-system/src/stories/` (Storybook stories)
- ✗ `/labs/design-system/` build artifacts (sb-addons, sb-manager, etc.)

**Keep:**
- ✅ `/labs/design-system/src/components/` → migrated to `/libs/smoothie/`

---

## Timeline & Effort

| Phase | Task | Time | Risk |
|-------|------|------|------|
| 1 | Establish component library | 30 min | None |
| 2 | Build HTML showcase | 1 hour | None |
| 3 | Update links/docs | 15 min | None |
| 4 | Adopt in Spooler | 30 min | Low |
| 5 | Adopt in mindcubby hub | 30 min | Low |
| 6+ | Migrate legacy apps | 1-2 hours per app | Very Low |
| **Total (urgent)** | **Phases 1-5** | **~2.5 hours** | **None** |
| **Total (eventual)** | **All phases** | **~5-6 hours** | **None** |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Apps break during migration | Phase 1-3 don't touch any app code |
| Old Storybook still referenced | Redirect `/labs/design-system/` → `/labs/showcase/` |
| Link rot in old URLs | Symlink `/labs/design-system/` or HTTP redirect |
| Confusion about which path to use | Clear README in `/libs/smoothie/` and `/labs/showcase/` |
| Versioning chaos | Explicit versions: `v2.4.9`, `v2.5.0`, etc. + `latest` symlink |

---

## Next Steps

1. **Confirm:** Does this approach feel right?
2. **Clarify:** Are there any apps besides timer/tracker/note/pad/today-list that depend on Storybook?
3. **Start:** Phase 1 (establish library) is the safest first step
4. **Iterate:** Build showcase and test locally before deploying

---

## Reference: Component Import Today

Apps currently import like:
```html
<script type="module" src="/labs/design-system/components/labs-button.js"></script>
<link rel="stylesheet" href="/labs/design-system/tokens/colors.css">
```

After migration, new projects will use:
```html
<script type="module" src="/libs/smoothie/latest/components/button.js"></script>
<link rel="stylesheet" href="/libs/smoothie/latest/styles/tokens.css">
```

Both can coexist indefinitely—zero breaking changes.
