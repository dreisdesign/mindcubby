import '../../components/labs-checkbox.js';

export default {
    title: '3. Components (Wrapped)/Checkbox',
    component: 'labs-checkbox',
};

export const Checked = {
    name: 'Checked',
    render: () => `
    <labs-checkbox checked aria-label="Checked"></labs-checkbox>
  `,
};

export const Unchecked = {
    name: 'Unchecked',
    render: () => `
    <labs-checkbox aria-label="Unchecked"></labs-checkbox>
  `,
};

export const Inactive = {
    name: 'Inactive (Disabled)',
    render: () => `
    <labs-checkbox inactive aria-label="Inactive"></labs-checkbox>
  `,
};