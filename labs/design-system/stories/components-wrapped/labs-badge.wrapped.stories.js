import '../../components/labs-badge.js';

export default {
  title: '3. Components (Wrapped)/Badge',
  component: 'labs-badge',
  argTypes: {
    text: {
      control: 'text',
      description: 'Badge text content'
    }
  }
};

export const Success = {
  name: 'Success',
  args: {
    text: 'Success'
  },
  render: (args) => `
    <labs-badge variant="success" text="${args.text}"></labs-badge>
  `,
};

export const Warning = {
  name: 'Warning',
  args: {
    text: 'Warning'
  },
  render: (args) => `
    <labs-badge variant="warning" text="${args.text}"></labs-badge>
  `,
};

export const Error = {
  name: 'Error',
  args: {
    text: 'Error'
  },
  render: (args) => `
    <labs-badge variant="error" text="${args.text}"></labs-badge>
  `,
};

export const Secondary = {
  name: 'Secondary',
  args: {
    text: 'Secondary'
  },
  render: (args) => `
    <labs-badge variant="secondary" text="${args.text}"></labs-badge>
  `,
};

export const Primary = {
  name: 'Primary (Default)',
  args: {
    text: 'Primary'
  },
  render: (args) => `
    <labs-badge text="${args.text}"></labs-badge>
  `,
};