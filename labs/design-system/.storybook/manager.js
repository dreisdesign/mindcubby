import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'auto',
    brandTitle: 'Labs Storybook',
    // Use a relative URL so the brand link points to the current Storybook root
    // (e.g. './' resolves to '/labs/design-system/' on GitHub Pages)
    brandUrl: './',
    brandImage: 'smoothie.svg', // Custom logo in public folder
  }),
});

// Listen for theme sync messages from the preview iframe and apply classes
function applyThemePayload(payload) {
  const root = document.documentElement;
  if (payload.theme) {
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${payload.theme}`);
    // Also set data-color-scheme to help form controls and native UI
    root.setAttribute('data-color-scheme', payload.theme === 'dark' ? 'dark' : 'light');
  }
  if (payload.flavor) {
    root.classList.remove('flavor-blueberry', 'flavor-strawberry');
    root.classList.add(`flavor-${payload.flavor}`);
  }
}

window.addEventListener('message', (ev) => {
  try {
    const data = ev.data || {};
    if (data && data.type === 'STORYBOOK_SYNC_THEME') {
      applyThemePayload(data);
    }
    if (data && data.type === 'STORYBOOK_SET_TOOL_VISIBILITY' && data.tool === 'Theme') {
      try {
        const hide = Boolean(data.hide);
        // Find a toolbar button that looks like the theme toggle and hide/show it
        const buttons = Array.from(document.querySelectorAll('[role="toolbar"] button, [role="toolbar"] a'));
        const themeBtn = buttons.find(b => {
          const title = (b.getAttribute('title') || '').toLowerCase();
          const label = (b.getAttribute('aria-label') || '').toLowerCase();
          return title.includes('theme') || label.includes('theme');
        });
        if (themeBtn) themeBtn.style.display = hide ? 'none' : '';
      } catch (e) {
        // ignore
      }
    }

    if (data && data.type === 'STORYBOOK_CLEAR_THEME') {
      try {
        // Remove theme classes from the manager/document so any synced theme is cleared
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark');
        // Also try to clear theme classes inside any preview iframe if accessible
        const iframes = Array.from(document.querySelectorAll('iframe'));
        iframes.forEach((f) => {
          try {
            const doc = f.contentDocument || f.contentWindow && f.contentWindow.document;
            if (doc && doc.documentElement) {
              doc.documentElement.classList.remove('theme-light', 'theme-dark');
            }
          } catch (e) {
            // cross-origin or not accessible - ignore
          }
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore malformed messages
  }
});

// Initialize manager theme from existing document classes if present
(() => {
  const root = document.documentElement;
  const isDark = root.classList.contains('theme-dark') || root.getAttribute('data-color-scheme') === 'dark';
  applyThemePayload({ theme: isDark ? 'dark' : 'light' });
})();

// Minimal runtime inliner: replace any <img> whose src contains "smoothie" with an inline SVG
// so the logo can inherit the manager's color (currentColor) and follow theme tokens.
(() => {
  const selector = 'img[src*="smoothie"]';

  async function inlineImg(img) {
    try {
      const src = img.getAttribute('src');
      if (!src) return;
      const hasQuery = src.includes('?');
      const fetchUrl = src + (hasQuery ? '&' : '?') + '_inline_ts=' + Date.now();
      const res = await fetch(fetchUrl, { cache: 'no-cache' });
      if (!res.ok) return;
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return;

      // Rewrite any explicit fill attributes on visible elements to 'currentColor',
      // but skip defs, clipPath, mask and url(...) fills (gradients, patterns).
      const walkers = svg.querySelectorAll('[fill]');
      walkers.forEach((el) => {
        const v = el.getAttribute('fill') || '';
        if (!v) return;
        const low = v.trim().toLowerCase();
        if (low === 'none') return;
        if (low.startsWith('url(')) return; // gradient or pattern
        // apply currentColor so host color controls the logo
        el.setAttribute('fill', 'currentColor');
      });

      // Ensure .content uses currentColor; if the svg already has a <style>, don't stomp it,
      // but add the rule at the top so it takes precedence for .content classes.
      const existingStyle = svg.querySelector('style');
      const rule = '.content{fill:currentColor}';
      if (existingStyle) {
        if (!existingStyle.textContent.includes(rule)) {
          existingStyle.textContent = rule + '\n' + existingStyle.textContent;
        }
      } else {
        const s = doc.createElement('style');
        s.textContent = rule;
        svg.insertBefore(s, svg.firstChild);
      }

      // Copy over width/height and other non-src attributes we care about
      const attrs = Array.from(img.attributes).filter(a => a.name !== 'src' && a.name !== 'srcset');
      attrs.forEach(a => svg.setAttribute(a.name, a.value));

      // Make display consistent with typical images and constrain size via wrapper
      if (!svg.getAttribute('style')) svg.setAttribute('style', 'display:block');

      const wrapper = document.createElement('span');
      wrapper.className = 'smoothie-inline-wrapper';
      // sensible default max height so it fits Storybook header
      wrapper.style.display = 'inline-block';
      wrapper.style.maxHeight = '2.25rem';
      wrapper.style.height = '100%';
      wrapper.style.overflow = 'hidden';
      // ensure svg fills wrapper
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');

      wrapper.appendChild(svg);
      img.replaceWith(wrapper);
    } catch (e) {
      // ignore failures intentionally; a failed inline shouldn't break manager
    }
  }

  function scanAndInline(root = document) {
    const imgs = Array.from(root.querySelectorAll(selector));
    imgs.forEach(img => {
      // avoid double-inlining
      if (img.closest && img.closest('svg')) return;
      inlineImg(img);
    });
  }

  // initial pass
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scanAndInline(document));
  } else {
    scanAndInline(document);
  }

  // watch for late-insertions (toolbar or async UI)
  const mo = new MutationObserver((list) => {
    for (const m of list) {
      if (m.addedNodes && m.addedNodes.length) {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1) scanAndInline(n);
        });
      }
    }
  });
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
})();

// smoothie inliner: runtime inliner ensures logos become inline SVG and inherit currentColor
