/**
 * labs-page-layout
 * 
 * A consistent page layout component for all Smoothie Design System documentation pages.
 * Provides standardized structure with labs-container, back button, breadcrumbs, and title.
 * 
 * Usage:
 * <labs-page-layout title="Component Name" subtitle="Description" back-href="../../">
 *   <labs-breadcrumbs slot="breadcrumbs">
 *     <labs-breadcrumb-item>Category</labs-breadcrumb-item>
 *     <labs-breadcrumb-item active>Current Page</labs-breadcrumb-item>
 *   </labs-breadcrumbs>
 *   
 *   <!-- Page content goes here -->
 *   <div class="section">...</div>
 * </labs-page-layout>
 * 
 * Attributes:
 * - title: Page title (h1)
 * - subtitle: Page subtitle (p.subtitle)
 * - back-href: URL for back button navigation
 * - back-text: Custom back button text (default: "← Back to Home")
 * 
 * Slots:
 * - breadcrumbs: For labs-breadcrumbs component
 * - (default): Page content
 */

class LabsPageLayout extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupIframeDetection();
  }

  render() {
    const title = this.getAttribute('title') || 'Page';
    const subtitle = this.getAttribute('subtitle') || '';
    const backHref = this.getAttribute('back-href') || '../../';
    const backText = this.getAttribute('back-text') || '← Back to Home';

    // Clear existing children to rebuild
    this.innerHTML = `
      <labs-container id="main-container" medium>
        <div class="container">
          <labs-button class="back-link" onclick="window.location.href='${backHref}';" variant="secondary">
            ${backText}
          </labs-button>

          <slot name="breadcrumbs"></slot>

          <h1 class="page-title">${title}</h1>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}

          <slot></slot>
        </div>
      </labs-container>
    `;

    // Attach stylesheet for page content
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }

      /* Page content styling */
      h1 {
        font-size: 2rem;
        margin: 0.5rem 0 2rem 0;
        font-weight: 600;
        color: var(--color-on-background, #333);
      }

      .subtitle {
        color: var(--color-on-surface, #666);
        margin-bottom: 2rem;
        font-size: 0.9rem;
      }

      .back-link {
        display: inline-block;
        margin-bottom: 2rem;
      }

      .back-link:hover {
        opacity: 0.8;
      }

      /* Hide elements when embedded in iframe */
      :host(.in-iframe) .back-link {
        display: none !important;
      }

      :host(.in-iframe) ::slotted([name="breadcrumbs"]) {
        display: none !important;
      }

      :host(.in-iframe) h1 {
        display: none !important;
      }

      :host(.in-iframe) .subtitle {
        display: none !important;
      }
    `;
    this.appendChild(style);
  }

  setupIframeDetection() {
    // Add iframe detection class to host element
    if (window.self !== window.top) {
      this.classList.add('in-iframe');
    }
  }

  // Allow attribute updates to trigger re-render
  static get observedAttributes() {
    return ['title', 'subtitle', 'back-href', 'back-text'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }
}

customElements.define('labs-page-layout', LabsPageLayout);
