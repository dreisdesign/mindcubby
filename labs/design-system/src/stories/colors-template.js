// Clean renderer for Colors stories
export function renderColors(opts = {}) {
  const only = opts && opts.onlyFlavor ? String(opts.onlyFlavor) : '';


  // Map palette tokens to their semantic role for dynamic bold labels
  const paletteRoleLabels = {
    'global': {
      '--palette-base-100': 'Surface',
      '--palette-base-500': 'Outline',
      '--palette-base-800': 'Text',
      '--palette-green-500': 'Success',
      '--palette-yellow-500': 'Warning',
      '--palette-red-500': 'Error'
    },
    'vanilla': {
      '--palette-vanilla-100': 'Surface',
      '--palette-vanilla-200': 'Background',
      '--palette-vanilla-300': 'Primary Lighter',
      '--palette-vanilla-500': 'Primary',
      '--palette-vanilla-800': 'Primary Darker',
      '--palette-vanilla-900': 'Background Darkest'
    },
    'blueberry': {
      '--palette-blueberry-100': 'Surface',
      '--palette-blueberry-200': 'Background',
      '--palette-blueberry-300': 'Primary Lighter',
      '--palette-blueberry-500': 'Primary',
      '--palette-blueberry-800': 'Primary Darker',
      '--palette-blueberry-900': 'Background Darkest'
    },
    'strawberry': {
      '--palette-strawberry-100': 'Surface',
      '--palette-strawberry-200': 'Background',
      '--palette-strawberry-300': 'Primary Lighter',
      '--palette-strawberry-500': 'Primary',
      '--palette-strawberry-800': 'Primary Darker',
      '--palette-strawberry-900': 'Background Darkest'
    }
  };

  const polaroid = (flavor, label, varName, baseVar) => {
    // Add dynamic bold label for palette tokens on separate line
    let extraLabel = '';
    if (paletteRoleLabels[flavor] && paletteRoleLabels[flavor][varName]) {
      extraLabel = `<br><span style="font-weight:bold;font-size:13px;opacity:0.8;">${paletteRoleLabels[flavor][varName]}</span>`;
    }
    return `
    <div class="polaroid-card${varName === '--color-primary' ? ' polaroid-primary' : ''}" data-var="${varName}" role="button" tabindex="0" title="Copy ${varName}">
      <div class="card-swatch" style="background:var(${varName});">
        <div class="swatch-text">${(() => {
        const short = String(varName).replace(/^--/, '');
        if (varName === '--color-primary-lighter') return 'Primary Lighter';
        if (varName === '--color-on-primary-lighter') return 'On Primary Lighter';
        const m = short.match(/^palette-([^-]+)-(\d+)$/);
        if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1) + ' ' + m[2];
        const m2 = short.match(/^palette-([^-]+)-([a-zA-Z]+)$/);
        if (m2) return m2[1].charAt(0).toUpperCase() + m2[1].slice(1) + ' ' + m2[2];
        const c = short.replace(/^color-/, '').split('-').map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1) }).join(' ');
        return c || short;
      })()}${extraLabel}</div>
      </div>
      <div class="card-token-label"><code>${varName}</code></div>
      ${baseVar ? `<div class="card-base-label"><code>${baseVar}</code></div>` : ''}
    </div>
    `;
  };

  const hideIfNot = (f) => (only && only !== f) ? 'style="display:none;"' : '';
  // Curated token sets per flavor
  const tokenSets = {
    global: {
      label: 'Global',
      tokens: ['--color-surface', '--color-surface-alt', '--color-success', '--color-warning', '--color-error'],
      palette: [
        '--palette-base-100',
        '--palette-base-500',
        '--palette-base-800'
      ],
      statusPalette: [
        '--palette-green-500',
        '--palette-yellow-500',
        '--palette-red-500'
      ]
    },
    blueberry: {
      semantic: ['--color-primary', '--color-primary-darker', '--color-primary-lighter', '--color-background-darkest'],
      neutrals: ['--color-surface', '--color-background'],
      palette: ['--palette-blueberry-100', '--palette-blueberry-200', '--palette-blueberry-300', '--palette-blueberry-500', '--palette-blueberry-800', '--palette-blueberry-900'],
      accents: []
    },
    strawberry: {
      semantic: ['--color-primary', '--color-primary-darker', '--color-primary-lighter', '--color-background-darkest'],
      neutrals: ['--color-surface', '--color-background'],
      palette: ['--palette-strawberry-100', '--palette-strawberry-200', '--palette-strawberry-300', '--palette-strawberry-500', '--palette-strawberry-800', '--palette-strawberry-900'],
      accents: []
    },
    vanilla: {
      semantic: ['--color-primary', '--color-primary-darker', '--color-primary-lighter', '--color-background-darkest'],
      neutrals: ['--color-surface', '--color-background'],
      palette: ['--palette-vanilla-100', '--palette-vanilla-200', '--palette-vanilla-300', '--palette-vanilla-500', '--palette-vanilla-800', '--palette-vanilla-900'],
      accents: []
    }
  };
  // Only pass correct flavor key for polaroid
  const renderTokenList = (flavor, list) => list.map(v => polaroid(flavor, v.replace(/^--/, ''), v)).join('');

  // Helper to get all semantic tokens for a theme (include neutrals only)
  const getSemanticTokens = (flavor) => {
    const set = tokenSets[flavor];
    // Only include semantic tokens and neutrals for production-like table
    return Array.from(new Set([...(set.semantic || []), ...(set.neutrals || [])]));
  };

  // Render global view without a flavor wrapper so semantic globals resolve to neutral/base tokens
  // Always use flavor-global for the global table, so it is not affected by the active flavor/theme
  const flavorClass = only ? `flavor-${only} theme-light` : 'flavor-global theme-light';
  const dataAttr = only ? `data-only-flavor="${only}"` : '';

  // Render flavor sections only when a specific flavor is requested (individual flavor story).
  // For the global story (no `only`), we omit the themed flavor sections entirely.
  let flavorSections = '';
  if (only && tokenSets[only]) {
    const f = only;
    // Use getSemanticTokens(f) to include both semantic and neutrals (including --color-surface-hover)
    const allTokens = getSemanticTokens(f);
    flavorSections = `
  <details class="flavor-column flavor-${f}" ${hideIfNot(f)} open style="margin-top:12px">
        <summary style="margin:8px 0"><h3 style="display:inline;margin:0">Theme: ${f.charAt(0).toUpperCase() + f.slice(1)}</h3></summary>
        <div class="polaroid-row polaroid-palette" style="margin-bottom:18px;">
          ${tokenSets[f].palette.map(t => polaroid(f, t.replace(/^--/, ''), t)).join('')}
        </div>
        <div class="token-list-wrap">
          <table class="token-list">
            <thead><tr><th>Semantic</th><th>Swatch</th><th>Resolved</th><th>Base</th><th>Text color</th><th>Contrast</th></tr></thead>
            <tbody>
              ${allTokens.map(t => {
      // Use token-based text color for palette stops
      let textColor = '';
      let textColorToken = '';
      if (/--palette-(vanilla|blueberry|strawberry)-([0-9]+)/.test(t)) {
        const stop = t.match(/([0-9]+)$/)[1];
        if (["100", "200", "300"].includes(stop)) {
          textColorToken = '--color-on-primary-lighter';
          textColor = 'var(--color-on-primary-lighter, #000)';
        } else {
          textColorToken = '--color-on-primary-darker';
          textColor = 'var(--color-on-primary-darker, #fff)';
        }
      }
      return `
                <tr>
                  <td><code>${t}</code></td>
                  <td><span class="swatch-thumb" data-var="${t}" style="background:var(${t});"><span class="swatch-thumb-text" data-var="${t}" style="color:${textColor}">Aa</span></span></td>
                  <td class="list-resolved" data-var="${t}">resolving...</td>
                  <td class="list-chain" data-var="${t}">–</td>
                  <td class="list-text-color" data-var="${t}">${textColorToken ? `<code>${textColorToken}</code>` : 'computing...'}</td>
                  <td class="list-contrast" data-var="${t}">–</td>
                </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }

  const html = `
    <div style="width:100%; display:flex; justify-content:center;">
      <div style="max-width:1200px; padding:20px; font-family:var(--font-family-base); color:var(--color-on-background); background:var(--color-surface);">
        <div class="tokens-doc-root ${flavorClass}" ${dataAttr} data-flavor-root>
      <style>
  .tokens-doc-root{padding:16px 40px;font-family:var(--font-family-base);}

  /* Responsive grid of compact polaroids */
  .polaroid-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:16px}
  details.flavor-column{margin-bottom:12px;border-radius:var(--radius-lg,8px);padding:8px;border:1px solid rgba(0,0,0,0.04);background:var(--color-surface);color:var(--color-on-surface);transition:background 0.2s,color 0.2s}
  /* Force the Global details to use the neutral base palette (Base 100/800) via semantic tokens
     so we render using --color-surface / --color-on-surface while remaining flavor-agnostic. */
  details.flavor-column.flavor-global{
    --color-surface: var(--palette-base-100);
    --color-on-surface: var(--palette-base-800);
    background: var(--color-surface);
    color: var(--color-on-surface);
  }
  details.flavor-column[open]{box-shadow:0 1px 0 rgba(0,0,0,0.04)}
  details.flavor-column summary{list-style:none;cursor:pointer;padding:6px 8px}
  details.flavor-column summary::-webkit-details-marker{display:none}
  details.flavor-column summary h3{font-size:15px;display:inline}

  .polaroid-card{border-radius:var(--radius-lg,8px);padding:10px;border:1px solid var(--palette-base-500, var(--color-outline));background:var(--color-surface,#FBFBFD);}
  /* Make the swatch a square (1:1) so color area is consistent */
  .card-swatch{width:100%;min-width:64px;min-height:64px;aspect-ratio:1/1;border-radius:var(--radius-lg,8px);background-size:cover;margin-bottom:10px;position:relative;display:flex;align-items:center;justify-content:center;background:var(--color-surface,#FBFBFD);}
  .swatch-text{
    font-weight:700;
    font-size:16px;
    line-height:1;
    color:var(--color-on-surface);
    pointer-events:none;
    text-shadow:0 1px 0 rgba(0,0,0,0.15);
    transition:color 0.2s;
  }
  /* Override text color for primary-lighter swatch to use correct on color */
  .polaroid-card[data-var="--color-primary-lighter"] .swatch-text {
    color: var(--color-on-primary-lighter, var(--color-on-surface));
  }
  /* Override text color for dark palette tokens (500, 700, 800, 900) to use light text */
  .polaroid-card[data-var*="-500"] .swatch-text,
  .polaroid-card[data-var*="-700"] .swatch-text,
  .polaroid-card[data-var*="-800"] .swatch-text,
  .polaroid-card[data-var*="-900"] .swatch-text,
  .polaroid-card[data-var="--palette-base-800"] .swatch-text {
    color: var(--color-on-primary-darker, #fff);
  }
  /* Override yellow-500 swatch to use dark text for contrast */
  .polaroid-card[data-var="--palette-yellow-500"] .swatch-text {
    color: var(--color-on-primary-lighter, #222);
  }
  /* Override text color for light palette tokens (100, 200, 300) to use dark text */
  .polaroid-card[data-var*="-100"] .swatch-text,
  .polaroid-card[data-var*="-200"] .swatch-text,
  .polaroid-card[data-var*="-300"] .swatch-text,
  .polaroid-card[data-var="--palette-base-100"] .swatch-text,
  .polaroid-card[data-var="--palette-base-500"] .swatch-text {
    color: var(--color-on-primary-lighter, #000);
  }
  /* Remove any dark mode overrides for .swatch-text (do not force color) */
  /* Ensure polaroid code labels never wrap */
  .card-token-label, .card-base-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  .card-token-label{font-size:12px;color:inherit;margin-top:6px;word-break:break-all;transition:color 0.2s;}
  .card-base-label{font-size:11px;color:inherit;opacity:0.8;margin-top:4px;word-break:break-all;transition:color 0.2s;}
  .polaroid-card[data-copied]{outline:2px solid rgba(0,0,0,0.08)}

  /* Match global polaroid size to theme palettes */
  .flavor-global .polaroid-row{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
  .flavor-global .polaroid-card{padding:12px}
  .polaroid-palette{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
  .polaroid-palette .polaroid-card{padding:12px}

  .token-list-wrap{margin-top:8px}
  .token-list{width:100%;border-collapse:collapse;font-size:13px}
  .token-list th,.token-list td{border:1px solid rgba(0,0,0,0.06);padding:6px 8px;text-align:left}
  .token-list th{background:rgba(0,0,0,0.02);font-weight:600}
  .token-list code{font-size:12px}
  .swatch-thumb, .swatch-thumb-text {
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    display:inline-flex;
    align-items:center;
    justify-content:center;
    width:40px;height:40px;
  border-radius:var(--radius-lg,8px);
    border:2px solid rgba(0,0,0,0.08) !important;
    font-size:16px;
    font-weight:700;
    text-align:center;
    cursor:pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .swatch-thumb:hover, .swatch-thumb-text:hover {
    border-color: rgba(0,0,0,0.28) !important;
  }
  /* Let the text sample inherit theme text color; background remains the swatch color when inside .swatch-thumb */
  .swatch-thumb-text { color: var(--color-on-surface); background: transparent; display:inline-flex; align-items:center; justify-content:center; width:100%; height:100%; border-radius:var(--radius-md,4px); }
  .resolve-chain{font-size:11px;color:var(--color-on-surface, rgba(28,27,31,0.6));margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  /* Contrast cell visual states (JS will place a .contrast-badge inside the cell) */
  .list-contrast{transition:background 0.18s, color 0.18s; text-align:center}
  .contrast-badge{display:inline-block;padding:2px 8px;border-radius:var(--radius-full,9999px);font-size:12px;line-height:1;min-width:36px}
  .palette-heading {
    font-size:14px;
    color:inherit;
    opacity:0.6;
    margin-bottom:12px;
    font-weight:600;
  }
      </style>
      <div id="flavors-top">
        <h1 style="margin:8px 0">Design Tokens — Palette</h1>
  <details class="flavor-column flavor-global" ${hideIfNot('global')} ${(!only || only === 'global') ? 'open' : ''} style="margin-bottom:18px">
        <summary style="margin:8px 0"><h3 style="display:inline;margin:0">Global</h3></summary>
  <div class="palette-heading">Core Palette</div>
        <div class="polaroid-row polaroid-palette" style="margin-bottom:18px;">
          ${tokenSets.global.palette.map(t => polaroid('global', t.replace(/^--/, ''), t)).join('')}
        </div>
  <div class="palette-heading">Status Palette</div>
        <div class="polaroid-row polaroid-palette" style="margin-bottom:18px;">
          ${tokenSets.global.statusPalette.map(t => polaroid('global', t.replace(/^--/, ''), t)).join('')}
        </div>
        <div class="token-list-wrap">
          <table class="token-list">
            <thead><tr><th>Semantic</th><th>Swatch</th><th>Resolved</th><th>Base</th><th>Text color</th><th>Contrast</th></tr></thead>
            <tbody>
              ${tokenSets.global.tokens.map(t => `
                <tr>
                  <td><code>${t}</code></td>
                  <td><span class="swatch-thumb" data-var="${t}" style="background:var(${t});"><span class="swatch-thumb-text" data-var="${t}">Aa</span></span></td>
                  <td class="list-resolved" data-var="${t}">resolving...</td>
                  <td class="list-chain" data-var="${t}">–</td>
                  <td class="list-text-color" data-var="${t}">computing...</td>
                  <td class="list-contrast" data-var="${t}">–</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        </details>
  ${flavorSections}
      </div>
    </div>
  </div>
  </div>
  `;

  // Add click-to-copy for swatches (main and text swatch)
  setTimeout(() => {
    // Find the local root for this table (flavor isolation)
    const root = document.querySelector('.tokens-doc-root[data-flavor-root]') || document.documentElement;

    document.querySelectorAll('.swatch-thumb, .swatch-thumb-text').forEach(el => {
      el.addEventListener('click', function (e) {
        const v = el.getAttribute('data-var');
        if (!v) return;
        let val = getComputedStyle(root).getPropertyValue(v).trim();
        if (!val) val = v;
        navigator.clipboard.writeText(val);
        el.style.outline = '2px solid #007aff';
        setTimeout(() => { el.style.outline = ''; }, 600);
      });
    });

    // Resolve table values
    document.querySelectorAll('.list-resolved').forEach(el => {
      const varName = el.getAttribute('data-var');
      if (varName) {
        const computedValue = getComputedStyle(root).getPropertyValue(varName).trim();
        el.textContent = computedValue || 'unset';
      }
    });

    // Use the local flavor class for mapping
    const flavorClass = Array.from(root.classList).find(c => c.indexOf('flavor-') === 0);
    let flavor = flavorClass ? flavorClass.replace('flavor-', '') : 'blueberry';

    // helper to build palette token name for flavor
    const p = (flav, stop) => `--palette-${flav}-${stop}`;
    const baseMapDynamic = (flav) => ({
      '--color-primary': p(flav, '500'),
      '--color-primary-darker': p(flav, '800'),
      '--color-primary-lighter': p(flav, '300'),
      '--color-surface': p(flav, '100'),
      '--color-background': p(flav, '200')
    });

    const textColorMap = {
      '--color-primary': '--color-on-primary',
      '--color-primary-darker': '--color-on-primary-darker',
      '--color-primary-lighter': '--color-on-primary-lighter',
      '--color-surface': '--color-on-surface',
      '--color-background': '--color-on-background'
    };

    const baseMap = baseMapDynamic(flavor);
    // Diagnostic: record flavor and baseMap snapshot to help debug Unknown base cases
    try {
      window.__colors_last_resolutions = window.__colors_last_resolutions || [];
      window.__colors_last_resolutions.push({ debug: 'baseMapSnapshot', flavor: flavor, baseMap: baseMap, ts: Date.now() });
    } catch (e) { }
    document.querySelectorAll('.list-chain').forEach(el => {
      const varName = el.getAttribute('data-var');
      if (varName) {
        const base = baseMap[varName] || '–';
        el.innerHTML = base !== '–' ? `<code>${base}</code>` : '–';
      }
    });

    document.querySelectorAll('.list-text-color').forEach(el => {
      const varName = el.getAttribute('data-var');
      if (varName) {
        const textColor = textColorMap[varName];
        if (textColor) {
          el.innerHTML = `<code>${textColor}</code>`;
        } else {
          el.textContent = 'computing...';
        }
      }
    });
  }, 300);
  return html;
}
