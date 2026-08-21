# Today-List App Migration to Complete Design System
**Date**: October 9, 2025  
**Branch**: feature/today-list-footer  
**Goal**: Rebuild Today-List using complete modular design system

---

## Migration Overview

Refactor the Today-List app from a complex 796-line implementation to a clean, modular design system implementation based on the footer-test reference page and proven Tracker migration pattern.

### Reference Implementations
- **Primary**: `docs/footer-test/index.html` (209 lines, zero hacks)
- **Pattern Source**: `docs/tracker/` (successful migration, 102 HTML + 166 JS lines)
- **Process Guide**: `_dev/_documents/APP-MIGRATION-PROCESS.md`
- **Quality**: Production-ready, fully modular

### Current State
- **HTML**: `docs/today-list/index.html` (281 lines with custom styling)
- **JavaScript**: `docs/today-list/today-list-demo.js` (796 lines - complex)
- **Issues**: 
  - Custom CSS for layout and positioning
  - Manual DOM manipulation with inline styles
  - Complex overlay management
  - Outdated component usage (labs-header vs labs-template-header-wrapped)
  - Custom theme management (should use design system utils)
- **Good Parts**: 
  - Working todo functionality (add, check, archive, restore)
  - localStorage persistence
  - Undo functionality via toast

---

## Analysis: Current vs. Target

### Current Architecture Issues
1. **796 lines of JavaScript** - excessive complexity
2. **Custom theme management** - duplicates design system utils
3. **Manual DOM creation** - should use component slots
4. **Inline styles** - violates modularity
5. **Custom overlay logic** - should use labs-footer-with-settings
6. **Multiple storage functions** - can be simplified

### Target Architecture (Based on Tracker Success)
1. **~100-150 lines JavaScript** - simplified with design system
2. **Use applyTheme() from utils** - no custom theme code
3. **Slot-based rendering** - clean component usage
4. **CSS custom properties only** - no inline styles
5. **labs-footer-with-settings** - built-in settings overlay
6. **Simplified store pattern** - load/save methods only

### Key Differences from Tracker
- **Checkboxes**: Today-List needs interactive checkboxes (Tracker just displays)
- **Archive/Restore**: Today-List has archived items section (Tracker deletes permanently)
- **Text Input**: Today-List needs text editing (Tracker just timestamps)
- **Metric**: Both need count metric (reuse same pattern)

---

## Migration Strategy

### Phase 1: Template Foundation ✅ COMPLETE
**Goal**: Create clean HTML structure from footer-test + Tracker patterns
**Time Estimate**: 30 minutes

**Tasks**:
1. ✅ Backup current files (.backup)
2. ✅ Create new `index.html` based on footer-test
3. ✅ Update title to "Labs: Today-List"
4. ✅ Keep `today-list-*` localStorage keys
5. ✅ Add Today-List specific components:
   - labs-template-header-wrapped
   - labs-metric-card (for item count)
   - labs-list-item (with checkbox support)
   - labs-dropdown (for item actions)
   - labs-icon
   - labs-footer-with-settings
   - labs-toast
   - labs-input-card (for adding items)
   - labs-overlay
   - labs-details
6. ✅ Set up basic layout (no custom CSS)
7. ✅ Test that template loads correctly

**Checkpoint**:
- [x] Template loads with design system
- [x] Theme switching works
- [x] Footer visible and functional
- [x] Settings overlay accessible
- [x] No console errors

**Expected Outcome**:
- HTML: <150 lines
- Zero CSS hacks or `!important`
- Clean slot-based rendering
- All design system components loading correctly

**Results**:
- HTML: 144 lines (under 150 ✓) → 138 lines after fixes
- JavaScript: 269 lines (down from 796) → 278 lines with welcome card
- Zero CSS hacks
- Clean component imports
- Proper toast singleton with handler cleanup
- Simplified input overlay management
- labs-card variant="welcome" for empty state

**Issues Found & Fixed**:
1. **Input card buttons not working** - Changed event listeners from submit/cancel to save/close to match component API
2. **Empty state inconsistency** - Replaced div with labs-card variant="welcome" to match design system patterns

---

### Phase 2: JavaScript Modernization ⬜
**Goal**: Simplify main.js using design system patterns
**Time Estimate**: 60 minutes (more complex than Tracker)

**Tasks**:
- ⬜ Create new `js/main.js` (move from today-list-demo.js)
- ⬜ Import design system utils (applyTheme, formatHuman if needed)
- ⬜ Refactor data store (keep localStorage structure):
  ```javascript
  const store = {
    items: [],
    load() { /* simple JSON.parse */ },
    save() { /* simple JSON.stringify */ }
  }
  ```
- ⬜ Simplify metric card updates (use slots, same as Tracker)
- ⬜ Modernize list rendering:
  - Use labs-list-item with checkbox slot
  - Use labs-dropdown for actions
  - Clean slot-based pattern
