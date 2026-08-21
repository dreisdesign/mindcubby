import '../../components/labs-toast.js';

export default {
    title: '3. Components (Wrapped)/Toast',
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'destructive'],
            description: 'Button style variant for the Toast action button',
            defaultValue: 'primary',
        },
    },
    args: {
        variant: 'primary',
    },
};

/**
 * Wrapped Toast: Preconfigured, logic-free, reusable toast overlay.
 * Usage: Place <labs-toast> once in your app (usually near <body>), then call .show() from anywhere.
 * This story demonstrates the default appearance and slot structure only.
 */
export const Default = {
    render: ({ variant }) => {
        const toast = document.createElement('labs-toast');
        toast.setAttribute('variant', variant);
        // Style override for Storybook docs/demo: static position, no transform
        toast.style.position = 'static';
        toast.style.transform = 'none';
        toast.style.margin = '24px auto';
        toast.style.display = 'block';
        function showAndStyle() {
            if (toast._container && toast._message && toast._actionBtn) {
                toast._message.textContent = 'Toast visible for demo';
                toast._actionBtn.textContent = 'Undo';
                toast._container.classList.add('show');
                toast._container.style.position = 'static';
                toast._container.style.transform = 'none';
                toast._container.style.margin = '0 auto';
            }
        }
        showAndStyle();
        setTimeout(showAndStyle, 0);
        return toast;
    },
};