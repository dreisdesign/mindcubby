import '../styles/main.css';

export default {
  title: '0. Tokens/Spacing',
  parameters: { viewMode: 'docs' }
};

export const Spacing = {
  name: 'Spacing',
  render: () => `
    <div style="padding:20px; color:var(--color-on-background); background:var(--color-surface);">
      <h1>Spacing tokens</h1>
      <div style="margin-top:12px; display:flex; gap:12px; align-items:center;">
  <div style="width:var(--space-xs); height:24px; background:var(--color-primary); border-radius:var(--radius-sm,2px);"></div>
  <div style="width:var(--space-sm); height:24px; background:var(--color-primary); border-radius:var(--radius-sm,2px);"></div>
  <div style="width:var(--space-md); height:24px; background:var(--color-primary); border-radius:var(--radius-sm,2px);"></div>
      </div>
    </div>
  `
};