- ⬜ Implement undo toast pattern (from Tracker):
  - Toast singleton with cleanup
  - Handler stacking prevention
- ⬜ Remove custom theme management (use design system utils)
- ⬜ Remove manual DOM positioning logic
- ⬜ Simplify input overlay handling

**Anti-Patterns to Remove**:
- ❌ Custom `applyTheme()` - use design system version
- ❌ Inline styles in JavaScript
- ❌ Complex DOM manipulation
- ❌ Manual event listener cleanup complexity

**Expected Outcome**:
- JavaScript: ~150 lines (more than Tracker due to checkbox logic)
- Clean, readable code
- Proper component usage
- Zero custom CSS in JavaScript

---

### Phase 3: Data & Features ⬜
**Goal**: Restore all Today-List functionality
**Time Estimate**: 45 minutes

**Tasks**:
- ⬜ Add button creates new todo
- ⬜ Input overlay for entering todo text
- ⬜ Checkbox toggles complete/incomplete
- ⬜ Archive functionality with undo toast
- ⬜ Restore from archive with undo toast
- ⬜ Delete with undo toast
- ⬜ Reset-all with undo toast
- ⬜ Metric displays correct count (active items)
- ⬜ List renders with checkboxes
- ⬜ Archived section collapses/expands
- ⬜ Data persists across page reloads
- ⬜ Empty state displays when no items

**Key Features**:
1. **Add Todo**: Input overlay → save → render
2. **Toggle Complete**: Checkbox click → update state → save
3. **Archive**: Dropdown action → move to archived → undo toast
4. **Restore**: Dropdown action → move to active → undo toast
5. **Delete**: Dropdown action → remove → undo toast
6. **Reset-all**: Footer action → clear all → undo toast

**Expected Outcome**:
- Full feature parity with original
- All interactions working
- Proper error handling
- Undo functionality for all destructive actions

---

### Phase 4: Polish & Testing ⬜
**Goal**: Visual consistency and quality assurance
**Time Estimate**: 45 minutes

**Tasks**:
- ⬜ Visual comparison with footer-test
- ⬜ Verify borders on list items and metric card
- ⬜ Test light/dark mode switching
- ⬜ Test all three flavors (Blueberry, Strawberry, Vanilla)
- ⬜ Verify theme persistence
- ⬜ Mobile responsiveness check
- ⬜ Test all undo operations
- ⬜ Verify checkbox interactions
- ⬜ Test archived section expand/collapse
- ⬜ Verify input overlay behavior
- ⬜ Toast positioning (not blocking footer)
- ⬜ Keyboard navigation

**Expected Outcome**:
- Visually consistent with design system
- All functionality polished
- No console errors
- Production-ready code

---

## Timeline

- **Phase 1**: ⬜ 30 minutes (Template Foundation)
- **Phase 2**: ⬜ 60 minutes (JavaScript Modernization)
- **Phase 3**: ⬜ 45 minutes (Data & Features)
- **Phase 4**: ⬜ 45 minutes (Polish & Testing)

**Total Estimate**: ~3 hours

---

## Success Criteria

### Code Quality
- [ ] HTML under 150 lines
- [ ] JavaScript under 200 lines (more complex than Tracker)
- [ ] Zero CSS hacks or `!important`
- [ ] All design system tokens used correctly

### Functionality
- [ ] Add todo works
- [ ] Checkbox toggles work
- [ ] Archive/restore/delete work
- [ ] Undo functionality works
- [ ] Metric count accurate
- [ ] Theme/flavor persistence works
- [ ] Data persists across reloads

### Visual Consistency
- [ ] Matches footer-test aesthetic
- [ ] Borders visible on cards and list items
- [ ] Spacing matches design system
- [ ] Dark mode renders correctly
- [ ] All flavors display properly

---

## Lessons from Tracker Migration

### Apply These Patterns ✅
- Start with footer-test template
- Use labs-footer-with-settings (not custom footer)
- Use design system utils (applyTheme, formatHuman)
- Implement toast singleton with handler cleanup
- Use component slots (not manual DOM)
- Prevent handler stacking with _currentUndoHandler pattern

### Avoid These Pitfalls ❌
- Don't duplicate theme management
- Don't use inline styles
- Don't fight shadow DOM
- Don't manually position elements
- Don't hardcode colors/spacing

---

## References

- **Tracker Migration**: `docs/tracker/MIGRATION-2025-10-08.md`
- **Process Guide**: `_dev/_documents/APP-MIGRATION-PROCESS.md`
- **Footer Test**: `docs/footer-test/index.html`
- **Design System**: `design-system/src/components/`

---

**Status**: Phase 1 In Progress  
**Last Updated**: October 9, 2025
