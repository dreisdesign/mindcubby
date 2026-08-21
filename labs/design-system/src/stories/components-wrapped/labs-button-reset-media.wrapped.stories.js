
import '../../components/labs-footer.js';
import '../../components/labs-button-reset-media.wrapped.js';
import { html } from 'lit';

export default {
    title: '3. Components (Wrapped)/Button',
    parameters: {
        docs: {
            description: {
                component: 'Wrapped Reset Media button with motion_play icon, fullwidth and variant support.'
            }
        }
    }
};

export const ResetMedia = {
    name: 'Reset Media',
    render: () => html`
        <labs-button-reset-media-wrapped fullwidth size="small" variant="transparent"></labs-button-reset-media-wrapped>
    `
};