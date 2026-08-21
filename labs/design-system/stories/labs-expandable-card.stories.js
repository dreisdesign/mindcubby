/**
 * Expandable Card - Component Story
 *
 * Demonstrates labs-expandable-card with all available slots.
 */

import '../components/labs-expandable-card.js';
import '../components/labs-button.js';
import '../components/labs-icon.js';

export default {
    title: '2. Components/Card - Expandable',
    component: 'labs-expandable-card',
    parameters: {
        docs: {
            description: {
                component: `
The \`<labs-expandable-card>\` component extends \`<labs-card>\` with fullscreen expand/collapse functionality.
Perfect for editing interfaces, detail views, and modal-like experiences where users need focused, distraction-free editing.

**Available Slots:**
- \`header\` - Card title/header (required)
- \`close\` - Close/expand button (typically contains expand icon button)
- \`description\` - Optional description text below header
- \`input\` - Main content area (grows to fill vertical space when expanded)
- \`actions\` - Footer buttons/actions

**Key Features:**
- Smooth transitions between normal and fullscreen modes
- Fullscreen mode fixes position and fills viewport
- Proper flex layout cascading for input growth
- Body scroll prevention in expanded state
- \`expanded-changed\` event for state synchronization
- Works with design system tokens for theming

**Methods:**
- \`toggleExpanded()\` - Toggle expanded state
- \`setExpanded(bool)\` - Set expanded state programmatically
- \`closeExpanded()\` - Close expanded view
- \`getExpanded()\` - Get current expanded state

**Events:**
- \`expanded-changed\` - Fires when expanded state changes (detail: { expanded: boolean })
        `
            }
        }
    }
};

export const Canonical = () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
    <labs-expandable-card>
      <span slot="header">Daily Note</span>
      
      <labs-button slot="close" variant="icon" data-expand-toggle aria-label="Toggle expand">
        <labs-icon slot="icon-left" name="expand_content" width="24" height="24"></labs-icon>
      </labs-button>
      
      <div slot="description">Click the expand button to enter fullscreen mode. This is the description slot.</div>
      
      <div slot="input">
        <textarea placeholder="Click the expand button to see fullscreen mode..." style="width: 100%; min-height: 150px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; resize: vertical;"></textarea>
      </div>
      
      <div slot="actions" style="display: flex; gap: 10px; justify-content: space-between; font-size: 0.875rem; color: #666;">
        <span id="timestamp">Last edited —</span>
        <div style="display: flex; gap: 8px;">
          <labs-button pill variant="secondary">Cancel</labs-button>
          <labs-button pill variant="primary">Save</labs-button>
        </div>
      </div>
    </labs-expandable-card>
  `;

    const card = wrapper.querySelector('labs-expandable-card');
    const icon = wrapper.querySelector('labs-icon');
    const textarea = wrapper.querySelector('textarea');
    const timestamp = wrapper.querySelector('#timestamp');

    // Icon toggle on expand/collapse
    card.addEventListener('expanded-changed', (e) => {
        icon.setAttribute('name', e.detail.expanded ? 'collapse_content' : 'expand_content');
    });

    // Update timestamp on input
    textarea.addEventListener('input', () => {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        timestamp.textContent = `Last edited ${time}`;
    });

    return wrapper;
};
Canonical.storyName = 'Canonical';
