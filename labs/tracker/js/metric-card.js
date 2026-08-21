/* lightweight metric-card module (optional helper) */
export function createMetricCard(count) {
    // Use labs-card component but with inline content styles for reliability
    const card = document.createElement('labs-card');

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.alignItems = 'center';
    content.style.textAlign = 'center';
    content.style.gap = 'var(--space-sm, 8px)';

    const label = document.createElement('div');
    label.textContent = 'Entries';
    label.style.fontSize = 'var(--font-size-entry-text, 1rem)';
    label.style.color = 'var(--color-on-surface)';
    label.style.fontWeight = 'var(--font-weight-normal, 400)';

    const value = document.createElement('div');
    value.textContent = count;
    value.style.fontSize = 'var(--font-size-entry-text, 1rem)';
    value.style.color = 'var(--color-on-surface)';
    value.style.fontWeight = 'var(--font-weight-normal, 400)';

    content.appendChild(label);
    content.appendChild(value);
    card.appendChild(content);
    return card;
}
