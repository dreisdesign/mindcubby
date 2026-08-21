import '../components/labs-flavor-selector.js';

const meta = {
    title: '4. Patterns/Settings/Flavor Selector',
    tags: ['autodocs'],
};

export default meta;

export const Default = () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <style>
      body { padding: 20px; }
      labs-flavor-selector {
        display: block;
        max-width: 280px;
      }
    </style>
    <labs-flavor-selector></labs-flavor-selector>
  `;
    return container;
};

export const WithTheme = () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.innerHTML = `
    <labs-flavor-selector></labs-flavor-selector>
  `;

    // Start with blueberry flavor
    document.documentElement.classList.remove('flavor-vanilla', 'flavor-blueberry', 'flavor-strawberry');
    document.documentElement.classList.add('flavor-blueberry');

    return container;
};

WithTheme.parameters = {
    docs: {
        description: {
            story: 'Flavor selector with blueberry theme pre-selected',
        },
    },
};
