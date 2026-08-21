import '../components/labs-metric-card.js';

export default {
    title: '2. Components/Card/Metric',
    component: 'labs-metric-card',
    parameters: {
        docs: {
            description: {
                component: 'Raw API and attributes for the modular labs-metric-card component. Use this as a technical reference for developers.'
            }
        }
    },
    argTypes: {
        label: { control: 'text', description: 'Metric label' },
        value: { control: 'text', description: 'Metric value' },
    },
    args: {
        label: 'Entries',
        value: '42',
    },
};

export const Default = ({ label, value }) => {
    const card = document.createElement('labs-metric-card');
    card.setAttribute('label', label);
    card.setAttribute('value', value);
    return card;
};