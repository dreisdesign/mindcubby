// labs-flavor-button - simple flavor button for Storybook and demos
class LabsFlavorButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._observer = null;
        this.render = this.render.bind(this);
        this.render();
    }

    static get observedAttributes() {
        return ['label'];
    }

    connectedCallback() {
        const root = document.documentElement;
        this._observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'class') {
                    this.render();
                    break;
                }
            }
        });
        this._observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    }

    disconnectedCallback() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }

    attributeChangedCallback() {
        this.render();
    }

    getFlavorName() {
        const cls = [...document.documentElement.classList].find((c) => c.startsWith('flavor-'));
        if (!cls) return null;
        const raw = cls.split('-').slice(1).join('-');
        return raw
            .split('-')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');
    }

    render() {
        const flavorLabel = this.getFlavorName();
        const attrLabel = this.getAttribute('label');
        const variant = this.getAttribute('variant') || 'secondary';
        const label = flavorLabel || attrLabel || 'Flavor';

        this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        labs-button { width: 100%; box-sizing: border-box; }
      </style>
    <labs-button variant="${variant}" size="large" style="gap:10px; justify-content:flex-start;">
        <labs-icon name="colors" slot="icon-left" width="20" height="20"></labs-icon>
        ${label}
      </labs-button>
    `;

        const btn = this.shadowRoot.querySelector('labs-button');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Cycle through available flavors and update document class
                const flavors = ['vanilla', 'blueberry', 'strawberry'];
                const root = document.documentElement;
                const body = document.body;
                const current = [...root.classList].find((c) => c && c.startsWith('flavor-'));
                const currentKey = current ? current.split('-').slice(1).join('-') : null;
                const idx = Math.max(0, flavors.indexOf(currentKey));
                const next = flavors[(idx + 1) % flavors.length];
                // Remove any existing flavor- classes from root and body
                for (const f of flavors) {
                    root.classList.remove(`flavor-${f}`);
                    body.classList.remove(`flavor-${f}`);
                }
                root.classList.add(`flavor-${next}`);
                body.classList.add(`flavor-${next}`);
                // Persist flavor and current theme to localStorage for reload persistence
                try {
                    localStorage.setItem('tracker-flavor', next);
                    const themeClass = [...root.classList].find(c => c.startsWith('theme-'));
                    const theme = themeClass ? themeClass.replace('theme-', '') : 'light';
                    localStorage.setItem('tracker-theme', theme);
                } catch (e) { }
                // Re-render to pick up new label
                this.render();
                // Emit both a generic click and a specific cycle event
                this.dispatchEvent(new CustomEvent('cycle-flavor', { detail: { flavor: next }, bubbles: true, composed: true }));
                this.dispatchEvent(new CustomEvent('click', { bubbles: true, composed: true }));
            });
        }
    }
}

customElements.define('labs-flavor-button', LabsFlavorButton);

export default LabsFlavorButton;
