---
name: Rotater
description: Instructions specific to the Rotater App.
argument-hint: The inputs this agent expects, e.g., "a task to implement" or "a question to answer".
# tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo'] # specify the tools this agent can use. If not set, all enabled tools are allowed.
---

<!-- Tip: Use /create-agent in chat to generate content with agent assistance -->

What this custom agent does, including its behavior, capabilities, and any specific instructions for its operation.

This agent is designed to assist with the development and maintenance of the Rotater App. When making changes to the codebase, consider the following:

1. Before each commit, update documentation that reflects the change scope:
	- CHANGELOG.md (Unreleased or version section)
	- README.md (if behavior, workflow, controls, or version notes changed)
	- REFACTOR_PROGRESS.md (when extraction/module work is advanced)

2. Before each commit, update build metadata in index.html:
	- ROTATER_BUILD
	- ROTATER_BUILD_DATE
	- Ensure the info card reflects those values.

3. Take responsive screenshots before commits affecting UI/layout (especially mobile):
	- Quick capture: `npm run shots` (default state only, captures mobile/tablet/desktop)
	- Full states: `npm run shots:states` (captures default, export-open, sidebar-collapsed states across all viewports)
	- Output saved to `.screenshots/YYYY-MM-DD-HH-MM-SS/` with browser-viewable index.html for side-by-side review
	- Optional: Setup pre-commit hook with `npm run setup:precommit-screenshots` (auto-captures on CSS/HTML/JS changes before each commit)
	- When UI/layout changes are committed: store screenshots in branch for review during PR
	- Tip: Screenshots are not committed; they're dev artifacts for validation. Include visual validation notes in commit message if testing multiple viewports was required.

4. Refactor-as-you-go policy (C1):
	- If touching non-trivial logic in script.js, extract at least the newly-added decision/transform logic into an appropriate module in the same change.
	- Keep script.js focused on orchestration/event wiring; keep pure logic in modules.
	- Prefer small behavior-preserving extractions over large risky rewrites.

5. Performance workflow for interactive controls:
	- During input/drag paths, prefer preview-only updates.
	- Defer expensive operations (persistence, thumbnail regeneration, URL sync/saveSettings, texture rebuilds) to commit paths (change/pointerup/debounced flush).
	- For regressions, identify root cause and preserve UX parity while reducing main-thread/GPU stalls.

6. Bug-fix quality bar:
	- Fix root cause, not only symptoms.
	- Validate adjacent paths and interaction variants (single part, multipart, multi-select, floating panels, mobile/desktop).
	- Add focused guards for edge cases and avoid behavior regressions.

7. UI and UX consistency:
	- Preserve existing visual language, spacing, and interaction patterns unless the task explicitly asks for redesign.
	- New UI elements should be intuitive, accessible, and coherent with existing controls/states.

8. Implementation standards:
	- Follow established coding conventions and naming patterns.
	- Keep changes minimal, readable, and well-scoped.
	- Prefer thin wrappers in script.js when delegating to modules.
