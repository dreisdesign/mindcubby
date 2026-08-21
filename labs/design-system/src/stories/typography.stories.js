import '../styles/main.css';
import '../components/labs-badge.js';

export default {
  title: '0. Tokens/Typography',
  parameters: {
    viewMode: 'docs',
    options: { panelPosition: 'bottom' }
  }
};

export const Typography = {
  name: 'Typography',
  render() {
    // Helper function to get computed value
    const getVal = (prop) => getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || '-';

    // Helper function to create table row
    const row = (token, sizeToken, weightToken, lhToken, usage, isCanonical = false) => {
      const aliasMatch = usage.match(/\(alias: (--font-size-[^\)]+)\)/);
      const aliasBadge = aliasMatch ? `<labs-badge variant="secondary" text="${aliasMatch[1]}" style="margin-left:8px;"></labs-badge>` : '';
      const tokenName = isCanonical ? `<strong>${token}</strong>` : token;
      const badge = isCanonical ? '<labs-badge variant="primary" text="main" style="margin-left:8px;"></labs-badge>' : '';
      const weight = weightToken ? `var(${weightToken})` : '400';
      const lineHeight = lhToken ? `var(${lhToken})` : '1.5';

      // Remove alias badge from usage cell
      let formattedUsage = usage.replace(/\s*\(alias: (--font-size-[^\)]+)\)/, '');

      return `
        <tr>
          <td style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; color:var(--color-on-surface);">${tokenName}${badge}${aliasBadge}</td>
          <td style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; color:var(--color-on-surface);">${getVal(sizeToken)}</td>
          <td style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; color:var(--color-on-surface);">${weightToken ? getVal(weightToken) : '400'}</td>
          <td style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; color:var(--color-on-surface);">${lhToken ? getVal(lhToken) : '1.5'}</td>
          <td style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; color:var(--color-on-surface);"><span style="font-size:var(${sizeToken}); font-weight:${weight}; line-height:${lineHeight};">${formattedUsage}</span></td>
        </tr>`;
    };

    return `
      <div style="padding:20px; font-family:var(--font-family-base); color:var(--color-on-background); background:var(--color-surface);">
        <h1>Typography tokens</h1>
        <div style="margin-bottom:32px;">
          <table style="border-collapse:collapse; width:100%; font-size:0.98em; background:var(--color-surface-variant, var(--color-surface, #f8f8f8));">
            <thead>
              <tr style="background:var(--color-surface-container, var(--color-surface, #eee));">
                <th style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; text-align:left; color:var(--color-on-surface);">Token Name</th>
                <th style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; text-align:left; color:var(--color-on-surface);">Font Size</th>
                <th style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; text-align:left; color:var(--color-on-surface);">Weight</th>
                <th style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; text-align:left; color:var(--color-on-surface);">Line Height</th>
                <th style="border:1px solid var(--color-outline, #ccc); padding:6px 10px; text-align:left; color:var(--color-on-surface);">Usage/Role</th>
              </tr>
            </thead>
            <tbody>
              ${row('--font-size-metric-display', '--font-size-metric-display', '--font-weight-metric', '--line-height-metric', 'Metric display', true)}
              ${row('--font-size-h1', '--font-size-h1', '--font-weight-heading', '--line-height-heading', 'H1 heading', true)}
              ${row('--font-size-display', '--font-size-display', '--font-weight-heading', null, 'Display heading', true)}
              ${row('--font-size-h2', '--font-size-h2', '--font-weight-heading', '--line-height-heading', 'H2 heading', true)}
              ${row('--font-size-card-header', '--font-size-card-header', '--font-weight-card-header', '--line-height-card-header', 'Card header')}
              ${row('--font-size-h3', '--font-size-h3', '--font-weight-heading', '--line-height-heading', 'H3 heading', true)}
              ${row('--font-size-large', '--font-size-large', null, null, 'Large body text', true)}
              ${row('--font-size-base', '--font-size-base', null, '--line-height-base', 'Base text', true)}
              ${row('--font-size-entry-text', '--font-size-entry-text', null, null, 'Entry text (alias: --font-size-base)')}
              ${row('--font-size-button', '--font-size-button', '--font-weight-button', '--line-height-button', 'Button text (alias: --font-size-base)')}
              ${row('--font-size-card-desc', '--font-size-card-desc', null, '--line-height-card-desc', 'Card description (alias: --font-size-base)')}
              ${row('--font-size-toast', '--font-size-toast', null, '--line-height-toast', 'Toast text (alias: --font-size-base)')}
              ${row('--font-size-toast-action', '--font-size-toast-action', '--font-weight-toast-action', null, 'Toast action (alias: --font-size-base)')}
              ${row('--font-size-metric-label', '--font-size-metric-label', '--font-weight-metric', '--line-height-metric', 'Metric label (alias: --font-size-base)')}
              ${row('--font-size-input', '--font-size-input', null, '--line-height-input', 'Input text (alias: --font-size-base)')}
              ${row('--font-size-footer', '--font-size-footer', null, '--line-height-footer', 'Footer text (alias: --font-size-base)')}
              ${row('--font-size-overlay', '--font-size-overlay', null, '--line-height-overlay', 'Overlay text (alias: --font-size-base)')}
              ${row('--font-size-sm', '--font-size-sm', null, null, 'Small text', true)}
              ${row('--font-size-xs', '--font-size-xs', null, null, 'Extra small', true)}
              ${row('--font-size-badge', '--font-size-badge', '--font-weight-badge', '--line-height-badge', 'Badge text (alias: --font-size-xs)')}
              ${row('--font-size-entry-meta', '--font-size-entry-meta', null, null, 'Entry meta (alias: --font-size-xs)')}
              ${row('--font-size-xxs', '--font-size-xxs', null, null, 'Tiny text', true)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};
