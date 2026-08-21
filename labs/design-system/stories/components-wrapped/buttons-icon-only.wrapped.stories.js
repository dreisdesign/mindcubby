import { html } from 'lit';
import '../../components/labs-button.js';
import '../../components/labs-icon.js';
import iconsList from '../../components/icons-list.js';

// Design system color variants
const colorVariants = {
    'On Surface': 'var(--color-on-surface)',
    'On Primary': 'var(--color-on-primary)',
    'Primary': 'var(--color-primary)',
    'Error': 'var(--color-error)',
    'On Error': 'var(--color-on-error)',
    'Settings Icon': 'var(--settings-icon-color)',
};

export default {
    title: '3. Components (Wrapped)/Button/Icon Only',
    argTypes: {
        icon: {
            options: iconsList,
            control: { type: 'select' },
            description: 'Icon name',
        },
        colorVariant: {
            options: Object.keys(colorVariants),
            control: { type: 'select' },
            description: 'Icon color variant',
        },
        ariaLabel: {
            control: 'text',
            description: 'Aria label for accessibility',
        },
        label: {
            control: 'boolean',
            description: 'Show label below the icon (for footer-like usage)'
        },
        animation: {
            control: 'boolean',
            description: 'Enable icon hover animation',
        },
    },
    parameters: {
        docs: {
            description: {
                component: 'A wrapped demo for icon-only button actions. Used for theme, delete, settings, close, etc. Supports animation and accessibility.',
            },
        },
    },
};

export const IconOnly = ({ icon = 'settings', colorVariant = 'On Surface', ariaLabel = 'Settings', animation = true, label = false }) => {
    const style = `
    labs-button[variant="icon"] labs-icon {
      transition: transform 0.4s cubic-bezier(.4,2,.6,1);
      transform: rotate(0deg);
    }
    labs-button[variant="icon"]:hover labs-icon {
      transform: ${animation ? 'rotate(90deg)' : 'rotate(0deg)'};
    }
    .footer-label {
      display: block;
      margin-top: 4px;
      font-size: 0.78rem;
      color: var(--color-on-surface-variant);
      text-align: center;
    }
  `;
    const color = colorVariants[colorVariant] || 'var(--color-on-surface)';
    return html`
    <style>${style}</style>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <labs-button variant="icon" aria-label="${ariaLabel}">
        <labs-icon name="${icon}" width="24" height="24" slot="icon-left" color="${color}" style="color: ${color};"></labs-icon>
      </labs-button>
      ${label ? html`<span class="footer-label">${ariaLabel}</span>` : ''}
    </div>
  `;
};

IconOnly.args = {
    icon: 'settings',
    colorVariant: 'On Surface',
    ariaLabel: 'Settings',
    animation: true,
    label: false,
};

IconOnly.storyName = 'Icon Only';
