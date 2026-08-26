Component Hub: Architecture & Implementation Plan

1. Purpose and Vision

The Component Hub serves as a central catalog for a design system, organizing UI elements from basic building blocks (atoms/molecules) to complex layouts (organisms/pages). The goal is to provide a reliable, isolated environment to preview, test, and interact with components in various states (like light and dark mode) without style conflicts.

2. Core Architectural Decision: Multi-Page over SPA

Instead of building a complex Single-Page Application (SPA), the Hub will use a multi-page architecture.

⚬ Why: A multi-page setup eliminates the need for heavy, custom state management just to handle component switching. It allows us to focus entirely on building and rendering accurate components and complex page layouts.

3. The Catalog View (The "Hub")

The main Hub page acts as a high-level dashboard.

⚬ Layout: Components are displayed in a structured CSS Grid.

⚬ The "Emulator" Approach: Each cell in the grid displays a component using an <iframe>.

⚬ Why iframes? Iframes provide true viewport isolation. They ensure that the CSS and layout logic of the Hub do not bleed into or constrain the component. Each component renders exactly as it would in the wild.

4. Standalone Component Pages

Every component (e.g., a button, a modal, a full layout) lives on its own dedicated HTML page.

⚬ These are the pages loaded into the Hub's iframes.

⚬ Each component page includes a button or link to "open in full page" for a deep dive.

⚬ Because they are standard HTML pages, they are portable and easy to maintain.

5. Theme and State Management (Light/Dark Mode)

Handling global states like Light/Dark mode requires a clear separation of communication between the parent Hub and the isolated component pages.

⚬ At the Catalog Level (Parent Control): The Hub will feature a master toolbar. When a user toggles between light and dark mode on the Hub, the parent page will broadcast this change to all embedded iframes (e.g., by modifying a data-theme attribute on the iframe's document root). This updates all component previews simultaneously.

⚬ At the Standalone Level (Local Control): When a user opens a component in its standalone, full-page view, they still need to test light and dark modes. However, we do not want a theme-toggle UI physically coded into the base component page, because it would then visibly show up inside the tiny iframe on the Hub page.

	⚬ Solution: The standalone view will use an external "shell" or a dynamically injected floating toolbar to control the theme locally. This keeps the core component code clean and ensures the toggle UI only appears when viewing the component in isolation.
