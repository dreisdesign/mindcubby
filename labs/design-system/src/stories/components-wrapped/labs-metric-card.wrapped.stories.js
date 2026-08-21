import '../../styles/main.css';
import '../../components/labs-metric-card.js';

export default {
    title: '3. Components (Wrapped)/Card/Metric',
    parameters: {
        docs: {
            description: {
                component: 'A modular, encapsulated card for displaying a metric label and value. Use this for dashboard/statistics displays.'
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
