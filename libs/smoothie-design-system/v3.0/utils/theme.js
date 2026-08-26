// Minimal theme helper for applying flavor and theme classes and data attribute
export function applyTheme({ flavor = 'blueberry', theme = 'light' } = {}) {
  const root = document.documentElement;
  const body = document.body;
  // remove known flavor classes (keep this list in sync with flavors.css)
  root.classList.remove('flavor-blueberry', 'flavor-strawberry');
  body.classList.remove('flavor-blueberry', 'flavor-strawberry');
  root.classList.add(`flavor-${flavor}`);
  body.classList.add(`flavor-${flavor}`);
  root.classList.remove('theme-light', 'theme-dark');
  body.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${theme}`);
  body.classList.add(`theme-${theme}`);
  try { root.setAttribute('data-color-scheme', theme); } catch (e) { }
}

export function initSystemTheme(defaultTheme = 'light') {
  if (!document.documentElement.classList.contains('theme-light') &&
    !document.documentElement.classList.contains('theme-dark')) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme({ theme: prefersDark ? 'dark' : defaultTheme });
  }
}
