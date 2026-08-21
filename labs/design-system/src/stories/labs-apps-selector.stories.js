import '../components/labs-apps-selector.js';

const meta = {
    title: '4. Patterns/Settings/Apps Selector',
    tags: ['autodocs'],
};

export default meta;

export const Default = () => {
    const container = document.createElement('div');
    container.innerHTML = `
    <style>
      body { padding: 20px; }
      labs-apps-selector {
        display: block;
        max-width: 280px;
      }
    </style>
    <labs-apps-selector></labs-apps-selector>
  `;
    return container;
};

export const Open = () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.innerHTML = `
    <labs-apps-selector open></labs-apps-selector>
  `;
    return container;
};

Open.parameters = {
    docs: {
        description: {
            story: 'Apps selector with dropdown menu open',
        },
    },
};
