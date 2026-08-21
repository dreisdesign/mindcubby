# Today List — Roadmap

**Last reviewed**: November 16, 2025  
**Status**: Phase 1 migration complete; planning Phase 2 features

This document tracks longer-term enhancements, component improvements, and future feature ideas beyond current sprint priorities. See `TODO.md` for current priority work.

## Completed Design System Components ✅

- ✅ `labs-card` — generic card component with `welcome` variant and slots
- ✅ `labs-toast` — transient undo toast with action button
- ✅ `labs-button` — consistent button across all actions
- ✅ `labs-dropdown` — lightweight actions menu
- ✅ `labs-input-card` — input wrapper for form submissions
- ✅ `labs-list-item` — single-row list item with checkbox, text, actions
- ✅ `labs-icon` — icon rendering system
- ✅ `labs-footer-with-settings` — sticky footer with settings overlay

## Future Component Ideas

- `labs-input` — enhanced input wrapper with Enter-to-submit + trimmed value handling
- `labs-timestamp` — small date/time formatting helper UI
- `labs-sortable-list` — list with native drag-and-drop and reordering
- `labs-edit-modal` — inline edit mode for list items
- `labs-search` — filterable list search control

## Extended Features (Future Sprints)

- **Auto-archive at end of day** — with optional user-configurable time
- **Cloud sync / export** — sync across devices, export to CSV/JSON
- **Multi-list support** — manage multiple independent todo lists
- **Virtualized large lists** — performance optimization for 1000+ items
- **Recurring tasks** — daily/weekly task templates
- **Time tracking** — track time spent on tasks
- **Collaborative lists** — share lists with other users (requires backend)

## Data & Edge Cases

- **Timezone handling**: Store UTC, format for locale on render
- **Restore flow**: Soft-delete with dedicated restore view in settings
- **LocalStorage migration**: Version keys and safe fallbacks for corrupt data
- **Large dataset handling**: Pagination or virtualization for 500+ items
- **Conflict resolution**: Handle simultaneous edits on synced data

## Rough Estimates

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Drag-drop reordering | 2–4 hours | Design system list enhancements |
| Auto-archive | 4–6 hours | Settings UI improvements |
| Cloud sync | 2–3 days | Backend API, auth system |
| Multi-list | 6–8 hours | Data schema refactor |
| Virtualized lists | 4–6 hours | Performance optimization |
| Recurring tasks | 6–8 hours | Date/time utilities, UI components |

## Related Documentation

- **Current priorities**: `TODO.md`
- **Migration process**: `_dev/_documents/APP-MIGRATION-PROCESS.md`
- **Design system reference**: `design-system/README.md`
