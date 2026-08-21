import '../../components/labs-input.js';

export default {
    title: '3. Components (Wrapped)/Input',
    component: 'labs-input',
};

export const Default = {
    name: 'Default',
    render: () => `
    <labs-input placeholder="Type here..."></labs-input>
  `,
};

export const WithValue = {
    name: 'With Value',
    render: () => `
    <labs-input value="Pre-filled value"></labs-input>
  `,
};

export const Disabled = {
    name: 'Disabled',
    render: () => `
    <labs-input value="Can't edit" disabled></labs-input>
  `,
};

export const WithAriaLabel = {
    name: 'With Aria Label',
    render: () => `
    <labs-input aria-label="Search input" placeholder="Search..."></labs-input>
  `,
};