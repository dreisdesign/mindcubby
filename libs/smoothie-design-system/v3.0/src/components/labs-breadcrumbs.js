/**
 * Breadcrumbs navigation component
 *
 * @slot default - Breadcrumb items (use labs-breadcrumb-item)
 *
 * @example
 * <labs-breadcrumbs>
 *   <labs-breadcrumb-item href="/">Home</labs-breadcrumb-item>
 *   <labs-breadcrumb-item href="/components/">Components</labs-breadcrumb-item>
 *   <labs-breadcrumb-item active>Button</labs-breadcrumb-item>
 * </labs-breadcrumbs>
 */
class LabsBreadcrumbs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-size: 0.85rem;
          color: var(--color-on-surface-variant, #999);
          margin-bottom: 1.5rem;
        }

        nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        ::slotted([active]) {
          color: var(--color-on-background, #333);
          font-weight: 600;
          cursor: default;
        }

        ::slotted(a) {
          color: var(--color-primary, #6464c8);
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        ::slotted(a:hover) {
          opacity: 0.7;
          text-decoration: underline;
        }

        ::slotted(a:active) {
          opacity: 0.5;
        }

        .separator {
          color: var(--color-on-surface-variant, #999);
          margin: 0 0.25rem;
          user-select: none;
        }
      </style>
      <nav>
        <slot></slot>
      </nav>
    `;
  }
}

/**
 * Individual breadcrumb item
 * @attribute href - Link target (optional for active items)
 * @attribute active - Mark as current/active breadcrumb
 */
class LabsBreadcrumbItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const isActive = this.hasAttribute('active');
    const href = this.getAttribute('href');

    if (isActive) {
      this.innerHTML = `<span>${this.textContent}</span>`;
    } else if (href) {
      this.innerHTML = `<a href="${href}">${this.textContent}</a>`;
    }

    // Add separator after non-active items
    if (!isActive && this.nextElementSibling) {
      const separator = document.createElement('span');
      separator.className = 'separator';
      separator.textContent = '/';
      separator.style.cssText = 'color: var(--color-on-surface-variant, #999); margin: 0 0.25rem; user-select: none;';
      this.after(separator);
    }
  }
}

customElements.define('labs-breadcrumbs', LabsBreadcrumbs);
customElements.define('labs-breadcrumb-item', LabsBreadcrumbItem);
