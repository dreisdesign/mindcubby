import '../components/labs-dropdown.js';
import '../components/labs-list-item.js';


export default {
    title: '2. Components/Dropdown',
    component: 'labs-dropdown',
    parameters: {
        docs: {
            description: {
                component: 'Canonical dropdown: show/hide Archive, Restore, Delete actions. No state logic.'
            }
        }
    },
    argTypes: {
        actionCombo: {
            name: 'Actions',
            control: { type: 'radio' },
            options: [
                'delete',
                'archive',
                'restore',
                'delete,archive',
                'delete,restore'
            ],
            mapping: {
                'delete': ['delete'],
                'archive': ['archive'],
                'restore': ['restore'],
                'delete,archive': ['delete', 'archive'],
                'delete,restore': ['delete', 'restore']
            },
            defaultValue: 'delete',
            description: 'Allowed action combinations only'
        }
    },
    args: {
        actionCombo: 'delete',
    }
};



// pattern stories moved to `patterns-dropdown.stories.js`



export const APIControls = ({ actionCombo = 'delete' } = {}) => {
    const wrap = document.createElement('div');
    wrap.style.padding = '20px';
    wrap.innerHTML = '';
    const dd = document.createElement('labs-dropdown');
    dd.setAttribute('open', '');
    const actions = Array.isArray(actionCombo)
        ? actionCombo
        : (actionCombo ? actionCombo.split(',') : []);
    if (actions.length) dd.setAttribute('only', actions.join(','));
    wrap.appendChild(dd);
    return wrap;
};
APIControls.storyName = 'API / Controls';
APIControls.args = {
    actionCombo: 'delete',
};




// pattern stories moved to `patterns-dropdown.stories.js`
