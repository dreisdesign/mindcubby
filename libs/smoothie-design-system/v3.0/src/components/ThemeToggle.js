// ThemeToggle.js
// Reusable theme toggle button for Storybook and apps
import { applyTheme } from '../utils/theme.js';

export function createThemeToggleButton({ parent = document.body } = {}) {
  // Remove any existing toggle
  const existing = parent.querySelector('.labs-theme-toggle');
  if (existing) existing.remove();

  const btn = document.createElement('labs-button');
  btn.className = 'labs-theme-toggle';
  btn.setAttribute('variant', 'secondary');
  btn.setAttribute('size', 'large');
  btn.style.margin = '1rem';
  btn.style.position = 'fixed';
  btn.style.top = '1rem';
  btn.style.right = '1rem';
  btn.style.zIndex = 1000;

  function updateLabel() {
    const isDark = document.documentElement.classList.contains('theme-dark');
    // Remove any existing icon and label
    Array.from(btn.childNodes).forEach(n => btn.removeChild(n));
    // Create and append the icon element for the left slot
    const icon = document.createElement('labs-icon');
    icon.setAttribute('slot', 'icon-left');
    icon.setAttribute('name', isDark ? 'bedtime_off' : 'bedtime');
    btn.appendChild(icon);
    // Append the label as a text node only when not collapsed for small screens
    const collapsed = btn.getAttribute('data-collapse') === 'small';
    if (!collapsed) {
      btn.appendChild(document.createTextNode(isDark ? 'Turn on light mode' : 'Turn on dark mode'));
    } else {
      // ensure an accessible label exists when icon-only
      btn.setAttribute('aria-label', isDark ? 'Turn on light mode' : 'Turn on dark mode');
    }
  }

  btn.onclick = () => {
    const isDark = document.documentElement.classList.contains('theme-dark');
    // Detect current flavor from the root element's classList
    const root = document.documentElement;
    const flavorClass = Array.from(root.classList).find(c => c.startsWith('flavor-'));
    const flavor = flavorClass ? flavorClass.replace('flavor-', '') : 'vanilla';
    applyTheme({ flavor, theme: isDark ? 'light' : 'dark' });
    updateLabel();
  };

  // Keep the visible label in sync with external theme changes (toolbar, other toggles)
  const observer = new MutationObserver(() => updateLabel());
  try {
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  } catch (e) {
    // ignore if observe fails in some environments
  }

  // Responsive collapse: hide label at small widths by setting data-collapse="small"
  function updateCollapse() {
    try {
      const isSmall = window.matchMedia('(max-width: 700px)').matches;
      if (isSmall) btn.setAttribute('data-collapse', 'small');
      else btn.removeAttribute('data-collapse');
    } catch (e) { }
  }
  // adjust visual variant when collapsed to use icon-only style
  (function watchCollapse() {
    const mq = window.matchMedia('(max-width: 700px)');
    function applyVariant() {
      const isSmall = mq.matches;
      if (isSmall) {
        btn.setAttribute('variant', 'icon');
        btn.setAttribute('size', 'medium');
      } else {
        btn.setAttribute('variant', 'secondary');
        btn.setAttribute('size', 'large');
      }
      // refresh label/icon content to reflect the variant state
      updateLabel();
    }
    try {
      mq.addEventListener ? mq.addEventListener('change', applyVariant) : mq.addListener(applyVariant);
    } catch (e) { }
    applyVariant();
  })();
  updateCollapse();
  window.addEventListener('resize', updateCollapse);

  updateLabel();
  parent.appendChild(btn);
  return btn;
}
