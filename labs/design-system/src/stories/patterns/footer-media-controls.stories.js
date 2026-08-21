import '../../components/labs-footer-media-controls.js';
import '../../components/labs-button.js';
import '../../components/labs-icon.js';
import { html } from 'lit';

export default {
    title: '4. Patterns/Template - Footer',
    parameters: {
        docs: {
            description: {
                component: 'Footer pattern for Timer app with media controls in the center and a Reset Media button (motion_play icon) on the right.'
            }
        }
    }
};

export const MediaFooter = {
    name: 'Media Controls',
    render: () => html`
            <labs-footer-media-controls></labs-footer-media-controls>
        `
};
